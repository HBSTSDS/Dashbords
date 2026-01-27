import { useState, useMemo, useEffect } from 'react'; // Added useEffect
import { DollarSign, Users, Ticket, Filter, MousePointer2, ArrowRight, Calendar } from 'lucide-react';
import {
    Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';

import { KPICard } from './KPICard';
import { ExecutiveSummary } from './ExecutiveSummary';
import { AIInsights } from './AIInsights';
import { cn } from '../utils/cn';

import type { ProcessedEvent } from '../types/Analytics';

const parseCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(val);
};

const formatPercent = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'percent',
        minimumFractionDigits: 1
    }).format(val / 100);
};


interface DashboardProps {
    events: ProcessedEvent[];
}

export function Dashboard({ events }: DashboardProps) {
    const [selectedEventId, setSelectedEventId] = useState<string>('');

    // Load initial data logic moved to useEventData hook
    useEffect(() => {
        if (events.length > 0 && !selectedEventId) {
            // Default to top revenue
            const top = [...events].sort((a, b) => {
                const grossA = a.totalRevenue + (a.barRevenue || 0);
                const grossB = b.totalRevenue + (b.barRevenue || 0);
                return grossB - grossA;
            })[0];
            setSelectedEventId(top.id);
        }
    }, [events, selectedEventId]);



    const currentEvent = useMemo(() =>
        events.find(e => e.id === selectedEventId) || events[0]
        , [events, selectedEventId]);

    // Derived Data for Charts
    const audienceCompositionData = useMemo(() => {
        if (!currentEvent) return [];
        return [
            { name: 'Pagantes', value: currentEvent.totalPayingQty, fill: '#10b981' }, // Emerald-500
            { name: 'Cortesias', value: currentEvent.cortesias, fill: '#cbd5e1' }, // Slate-300
        ];
    }, [currentEvent]);

    const dailyTrendData = useMemo(() => {
        if (!currentEvent) return [];
        return currentEvent.dailySales.map(d => ({
            date: d.sales_date.split('-').slice(1).reverse().join('/'),
            receita: d.revenue_brl,
            qtd: d.sales_count
        }));
    }, [currentEvent]);

    const topCoupons = useMemo(() => {
        if (!currentEvent || !currentEvent.coupons) return [];
        return Object.entries(currentEvent.coupons)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 6);
    }, [currentEvent]);

    const totalCouponsCount = useMemo(() => {
        if (!currentEvent || !currentEvent.coupons) return 0;
        return Object.values(currentEvent.coupons).reduce((a, b) => a + b, 0);
    }, [currentEvent]);

    if (!currentEvent) return <div className="p-10 text-center">Carregando dados...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Dashboard Analítico</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">Visão detalhada de performance por edição</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Data Management Modal */}
                    {/* Data Management Modal - Disabled/Hidden since using unified data hook. */}
                    {/* <DataManagement 
                        onDataUpdate={(csv) => console.log('Update via Dashboard disabled')}
                        currentEvents={events}
                    /> */}

                    {/* Event Selector */}
                    <div className="relative min-w-[280px] group">
                        <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none group-hover:text-indigo-500 transition-colors" size={18} />
                        <select
                            value={selectedEventId}
                            onChange={(e) => setSelectedEventId(e.target.value)}
                            className="w-full appearance-none pl-11 pr-10 py-3 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-xl shadow-sm text-sm font-medium text-zinc-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all cursor-pointer dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800 truncate"
                        >
                            {[...events].reverse().map(e => (
                                <option key={e.id} value={e.id} className="text-zinc-900 bg-white dark:bg-zinc-900 dark:text-zinc-200 py-2">
                                    {new Date(e.date).toLocaleDateString('pt-BR')} - {e.name}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                            <MousePointer2 size={16} className="text-zinc-400 group-hover:text-indigo-500 transition-colors rotate-12" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Executive Summary Block */}
            <ExecutiveSummary events={events} />

            {/* AI Insights Block */}
            <div className="mb-6">
                {/* Google IA Studio Analysis */}
                <AIInsights data={events as any} />
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <KPICard
                    title="Venda de Ingressos"
                    value={parseCurrency(currentEvent.totalRevenue)}
                    trend="+12%" // Placeholder trend, ideally calculated
                    trendUp={true}
                    icon={Ticket}
                />
                <KPICard
                    title="Faturamento Online"
                    value={parseCurrency(currentEvent.onlineRevenue || currentEvent.preSaleRevenue || 0)}
                    trend="Ingresse"
                    trendUp={true}
                    icon={DollarSign}
                />
                <KPICard
                    title="Ticket Médio"
                    value={parseCurrency(currentEvent.avgTicket)}
                    trend="Por Pagante"
                    trendUp={true} // Neutral/Info
                    icon={Ticket}
                />
                <KPICard
                    title="% Público Pagante"
                    value={`${currentEvent.percentPaying.toFixed(1)}%`}
                    trend={`${currentEvent.totalAudience} Acessos`}
                    trendUp={currentEvent.percentPaying > 70}
                    icon={Users}
                />
                <KPICard
                    title="Receita Portaria"
                    value={parseCurrency(currentEvent.doorRevenue)}
                    trend={`TM: ${parseCurrency(currentEvent.doorTM)}`}
                    trendUp={true}
                    icon={ArrowRight}
                />
                <KPICard
                    title="Receita Bar"
                    value={parseCurrency(currentEvent.barRevenue || 0)}
                    trend={`TM: ${parseCurrency(currentEvent.barTM || 0)}`}
                    trendUp={true}
                    icon={DollarSign}
                />
                <KPICard
                    title="Uso de Cupons"
                    value={totalCouponsCount.toString()}
                    trend="Total Usados"
                    trendUp={true}
                    icon={Ticket}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Evolution Area Chart */}
                <div className="lg:col-span-2 rounded-2xl border border-white/20 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:bg-zinc-900/80 dark:border-zinc-800/50">
                    <h3 className="mb-6 text-lg font-bold text-zinc-800 dark:text-white flex items-center gap-2">
                        <div className="h-6 w-1 rounded-full bg-emerald-500" />
                        Evolução Diária de Vendas
                    </h3>
                    <div className="h-[300px] w-full flex items-center justify-center">
                        {dailyTrendData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dailyTrendData}>
                                    <defs>
                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" className="dark:opacity-10" />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#71717a"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#71717a"
                                        fontSize={12}
                                        tickFormatter={(val) => `R$${val / 1000}k`}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        formatter={(value: number | undefined) => [parseCurrency(value || 0), 'Receita']}
                                        contentStyle={{
                                            borderRadius: '12px',
                                            border: 'none',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)'
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="receita"
                                        stroke="#10b981"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorRev)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-center text-zinc-500 dark:text-zinc-400">
                                <p>Evolução diária não disponível para este evento.</p>
                                <p className="text-xs mt-1 opacity-70">(Dados importados da planilha geral)</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Audience Composition Donut */}
                <div className="rounded-2xl border border-white/20 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:bg-zinc-900/80 dark:border-zinc-800/50">
                    <h3 className="mb-6 text-lg font-bold text-zinc-800 dark:text-white flex items-center gap-2">
                        <div className="h-6 w-1 rounded-full bg-emerald-500" />
                        Composição de Público
                    </h3>
                    <div className="h-[200px] w-full flex items-center justify-center relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={audienceCompositionData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    strokeWidth={0}
                                >
                                    {audienceCompositionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number | undefined) => [value || 0, 'Pessoas']}
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-zinc-900 dark:text-white">{currentEvent.totalAudience}</p>
                                <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest">Acessos</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Pagantes</span>
                            </div>
                            <span className="font-bold text-zinc-900 dark:text-white">{currentEvent.totalPayingQty}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-zinc-300" />
                                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Cortesias / Staff</span>
                            </div>
                            <span className="font-bold text-zinc-900 dark:text-white">{currentEvent.cortesias}</span>
                        </div>
                    </div>
                </div>

                {/* Top Coupons List */}
                <div className="rounded-2xl border border-white/20 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:bg-zinc-900/80 dark:border-zinc-800/50">
                    <h3 className="mb-6 text-lg font-bold text-zinc-800 dark:text-white flex items-center gap-2">
                        <div className="h-6 w-1 rounded-full bg-indigo-500" />
                        Top Cupons
                    </h3>
                    <div className="space-y-4">
                        {topCoupons.length > 0 ? topCoupons.map(([code, count], index) => (
                            <div key={code} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">#{index + 1} {code}</span>
                                    <span className="text-zinc-500">{count} usos</span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-500 rounded-full"
                                        style={{ width: `${(count / topCoupons[0][1]) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )) : (
                            <p className="text-center text-zinc-500 py-10">Nenhum cupom utilizado.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/70 shadow-sm backdrop-blur-xl dark:bg-zinc-900/80 dark:border-zinc-800/50 mt-8">
                <div className="border-b border-emerald-100 p-6 dark:border-zinc-700">
                    <h3 className="text-lg font-bold text-emerald-900 dark:text-white flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-emerald-500" />
                        Histórico de Edições
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-emerald-50/50 text-emerald-900 dark:bg-zinc-900/50 dark:text-emerald-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Data</th>
                                <th className="px-6 py-4 font-semibold">Evento</th>
                                <th className="px-6 py-4 font-semibold text-right">Receita Total</th>
                                <th className="px-6 py-4 font-semibold text-right">Público</th>
                                <th className="px-6 py-4 font-semibold text-right">Ticket Médio</th>
                                <th className="px-6 py-4 font-semibold text-center">% Pagante</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-emerald-50 dark:divide-zinc-800">
                            {events.map((event) => {
                                return (
                                    <tr key={event.id} className="group hover:bg-emerald-50/30 dark:hover:bg-zinc-800/30 transition-colors">
                                        <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-600 dark:text-slate-300">
                                            {event.date}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 font-semibold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                            {event.name}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-right font-medium text-emerald-600 dark:text-emerald-400">
                                            {parseCurrency(event.totalRevenue)}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-right font-bold text-slate-700 dark:text-slate-200">
                                            {event.totalAudience}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-right text-slate-600 dark:text-slate-300">
                                            {parseCurrency(event.avgTicket)}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-center">
                                            <span className={cn(
                                                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold",
                                                event.percentPaying > 70
                                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300"
                                                    : "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300"
                                            )}>
                                                {formatPercent(event.percentPaying)}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
