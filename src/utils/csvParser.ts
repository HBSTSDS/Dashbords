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

    // Advanced Metrics state
    let captureSalesDetails = false;
    let ages: number[] = [];
    let posCount = 0;
    let siteCount = 0;
    let appCount = 0;

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

            // Calculate Avg Age
            const avgAge = ages.length > 0 ? ages.reduce((a, b) => a + b, 0) / ages.length : 0;

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
                preSaleQty: preSaleQty,
                avgAge: Math.round(avgAge),
                salesChannels: {
                    pos: posCount,
                    site: siteCount,
                    app: appCount
                }
            });
        }
        currentEvent = null;
        dailySales = [];
        ages = [];
        posCount = 0;
        siteCount = 0;
        appCount = 0;
        captureDaily = false;
        captureSalesDetails = false;
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

        // 5. Detect Detailed Sales / Ticket List (Header "Canal de Venda" or similar)
        // Heuristics: user mentioned "canal de compra", "data de nascimento"
        // Let's assume there's a block "DETALHE DE VENDAS" or just headers
        if (cleanCols.includes('Canal de Compra') || cleanCols.includes('Data de Nascimento')) {
            captureSalesDetails = true;
            captureDaily = false; // Stop daily
            continue;
        }

        if (captureSalesDetails && currentEvent && cleanCols.length > 5) {
            // Try to find index of "Data de Nascimento" and "Canal" dynamically?
            // For now, let's assume standard positions from a sample ZIG/Ingresse export if we knew it.
            // Without sample, I'll search the header line logic above and map indices.
            // Simplified: Assume "Canal" is around index 5 and "Nascimento" around index 10?
            // Wait, I cannot guess.
            // User: "no arquivo csv tem um coluna canal de compra nela tem 3 opções pos, site e zip app"
            // "e tambem... data de nascimento"

            // Let's try to parse Age from any column that looks like a date and isn't the transaction date?
            // Better: Look for "pos", "site", "app" in the line.
            const lowerLine = line.toLowerCase();
            if (lowerLine.includes('pos')) posCount++;
            else if (lowerLine.includes('site')) siteCount++;
            else if (lowerLine.includes('app') || lowerLine.includes('zip')) appCount++;

            // Age: Look for birth date (DD/MM/YYYY) that results in age > 10 and < 100
            // Find all date patterns
            const dates = line.match(/\d{2}\/\d{2}\/\d{4}/g);
            if (dates) {
                // Determine which one is birthdate. Usually birthdate is far in past compared to event date (2025)
                // Event is 2025. Birthdate should be < 2010.
                dates.forEach(d => {
                    const parts = d.split('/');
                    const year = parseInt(parts[2]);
                    if (year < 2015 && year > 1940) { // Reasonable birth year range
                        const age = 2025 - year; // Approximate age
                        ages.push(age);
                    }
                });
            }
        }
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

export const processDualCSV = (_summaryCsv: string, _dailyCsv: string): ProcessedEvent[] => {
    // Legacy placeholder or redirect to report parser if user uploaded one file?
    // For now, let's just return empty array if called directly with bad data, 
    // but strictly this function was for the "Ideal" CSV format.
    // We will implement a smart detector in DataManagement.
    return [];
};

export const processEventData = (rows: any[]): ProcessedEvent => {
    // Identify Summary Row vs Daily Rows
    // We use 'any' for rows because they are mixed types at runtime
    const summaryRow = rows.find(r => r.porta_revenue_brl !== undefined) as any;
    const dailyRows = rows.filter(r => r.sales_date !== undefined) as any[];

    if (!summaryRow) {
        // If we only have daily rows, try to construct summary from them?
        // Or throw error?
        // Let's return a partial event
        const id = dailyRows[0]?.edition_id || 'unknown';
        const name = dailyRows[0]?.edition_name || 'Unknown Event';
        const date = dailyRows[0]?.edition_date || new Date().toISOString().split('T')[0];

        const preSaleRevenue = dailyRows.reduce((a, b) => a + (Number(b.revenue_brl) || 0), 0);
        const preSaleQty = dailyRows.reduce((a, b) => a + (Number(b.sales_count) || 0), 0);

        return {
            id, name, date,
            totalRevenue: preSaleRevenue,
            totalAudience: preSaleQty,
            totalPayingQty: preSaleQty,
            cortesias: 0,
            percentPaying: 100,
            avgTicket: preSaleQty ? preSaleRevenue / preSaleQty : 0,
            doorRevenue: 0,
            doorQty: 0,
            doorTM: 0,
            dailySales: dailyRows,
            preSaleRevenue,
            preSaleQty,
            salesChannels: { pos: 0, site: 0, app: 0 },
            coupons: {}
        };
    }

    const totalRevenue = Number(summaryRow.total_revenue_brl) || 0;
    const totalAudience = Number(summaryRow.total_tickets) || 0;
    const cortesias = Number(summaryRow.cortesias) || 0;
    const doorRevenue = Number(summaryRow.porta_revenue_brl) || 0;
    const doorQty = Number(summaryRow.porta_tickets) || 0;

    const totalPayingQty = Math.max(0, totalAudience - cortesias);
    const percentPaying = totalAudience > 0 ? (totalPayingQty / totalAudience) * 100 : 0;
    const avgTicket = totalPayingQty > 0 ? totalRevenue / totalPayingQty : 0;
    const doorTM = doorQty > 0 ? doorRevenue / doorQty : 0;

    const preSaleRevenue = dailyRows.reduce((a, b) => a + (Number(b.revenue_brl) || 0), 0);
    const preSaleQty = dailyRows.reduce((a, b) => a + (Number(b.sales_count) || 0), 0);

    return {
        id: summaryRow.edition_id,
        name: summaryRow.edition_name,
        date: summaryRow.edition_date,
        totalRevenue,
        totalAudience,
        totalPayingQty,
        cortesias,
        percentPaying,
        avgTicket,
        doorRevenue,
        doorQty,
        doorTM,
        dailySales: dailyRows,
        preSaleRevenue,
        preSaleQty,
        salesChannels: { pos: 0, site: 0, app: 0 },
        coupons: {}
    };
};

// Parser for "dados_consolidados.csv" (Granular Ticket List)
export const processConsolidatedCSV = (csv: string): ProcessedEvent[] => {
    const lines = csv.split('\n');
    const eventsMap: Record<string, ProcessedEvent> = {};

    // Helper to extract date/name from Source_File (e.g. "Brassa_09_01_2026.xlsx")
    const extractEventInfo = (filename: string) => {
        const clean = filename.replace('.xlsx', '').replace('.csv', '');
        const parts = clean.match(/(.*)_(\d{2}_\d{2}_\d{4})$/);
        if (parts) {
            return {
                name: parts[1].replace(/_/g, ' '),
                date: parts[2].split('_').reverse().join('-') // 2026-01-09
            };
        }
        return { name: clean, date: new Date().toISOString().split('T')[0] };
    };

    // Helper to calculate age from birthdate string (YYYY-MM-DD or DD/MM/YYYY)
    const calculateAge = (dob: string) => {
        if (!dob) return 0;
        const birthDate = new Date(dob);
        if (isNaN(birthDate.getTime())) return 0;
        const ageDifMs = Date.now() - birthDate.getTime();
        const ageDate = new Date(ageDifMs);
        const age = Math.abs(ageDate.getUTCFullYear() - 1970);
        return (age > 10 && age < 100) ? age : 0;
    };

    // Skip Header
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Split by semicolon (common in Brazilian CSVs)
        const cols = line.split(';').map(c => c.trim());

        // Ensure minimum columns (Source_File is at index 28)
        if (cols.length < 28) continue;

        const status = cols[2]?.toLowerCase();
        if (status !== 'finalizado' && status !== 'aprovado') continue; // Count only valid sales

        const sourceFile = cols[28];
        const { name, date } = extractEventInfo(sourceFile);
        const eventId = `evt-${date}-${name.replace(/\s/g, '')}`;

        if (!eventsMap[eventId]) {
            eventsMap[eventId] = {
                id: eventId,
                name: name,
                date: date,
                totalRevenue: 0,
                totalAudience: 0,
                totalPayingQty: 0,
                cortesias: 0,
                percentPaying: 0,
                avgTicket: 0,
                doorRevenue: 0,
                doorQty: 0,
                doorTM: 0,
                barRevenue: 0,
                dailySales: [], // Can generate later if needed
                preSaleRevenue: 0,
                preSaleQty: 0,
                onlineRevenue: 0,
                salesChannels: { pos: 0, site: 0, app: 0 },
                coupons: {},
                location: 'Rio de Janeiro', // Default or extract
                avgAge: 0,
                // Temp vars for average calculation
                // @ts-ignore
                _ageSum: 0,
                // @ts-ignore
                _ageCount: 0
            };
        }

        const evt = eventsMap[eventId];

        // Metrics
        const channel = cols[3]?.toLowerCase(); // site, pos, zigapp
        const price = parseFloat(cols[12]?.replace(',', '.') || '0');
        const isCortesia = price === 0 || cols[8]?.toLowerCase().includes('cortesia');

        evt.totalAudience++;
        if (!isCortesia) {
            evt.totalPayingQty++;
            evt.totalRevenue += price;
        } else {
            evt.cortesias++;
        }

        // Channels & Types
        if (channel.includes('pos') || channel.includes('portaria')) {
            evt.salesChannels!.pos++;
            evt.doorRevenue += price;
            if (!isCortesia) evt.doorQty++;
        } else {
            // Online
            if (channel.includes('app') || channel.includes('zig')) evt.salesChannels!.app++;
            else evt.salesChannels!.site++;

            evt.onlineRevenue = (evt.onlineRevenue || 0) + price;
            evt.preSaleRevenue += price;
            evt.preSaleQty++;
        }

        // Coupons
        const coupon = cols[15];
        if (coupon && coupon.length > 2) {
            evt.coupons = evt.coupons || {};
            evt.coupons[coupon] = (evt.coupons[coupon] || 0) + 1;
        }

        // Demographics
        const birthDate = cols[20]; // YYYY-MM-DD HH:mm:ss
        if (birthDate) {
            const age = calculateAge(birthDate.split(' ')[0]);
            if (age > 0) {
                // @ts-ignore
                evt._ageSum += age;
                // @ts-ignore
                evt._ageCount++;
            }
        }
    }

    // Post-process events
    return Object.values(eventsMap).map(evt => {
        // Calculate averages
        // @ts-ignore
        if (evt._ageCount > 0) evt.avgAge = evt._ageSum / evt._ageCount;

        if (evt.totalPayingQty > 0) evt.avgTicket = evt.totalRevenue / evt.totalPayingQty;
        if (evt.totalAudience > 0) evt.percentPaying = (evt.totalPayingQty / evt.totalAudience) * 100;
        if (evt.doorQty > 0) evt.doorTM = evt.doorRevenue / evt.doorQty;

        // Clean temp props
        // @ts-ignore
        delete evt._ageSum;
        // @ts-ignore
        delete evt._ageCount;

        return evt;
    });
};
