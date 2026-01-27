const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join(__dirname, '../../dados_consolidados.csv');

// Helper to parse currency "70" or "70,00" -> 70.00
const parseValue = (val) => {
    if (!val) return 0;
    // Remove "R$ ", dots, and replace comma with dot
    const clean = val.replace(/R\$\s?|"/g, '').replace(/\./g, '').replace(',', '.').trim();
    return parseFloat(clean) || 0;
};

// Helper to parse filename "Brassa_09_01_2026.xlsx" -> { name: "Brassa", date: "2026-01-09" }
const parseSourceFile = (filename) => {
    if (!filename) return null;
    // Remove extension
    const nameNoExt = filename.replace(/\.xlsx$/i, '').replace(/\.csv$/i, '');

    // Split by underscore
    const parts = nameNoExt.split('_');

    // Expect at least 4 parts for Name_DD_MM_YYYY, but name can have underscores?
    // Let's assume the LAST 3 parts are DD, MM, YYYY.
    if (parts.length < 4) return { name: nameNoExt, date: '2026-01-01' }; // Fallback

    const year = parts[parts.length - 1];
    const month = parts[parts.length - 2];
    const day = parts[parts.length - 3];

    const nameParts = parts.slice(0, parts.length - 3);
    const name = nameParts.join(' ');

    return {
        name: name,
        date: `${year}-${month}-${day}` // ISO format
    };
};

try {
    const data = fs.readFileSync(CSV_PATH, 'utf8');
    const lines = data.split('\n');

    // Header is line 0
    // 12: Valor do ingresso
    // 15: Código do Cupom
    // 28: Source_File

    const eventsMap = {};

    // Start from line 1
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Split by semicolon
        const cols = line.split(';');

        // Safety check
        if (cols.length < 20) continue;

        const sourceFile = cols[28] ? cols[28].trim() : '';
        const valorStr = cols[12];
        const cupom = cols[15] ? cols[15].trim() : '';
        const status = cols[2] ? cols[2].trim().toLowerCase() : '';

        // Ignore cancelled purchases if necessary? 
        // User asked to "add events", usually implies sales.
        // Assuming "finalizado" or "aprovado" status. 
        // Let's check the CSV sample: "finalizado" seems to be the one.
        // But let's include everything for now, or maybe exclude 'cancelado'?
        // Sample shows 'finalizado' and 'Não Realizado' in Checkin column, but Status column says 'finalizado'.
        // Let's assume all lines in this consolidated file are valid sales unless 'Status da compra' says otherwise.

        if (status.includes('cancelado') || status.includes('falha')) continue;

        const eventInfo = parseSourceFile(sourceFile);
        if (!eventInfo) continue;

        const eventKey = `${eventInfo.name}|${eventInfo.date}`;

        if (!eventsMap[eventKey]) {
            eventsMap[eventKey] = {
                id: `evt-auto-${i}`,
                name: `${eventInfo.name} (${eventInfo.date.split('-').reverse().join('/')})`,
                date: eventInfo.date,
                totalRevenue: 0,
                totalAudience: 0, // Total tickets sold
                cortesias: 0,
                coupons: {}, // Map Code -> Count
                totalCoupons: 0
            };
        }

        const evt = eventsMap[eventKey];
        const val = parseValue(valorStr);

        evt.totalRevenue += val;
        evt.totalAudience += 1;

        // Logic for Cortesia: Value 0 or specified
        if (val === 0) {
            evt.cortesias += 1;
        }

        // Coupon Logic
        if (cupom && cupom.length > 2) { // Ignore small noise
            const cupomKey = cupom.toUpperCase();
            evt.coupons[cupomKey] = (evt.coupons[cupomKey] || 0) + 1;
            evt.totalCoupons += 1;
        }
    }

    // Convert map to array and formatting
    const events = Object.values(eventsMap).map(evt => {
        // Sort coupons by usage
        const sortedCoupons = Object.entries(evt.coupons)
            .sort(([, a], [, b]) => b - a)
            .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

        // Derived stats
        const totalPayingQty = Math.max(0, evt.totalAudience - evt.cortesias);
        const percentPaying = evt.totalAudience > 0 ? (totalPayingQty / evt.totalAudience) * 100 : 0;
        const avgTicket = totalPayingQty > 0 ? evt.totalRevenue / totalPayingQty : 0;

        return {
            ...evt,
            totalPayingQty,
            percentPaying,
            avgTicket,
            // Add placeholders for other fields required by ProcessedEvent
            doorRevenue: 0,
            doorQty: 0,
            doorTM: 0,
            dailySales: [], // No daily breakdown from this aggregation yet
            preSaleRevenue: evt.totalRevenue,
            preSaleQty: evt.totalAudience,
            coupons: sortedCoupons
        };
    });

    console.log(JSON.stringify(events, null, 2));

} catch (err) {
    console.error('Error processing CSV:', err);
}
