import type { ProcessedEvent } from '../types/Analytics';
import { Trophy, FileText, ArrowUpRight } from 'lucide-react';

const parseCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(val);
};

interface ExecutiveSummaryProps {
    events: ProcessedEvent[];
}

export function ExecutiveSummary({ events }: ExecutiveSummaryProps) {
    if (events.length === 0) return null;

    // Logic for Comparison (simple default: take the top 3 by revenue if specific targets aren't found)
    const targets = ['BIKINI', 'ERRO 404', 'EMBRAZA'];
    // Try to find target events, otherwise fallback to top events
    let comparison = events.filter(e => targets.some(t => e.name.includes(t)));
    if (comparison.length === 0) {
        comparison = [...events].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 3);
    }

    // Calculate Winner and Insights
    const sortedByRevenue = [...comparison].sort((a, b) => b.totalRevenue - a.totalRevenue);
    const winner = sortedByRevenue[0];
    const lowestAvgTicket = [...comparison].sort((a, b) => a.avgTicket - b.avgTicket)[0];

    return (
        <div className="relative overflow-hidden rounded-3xl bg-black p-8 text-white shadow-2xl transition-all hover:shadow-emerald-500/10">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none mix-blend-screen" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-900/20 rounded-full blur-3xl pointer-events-none mix-blend-screen" />

            <div className="relative z-10">
                <div className="flex flex-col lg:flex-row gap-8 items-start justify-between">

                    {/* Main Insight Text */}
                    <div className="lg:max-w-2xl space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                                <FileText className="text-emerald-400 w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight text-white">
                                Resumo Executivo (C-Level)
                            </h2>
                        </div>

                        <div className="space-y-4">
                            <p className="text-lg leading-relaxed text-zinc-300 font-light">
                                Na análise comparativa das edições recentes, o evento
                                <strong className="text-emerald-400 font-bold mx-2 uppercase tracking-wide border-b border-emerald-500/30">
                                    {winner?.name || 'ANALISANDO...'}
                                </strong>
                                consolidou-se como o líder de performance, gerando
                                <span className="bg-white/10 px-2 py-0.5 rounded ml-2 text-white font-mono font-bold border border-white/20">
                                    {parseCurrency(winner?.totalRevenue || 0)}
                                </span>
                                {' '}em receita bruta.
                            </p>

                            <div className="bg-amber-950/30 border border-amber-500/20 rounded-xl p-4 flex gap-3">
                                <div className="mt-1">
                                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                </div>
                                <div className="space-y-1">
                                    <strong className="text-amber-400 uppercase tracking-wider text-xs font-bold block">
                                        Insight Estratégico
                                    </strong>
                                    {lowestAvgTicket && (
                                        <p className="text-amber-100/80 text-sm leading-relaxed">
                                            Atenção para a edição <strong className="text-amber-200">{lowestAvgTicket.name}</strong>, que apresentou o menor Ticket Médio ({parseCurrency(lowestAvgTicket.avgTicket)}).
                                            Recomenda-se revisar a precificação de lotes iniciais.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Winner Card */}
                    <div className="w-full lg:w-auto min-w-[320px]">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-xl transform transition-transform hover:scale-[1.02]">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h4 className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">
                                        Vencedor da Rodada
                                    </h4>
                                    <p className="font-bold text-2xl text-white">{winner?.name}</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
                                    <Trophy size={24} />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-3xl font-bold text-emerald-400 tracking-tight">
                                        {parseCurrency(winner?.totalRevenue || 0)}
                                    </p>
                                    <div className="flex items-center gap-1 text-emerald-500/80 text-sm mt-1">
                                        <ArrowUpRight size={14} />
                                        <span>Performance Líder</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1">Pagantes</p>
                                        <p className="font-semibold text-white">{winner?.totalPayingQty}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400 mb-1">Ticket Médio</p>
                                        <p className="font-semibold text-white">{parseCurrency(winner?.avgTicket || 0)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
