import type { ProcessedEvent, DailyRow } from '../types/Analytics';

// Generic CSV parser (Keep for legacy or simple CSVs)
export const parseRawCSV = <T>(csv: string): T[] => {
    const lines = csv.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return [];

    // Handle headers with potential quotes
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

    return lines.slice(1).map(line => {
        // Simple split by comma, but robust enough for simple numbers/text
        const values = line.split(',');

        const obj: any = {};
        headers.forEach((header, index) => {
            let val = values[index]?.trim();

            // Remove quotes if present
            if (val && val.startsWith('"') && val.endsWith('"')) {
                val = val.slice(1, -1);
            }

            // Try to parse number if it looks like one (and isn't a date string that shouldn't be number)
            // Note: Parsing "2025-09-27" as number is NaN, which is good.
            if (val !== undefined && val !== '' && !isNaN(Number(val))) {
                obj[header] = Number(val);
            } else {
                obj[header] = val;
            }
        });
        return obj as T;
    });
};

const parseCurrency = (val: string): number => {
    if (!val) return 0;
    // Remove "R$ ", dots, and replace comma with dot
    // Handle "R$ 1.200,00" -> 1200.00
    // Handle "1.200,00" -> 1200.00
    const clean = val.replace(/R\$\s?|"/g, '').replace(/\./g, '').replace(',', '.').trim();
    return parseFloat(clean) || 0;
};

const parseNumber = (val: string): number => {
    if (!val) return 0;
    const clean = val.replace(/\./g, '').replace(/"/g, '').trim();
    return parseInt(clean) || 0;
};

const parseDate = (val: string): string => {
    // Input: dd/mm/yyyy
    // Output: yyyy-mm-dd
    if (!val) return '';
    const parts = val.split('/');
    if (parts.length !== 3) return val; // Fallback
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

export const parseReportCSV = (csv: string): ProcessedEvent[] => {
    const lines = csv.split('\n');
    const events: ProcessedEvent[] = [];

    let currentEvent: Partial<ProcessedEvent> | null = null;
    let dailySales: DailyRow[] = [];
    let captureDaily = false;

    // Helper to finalize event and push
    const finalizeEvent = () => {
        if (currentEvent && currentEvent.name) {
            // Calculate derived if missing
            const totalRevenue = currentEvent.totalRevenue || 0;
            const totalAudience = currentEvent.totalAudience || 0;
            const cortesias = currentEvent.cortesias || 0;
            const totalPayingQty = Math.max(0, totalAudience - cortesias);
            const percentPaying = totalAudience > 0 ? (totalPayingQty / totalAudience) * 100 : 0;
            const avgTicket = totalPayingQty > 0 ? totalRevenue / totalPayingQty : 0;

            // Door specific
            const doorRev = currentEvent.doorRevenue || 0;
            const doorQty = currentEvent.doorQty || 0; // Usually we should parse this from "Porta" row
            const doorTM = doorQty > 0 ? doorRev / doorQty : 0;

            // Pre-sale (everything that is NOT door? Or just sum of daily?)
            // In this report, Daily rows seem to be pre-sales + sales during week?
            // Actually, "Total de Vendas" seems to be the grand total.
            // Let's assume Daily Rows are the breakdown.
            const preSaleRev = dailySales.reduce((acc, curr) => acc + curr.revenue_brl, 0);
            const preSaleQty = dailySales.reduce((acc, curr) => acc + curr.sales_count, 0);

            events.push({
                id: `evt-${events.length + 1}`,
                name: currentEvent.name,
                date: currentEvent.date || new Date().toISOString().split('T')[0],
                totalRevenue,
                totalAudience,
                totalPayingQty,
                cortesias,
                percentPaying,
                avgTicket,
                doorRevenue: doorRev,
                doorQty: doorQty,
                doorTM,
                dailySales: [...dailySales],
                preSaleRevenue: preSaleRev,
                preSaleQty: preSaleQty
            });
        }
        currentEvent = null;
        dailySales = [];
        captureDaily = false;
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // Naive split by comma, respecting quotes for currency
        // Only simple split needed if we handle currency manually
        // But the CSV has "R$ 1.200,00" in quotes.
        // Let's use a simple regex split for this specific format
        // Robust split by comma, ignoring commas inside quotes
        const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const cleanCols = cols.map(c => c.replace(/^"|"$/g, '').trim());

        // 1. Detect Event Header: "PARQUE NAME | DD/MM/YYYY" or "PARQUE NAME|DD/MM/YYYY"
        // Check for presence of '|' and a number (part of date)
        if (cleanCols[0] && cleanCols[0].includes('|') && /\d/.test(cleanCols[0])) {
            // console.log('Detected Event Header:', cleanCols[0]);
            if (currentEvent) finalizeEvent(); // Close previous if exists

            const parts = cleanCols[0].split('|');
            const name = parts[0].trim();
            const date = parseDate(parts[1].trim());

            currentEvent = { name, date };
            continue;
        }

        // 2. Detect Header Row "Data, Dia da Semana..." -> Start capturing daily
        if (cleanCols[0] === 'Data' && (cleanCols[2] === 'Número de Vendas' || cleanCols[2] === 'Qtd')) {
            captureDaily = true;
            continue;
        }

        // 3. Detect Summary Rows
        if (cleanCols[0] === 'Porta') {
            captureDaily = false;
            if (currentEvent) {
                currentEvent.doorQty = parseNumber(cleanCols[2]);
                currentEvent.doorRevenue = parseCurrency(cleanCols[3]);
            }
            continue;
        }
        if (cleanCols[0] === 'Cortesias') {
            if (currentEvent) {
                currentEvent.cortesias = parseNumber(cleanCols[2]);
            }
            continue;
        }
        if (cleanCols[0] === 'Total de Vendas' || cleanCols[0] === 'Tudo') {
            if (currentEvent) {
                currentEvent.totalAudience = parseNumber(cleanCols[2]); // Using Qty col
                currentEvent.totalRevenue = parseCurrency(cleanCols[3]);
            }
            continue;
        }

        // 4. Capture Daily Data
        if (captureDaily && currentEvent && cleanCols.length > 3) {
            // Check if it's a valid date row
            if (cleanCols[0].match(/\d{2}\/\d{2}\/\d{4}/)) {
                dailySales.push({
                    edition_id: currentEvent.name || '',
                    edition_name: currentEvent.name || '',
                    edition_date: currentEvent.date || '',
                    sales_date: parseDate(cleanCols[0]),
                    weekday_pt: cleanCols[1],
                    sales_count: parseNumber(cleanCols[2]),
                    revenue_brl: parseCurrency(cleanCols[3])
                });
            }
        }

        // Safety: If many empty lines, just continue
    }

    // Finalize last event
    if (currentEvent) finalizeEvent();

    return events;
};

// Parser for "EVENTOS NOVA - 2025.csv" (Tabular format)
export const parseEventosNovaCSV = (csv: string): ProcessedEvent[] => {
    const lines = csv.split('\n');
    const events: ProcessedEvent[] = [];

    // Skip header line 0
    // Start from line 1
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Skip SUBTOTAL rows
        if (line.includes('SUBTOTAL')) continue;

        // Split by comma, handling quotes
        const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const cleanCols = cols.map(c => c.replace(/^"|"$/g, '').trim());

        // Expected index:
        // 0: Data, 1: Evento, 2: Local
        // 5: RECEITA INGRESSE, 6: RECEITA PORTA
        // 7: TOTAL INGRESSOS, 9: Vips
        if (cleanCols.length < 10) continue; // Ensure enough columns

        const dateStr = cleanCols[0];
        if (!dateStr.includes('/')) continue; // Skip if no valid date

        const name = `${cleanCols[1]} (${cleanCols[2]})`; // e.g. "Funk Room (Bosque Bar)"
        const date = parseDate(dateStr);

        const recIngresse = parseCurrency(cleanCols[5]);
        const recPorta = parseCurrency(cleanCols[6]);
        const recBar = parseCurrency(cleanCols[12]); // RECEITA BAR (Index 12)
        const tmBar = parseCurrency(cleanCols[11]); // TM de Bar (Index 11)

        // Keep totalRevenue as Ticket+Door to avoid skewing Ticket stats, unless requested otherwise.
        // User asked for "Data of Bar" to be in the dashboard.
        const totalRevenue = recIngresse + recPorta;

        const totalAudience = parseNumber(cleanCols[7]);
        const cortesias = parseNumber(cleanCols[9]);
        const totalPayingQty = Math.max(0, totalAudience - cortesias);

        const percentPaying = totalAudience > 0 ? (totalPayingQty / totalAudience) * 100 : 0;
        const avgTicket = totalPayingQty > 0 ? totalRevenue / totalPayingQty : 0;

        // Door logic
        const doorRev = recPorta;
        const doorQty = 0;

        events.push({
            id: `evt-nova-${i}`,
            name,
            date,
            totalRevenue,
            totalAudience,
            totalPayingQty,
            cortesias,
            percentPaying,
            avgTicket,
            doorRevenue: doorRev,
            doorQty,
            doorTM: 0,
            barRevenue: recBar,
            barTM: tmBar,
            dailySales: [], // This CSV doesn't have daily breakdown
            preSaleRevenue: recIngresse, // Keep legacy field
            onlineRevenue: recIngresse,
            preSaleQty: 0
        });
    }

    return events;
};

// Keep interface for compatibility if needed elsewhere
export const processDualCSV = (_summaryCsv: string, _dailyCsv: string): ProcessedEvent[] => {
    // Legacy placeholder or redirect to report parser if user uploaded one file?
    // For now, let's just return empty array if called directly with bad data, 
    // but strictly this function was for the "Ideal" CSV format.
    // We will implement a smart detector in DataManagement.
    return [];
};
