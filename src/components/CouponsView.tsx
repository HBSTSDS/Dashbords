import { useState, useMemo } from 'react';
import type { ProcessedEvent } from '../types/Analytics';
import { KPICard } from './KPICard';
import { Ticket, TrendingUp, Award, BarChart3, Search, ArrowRightLeft, Calendar, X, ChevronDown } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

interface CouponsViewProps {
    events: ProcessedEvent[];
}

export function CouponsView({ events }: CouponsViewProps) {
    const [selectedEventId, setSelectedEventId] = useState<string>('all');
    // Multi-select state
    const [selectedComparisonCoupons, setSelectedComparisonCoupons] = useState<string[]>([]);
    const [couponSearch, setCouponSearch] = useState('');
    const [isCouponDropdownOpen, setIsCouponDropdownOpen] = useState(false);

    // Event Dropdown State
    const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);
    const [eventSearch, setEventSearch] = useState('');

    const filteredEvents = useMemo(() => {
        if (selectedEventId === 'all') return events;
        return events.filter(e => e.id === selectedEventId);
    }, [events, selectedEventId]);

    // Filter events for dropdown
    const searchedEvents = useMemo(() => {
        const term = eventSearch.toLowerCase();
        return events.filter(e => e.name.toLowerCase().includes(term));
    }, [events, eventSearch]);

    const handleEventSelect = (id: string) => {
        setSelectedEventId(id);
        setIsEventDropdownOpen(false);
        setEventSearch('');
    };

    const getSelectedEventName = () => {
        if (selectedEventId === 'all') return 'Todas as Edições';
        return events.find(e => e.id === selectedEventId)?.name || 'Evento não encontrado';
    };

    // List of unique coupons based on current filter (Event or All)
    const availableCoupons = useMemo(() => {
        const set = new Set<string>();
        filteredEvents.forEach(evt => {
            if (evt.coupons) {
                Object.keys(evt.coupons).forEach(code => set.add(code));
            }
        });
        return Array.from(set).sort();
    }, [filteredEvents]);

    // Filter available coupons by search
    const searchedCoupons = useMemo(() => {
        if (!couponSearch) return availableCoupons;
        return availableCoupons.filter(c => c.toLowerCase().includes(couponSearch.toLowerCase()));
    }, [availableCoupons, couponSearch]);

    const toggleCouponSelection = (code: string) => {
        setSelectedComparisonCoupons(prev =>
            prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
        );
        setCouponSearch(''); // clear search on select? Optional.
    };


    // 1. Calculate General Stats (Based on Filter)
    const totalCouponsUsed = useMemo(() => {
        return filteredEvents.reduce((acc, evt) => acc + (evt.coupons ? Object.values(evt.coupons).reduce((a, b) => a + b, 0) : 0), 0);
    }, [filteredEvents]);

    const eventWithMostCoupons = useMemo(() => {
        return [...filteredEvents].sort((a, b) => {
            const countA = a.coupons ? Object.values(a.coupons).reduce((sum, v) => sum + v, 0) : 0;
            const countB = b.coupons ? Object.values(b.coupons).reduce((sum, v) => sum + v, 0) : 0;
            return countB - countA;
        })[0];
    }, [filteredEvents]);

    const topCouponsGlobal = useMemo(() => {
        const globalCounts: Record<string, number> = {};

        filteredEvents.forEach(evt => {
            if (evt.coupons) {
                Object.entries(evt.coupons).forEach(([code, count]) => {
                    globalCounts[code] = (globalCounts[code] || 0) + count;
                });
            }
        });
        return Object.entries(globalCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([name, value]) => ({ name, value }));
    }, [filteredEvents]);

    // Comparison Logic - Multi
    const comparisonData = useMemo(() => {
        if (selectedComparisonCoupons.length === 0) return [];

        const data = selectedComparisonCoupons.map((code, idx) => {
            let total = 0;
            filteredEvents.forEach(evt => {
                if (evt.coupons && evt.coupons[code]) {
                    total += evt.coupons[code];
                }
            });
            // Generate some colors
            const colors = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
            return {
                name: code,
                value: total,
                fill: colors[idx % colors.length]
            };
        });

        return data.sort((a, b) => b.value - a.value);
    }, [filteredEvents, selectedComparisonCoupons]);

    const couponsByEventData = useMemo(() => {
        return [...events]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map(evt => {
                const totalC = evt.coupons ? Object.values(evt.coupons).reduce((a, b) => a + b, 0) : 0;
                return {
                    name: evt.name,
                    date: evt.date,
                    coupons: totalC,
                    audience: evt.totalAudience,
                    penetration: evt.totalAudience > 0 ? (totalC / evt.totalAudience * 100) : 0
                };
            });
    }, [events]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <Ticket className="text-emerald-500" />
                        Gestão de Cupons
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400">Análise de performance de promotores e códigos.</p>
                </div>

                {/* Event Filter (Custom Dropdown) */}
                <div className="relative min-w-[300px] z-30">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={16} />
                        <input
                            type="text"
                            placeholder={getSelectedEventName()} // Show current selection as placeholder or value?
                            // Better UX: Show selection if not open, show search if open?
                            // Let's keep it simple: Placeholder is "Buscar evento..." and we show current selection below or as value derived.
                            // Actually, let's behave like a standard combobox:
                            value={isEventDropdownOpen ? eventSearch : getSelectedEventName()}
                            onChange={(e) => {
                                setEventSearch(e.target.value);
                                if (!isEventDropdownOpen) setIsEventDropdownOpen(true);
                            }}
                            onClick={() => {
                                if (!isEventDropdownOpen) {
                                    setIsEventDropdownOpen(true);
                                    setEventSearch(''); // Clear to show full list on first click?
                                }
                            }}
                            className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-zinc-900 dark:text-white cursor-pointer"
                            readOnly={!isEventDropdownOpen} // Prevent typing if not "searching" mode? No, let user type to search.
                        />
                        <button
                            onClick={() => setIsEventDropdownOpen(!isEventDropdownOpen)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                        >
                            <ChevronDown size={16} className={`transition-transform ${isEventDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                    </div>

                    {isEventDropdownOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsEventDropdownOpen(false)} />
                            <div className="absolute top-full left-0 right-0 mt-2 max-h-[300px] overflow-y-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-20 animate-in fade-in zoom-in-95 duration-100">
                                <button
                                    onClick={() => handleEventSelect('all')}
                                    className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between transition-colors border-b border-zinc-100 dark:border-zinc-800 ${selectedEventId === 'all'
                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                                            : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                                        }`}
                                >
                                    <span className="font-medium">Todas as Edições</span>
                                    {selectedEventId === 'all' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                                </button>

                                {searchedEvents.length > 0 ? (
                                    searchedEvents.map(e => (
                                        <button
                                            key={e.id}
                                            onClick={() => handleEventSelect(e.id)}
                                            className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors ${selectedEventId === e.id
                                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                                                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                                                }`}
                                        >
                                            <div className="flex flex-col gap-0.5">
                                                <span className="truncate">{e.name}</span>
                                                <span className="text-xs text-zinc-400">{new Date(e.date).toLocaleDateString()}</span>
                                            </div>
                                            {selectedEventId === e.id && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-4 py-3 text-sm text-zinc-400 text-center">Nenhum evento encontrado</div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KPICard
                    title="Total de Cupons Usados"
                    value={totalCouponsUsed.toString()}
                    trend={selectedEventId === 'all' ? "Todas as edições" : "Edição selecionada"}
                    trendUp={true}
                    icon={Ticket}
                />
                <KPICard
                    title="Evento Destaque"
                    value={eventWithMostCoupons?.name.split('(')[0] || '-'}
                    trend={`${eventWithMostCoupons?.coupons ? Object.values(eventWithMostCoupons.coupons).reduce((a, b) => a + b, 0) : 0} usos`}
                    trendUp={true}
                    icon={Award}
                />
                <KPICard
                    title="Cupom #1 (Seleção)"
                    value={topCouponsGlobal[0]?.name || '-'}
                    trend={`${topCouponsGlobal[0]?.value || 0} usos`}
                    trendUp={true}
                    icon={TrendingUp}
                />
            </div>

            {/* Comparison Section */}
            <div className="rounded-2xl border border-white/20 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:bg-zinc-900/80 dark:border-zinc-800/50">
                <h3 className="mb-6 text-lg font-bold text-zinc-800 dark:text-white flex items-center gap-2">
                    <ArrowRightLeft className="w-5 h-5 text-indigo-500" />
                    Comparador de Cupons
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-6 col-span-1">

                        {/* Selector Area */}
                        <div className="relative">
                            <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2 block">
                                Selecionar Cupons
                            </label>

                            {/* Search Input */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Buscar cupom..."
                                    value={couponSearch}
                                    onFocus={() => setIsCouponDropdownOpen(true)}
                                    // Blur needs delay to allow click
                                    // onBlur={() => setTimeout(() => setIsCouponDropdownOpen(false), 200)}
                                    onChange={(e) => setCouponSearch(e.target.value)}
                                    className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-zinc-900 dark:text-white placeholder-zinc-400"
                                />
                                <button
                                    onClick={() => setIsCouponDropdownOpen(!isCouponDropdownOpen)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                                >
                                    <ChevronDown size={16} className={`transition-transform ${isCouponDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>
                            </div>

                            {/* Dropdown Menu */}
                            {isCouponDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-2 max-h-[250px] overflow-y-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-20 animate-in fade-in zoom-in-95 duration-100">
                                    {searchedCoupons.length > 0 ? (
                                        searchedCoupons.map(code => {
                                            const isSelected = selectedComparisonCoupons.includes(code);
                                            return (
                                                <button
                                                    key={code}
                                                    onClick={() => toggleCouponSelection(code)}
                                                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors ${isSelected
                                                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                                                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                                                        }`}
                                                >
                                                    <span>{code}</span>
                                                    {isSelected && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                                                </button>
                                            );
                                        })
                                    ) : (
                                        <div className="px-4 py-3 text-sm text-zinc-400 text-center">Nenhum cupom encontrado</div>
                                    )}
                                </div>
                            )}

                            {/* Backdrop to close dropdown */}
                            {isCouponDropdownOpen && (
                                <div className="fixed inset-0 z-10" onClick={() => setIsCouponDropdownOpen(false)} />
                            )}
                        </div>

                        {/* Selected Tags */}
                        {selectedComparisonCoupons.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {selectedComparisonCoupons.map(code => (
                                    <span key={code} className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-medium border border-emerald-200 dark:border-emerald-800/50">
                                        {code}
                                        <button onClick={() => toggleCouponSelection(code)} className="hover:text-emerald-900 dark:hover:text-emerald-100">
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                                <button
                                    onClick={() => setSelectedComparisonCoupons([])}
                                    className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-600 underline"
                                >
                                    Limpar tudo
                                </button>
                            </div>
                        )}

                        <p className="text-xs text-zinc-400">
                            *Comparação respeita o filtro de evento acima. Selecione múltiplos cupons para comparar.
                        </p>
                    </div>

                    <div className="col-span-1 md:col-span-2 h-[200px]">
                        {comparisonData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={comparisonData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.1} />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        width={100}
                                        tick={{ fontSize: 12, fill: '#71717a' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="value" barSize={30} radius={[0, 4, 4, 0]}>
                                        {comparisonData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-400 text-sm border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-xl gap-2">
                                <Search size={24} className="opacity-20" />
                                <p>Selecione cupons na lista ao lado para comparar</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Coupons Chart */}
                <div className="rounded-2xl border border-white/20 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:bg-zinc-900/80 dark:border-zinc-800/50">
                    <h3 className="mb-6 text-lg font-bold text-zinc-800 dark:text-white flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-emerald-500" />
                        Top 10 Cupons (Seleção)
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topCouponsGlobal} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e4e4e7" className="dark:opacity-10" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={100}
                                    tick={{ fill: '#71717a', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                    {topCouponsGlobal.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={index < 3 ? '#10b981' : '#a7f3d0'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Coupons by Event Table (Always Global Context) */}
                <div className="rounded-2xl border border-white/20 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:bg-zinc-900/80 dark:border-zinc-800/50 overflow-hidden">
                    <h3 className="mb-6 text-lg font-bold text-zinc-800 dark:text-white flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-emerald-500" />
                        Penetração por Evento (Histórico)
                    </h3>
                    <div className="overflow-y-auto max-h-[300px] pr-2">
                        <table className="w-full text-left text-sm">
                            <thead className="sticky top-0 bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 font-medium">
                                <tr>
                                    <th className="pb-3 pl-2">Evento</th>
                                    <th className="pb-3 text-right">Cupons</th>
                                    <th className="pb-3 text-right">% Público</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {couponsByEventData.map((evt, idx) => (
                                    <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <td className="py-3 pl-2 text-zinc-800 dark:text-zinc-200 truncate max-w-[150px]" title={evt.name}>
                                            {evt.name}
                                        </td>
                                        <td className="py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                                            {evt.coupons}
                                        </td>
                                        <td className="py-3 text-right text-zinc-600 dark:text-zinc-400">
                                            {evt.penetration.toFixed(1)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
