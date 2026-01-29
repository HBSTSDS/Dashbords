import { Download, FileSpreadsheet } from 'lucide-react';
import { useEventData } from '../hooks/useEventData';
import { useMemo } from 'react';

export function ReportsView() {
    const { events } = useEventData();

    // Calculate Table Data
    const tableData = useMemo(() => {
        return events.map(evt => {
            // 1. Financials
            const totalRevenue = evt.totalRevenue;
            const doorRevenue = evt.doorRevenue;
            const onlineRevenue = evt.onlineRevenue || (totalRevenue - doorRevenue); // Fallback

            // 2. Bar Data (Prioritize manual manualData, then nova CSV barRevenue, then 0)
            // 2. Bar Data (Prioritize manual manualData, then nova CSV barRevenue, then 0)
            const barGross = evt.manualData?.barGrossRevenue || evt.barRevenue || 0;
            const barTM = evt.totalAudience > 0 ? barGross / evt.totalAudience : 0;

            // 3. Costs (Manual only for now)
            const totalCost = evt.manualData?.eventCost || 0;

            // 4. Repasse Real Formula
            // "50% bilheteria - metade do custo do evento + 5% do bar bruto"
            // (TotalRevenue * 0.5) - (TotalCost * 0.5) + (BarGross * 0.05)
            const repasseReal = (totalRevenue * 0.5) - (totalCost * 0.5) + (barGross * 0.05);

            // 5. ROI Formula
            // "(RepasseReal - Cost) / Cost" -> This seems weird if RepasseReal is profit. 
            // Usually ROI = (NetProfit / Cost). 
            // If RepasseReal IS the Net Profit (what we take home), then ROI = RepasseReal / TotalCost ? 
            // User formula: "ROI"
            // Let's assume standard ROI = (Gain - Cost) / Cost. 
            // Since "Repasse Real" sounds like NET TAKE HOME, maybe ROI is (RepasseReal - CostShare?) / CostShare?
            // Wait, Repasse Real is the Agency's share. 
            // If the Agency doesn't pay the full cost (since we subtracted half cost), maybe ROI is just based on that?
            // Let's stick to user request context or standard:
            // Standard ROI = (Revenue - Cost) / Cost.
            // Agency ROI = (RepasseReal - (Cost? No, cost is already deducted)).
            // Let's use a safe Margin calculation or simple metric.
            // Given "Repasse Real" is "what we get", the "Cost" was shared. 
            // If user explicitly asked for ROI, I'll calculate it as: Result / Cost?
            // Actually, let's look at the example prompt: "Custos Totais... ROI".
            // If I invested X and got Y.
            // If Cost is Total Event Cost, we paid 50%.
            // So Investment = TotalCost * 0.5.
            // Return = RepasseReal.
            // ROI = (RepasseReal - Investment) / Investment.
            // ROI = (RepasseReal - (TotalCost * 0.5)) / (TotalCost * 0.5).


            // Let's implement this logic:
            // ROI = Result / Total Cost
            // user request: "o roi eu preciso que seja o resulta dividido pelo custo total"
            // "Result" here is Repasse Real.
            // Formula in render below.

            return {
                id: evt.id,
                name: evt.name,
                date: evt.date,
                repasseReal,
                onlineRevenue,
                doorRevenue,
                totalTickets: evt.totalAudience, // User request: Total Pagantes + Vips
                totalCost,
                vips: evt.cortesias,
                doorTM: evt.totalPayingQty > 0 ? totalRevenue / evt.totalPayingQty : 0, // TM Porta = Receita Bilheteria (Total) / Publico Pagante
                barTM,
                barGross,
                roi: totalCost > 0 ? (repasseReal / totalCost) * 100 : 0, // ROI = Result (Repasse Real) / Cost (Total)
                avgAge: evt.avgAge || 0
            };
        });
    }, [events]);

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const exportToCSV = () => {
        const headers = [
            'Data', 'Evento', 'Repasse Real', 'Rec. Ticketeria', 'Receita Porta',
            'Total Ingressos', 'Custos Totais', 'Vips', 'Idade Média', 'TM Porta', 'TM Bar', 'Receita Bar', 'ROI'
        ];

        const rows = tableData.map(d => [
            new Date(d.date).toLocaleDateString('pt-BR'),
            d.name,
            d.repasseReal.toFixed(2),
            d.onlineRevenue.toFixed(2),
            d.doorRevenue.toFixed(2),
            d.totalTickets,
            d.totalCost.toFixed(2),
            d.vips,
            d.avgAge.toFixed(1),
            d.doorTM.toFixed(2),
            d.barTM.toFixed(2),
            d.barGross.toFixed(2),
            (d.roi / 100).toFixed(4)
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'relatorio_financeiro.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <FileSpreadsheet className="text-emerald-500" />
                        Relatório Financeiro
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Acompanhamento de Repasse, Custos e ROI por evento.
                    </p>
                </div>
                <button
                    onClick={exportToCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
                >
                    <Download size={18} />
                    Exportar CSV
                </button>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-zinc-50 dark:bg-zinc-800/80 text-zinc-500 font-medium border-b border-zinc-100 dark:border-zinc-800 whitespace-nowrap">
                            <tr>
                                <th className="px-4 py-3 sticky left-0 bg-zinc-50 dark:bg-zinc-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Evento</th>
                                <th className="px-4 py-3">Data</th>
                                <th className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50/50 dark:bg-emerald-900/10">Repasse Real</th>
                                <th className="px-4 py-3 text-right">Rec. Ticketeria</th>
                                <th className="px-4 py-3 text-right">Rec. Porta</th>
                                <th className="px-4 py-3 text-right">Ingressos</th>
                                <th className="px-4 py-3 text-right text-red-500">Custos Totais</th>
                                <th className="px-4 py-3 text-right">Vips</th>
                                <th className="px-4 py-3 text-right">Idade Média</th>
                                <th className="px-4 py-3 text-right">TM Porta</th>
                                <th className="px-4 py-3 text-right">TM Bar</th>
                                <th className="px-4 py-3 text-right">Rec. Bar</th>
                                <th className="px-4 py-3 text-right font-bold">ROI</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {tableData.map((row) => (
                                <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white sticky left-0 bg-white dark:bg-zinc-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] truncate max-w-[200px]">
                                        {row.name}
                                    </td>
                                    <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">
                                        {new Date(row.date).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-900/10">
                                        {formatCurrency(row.repasseReal)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400">
                                        {formatCurrency(row.onlineRevenue)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400">
                                        {formatCurrency(row.doorRevenue)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400">
                                        {row.totalTickets}
                                    </td>
                                    <td className="px-4 py-3 text-right text-red-500 dark:text-red-400">
                                        {formatCurrency(row.totalCost)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400">
                                        {row.vips}
                                    </td>
                                    <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400">
                                        {row.avgAge > 0 ? row.avgAge : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400">
                                        {formatCurrency(row.doorTM)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400">
                                        {formatCurrency(row.barTM)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400">
                                        {formatCurrency(row.barGross)}
                                    </td>
                                    <td className={`px-4 py-3 text-right font-bold ${row.roi >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {row.roi.toFixed(1)}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="text-xs text-zinc-400 text-center">
                * Repasse Real = (50% Bilheteria) - (50% Custos) + (5% Bar Bruto). ROI = (Repasse - Investimento) / Investimento. negociação PARQUE Sexta
            </div>
        </div>
    );
}
