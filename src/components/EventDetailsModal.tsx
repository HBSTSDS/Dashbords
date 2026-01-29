import { X, Calendar, DollarSign, Users, Ticket, Tag, Save, Edit2 } from 'lucide-react';
import type { ProcessedEvent } from '../types/Analytics';
import { useState } from 'react';
import { saveManualData } from '../utils/storage';

interface EventDetailsModalProps {
    event: ProcessedEvent | null;
    onClose: () => void;
}

export function EventDetailsModal({ event, onClose }: EventDetailsModalProps) {
    if (!event) return null;

    const parseCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(val);
    };

    const handleCurrencyChange = (value: string, setter: (v: number) => void) => {
        // Logic to allow typing: remove dots, keep comma
        // A simple way is to strip everything non-numeric, divide by 100
        const numericValue = value.replace(/\D/g, '');
        const floatValue = Number(numericValue) / 100;
        setter(floatValue);
    };

    const [isEditing, setIsEditing] = useState(false);
    const [eventCost, setEventCost] = useState(event.manualData?.eventCost || 0);
    const [barRevenue, setBarRevenue] = useState(event.manualData?.barGrossRevenue || event.barRevenue || 0);
    const [location, setLocation] = useState(event.location || event.manualData?.location || '');

    const formatInputValue = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(val);
    };

    const handleSave = () => {
        saveManualData(event.id, {
            eventCost: Number(eventCost),
            barGrossRevenue: Number(barRevenue),
            location: location
        });
        setIsEditing(false);
        // Update local event object immediately for UI feedback (optional, assuming parent re-renders)
    };

    const sortedCoupons = event.coupons
        ? Object.entries(event.coupons).sort(([, a], [, b]) => b - a)
        : [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-zinc-200 dark:border-zinc-800">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
                    <div>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            {event.name}
                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-1.5 text-zinc-400 hover:text-emerald-500 transition-colors ml-2"
                                    title="Editar Dados Financeiros"
                                >
                                    <Edit2 size={16} />
                                </button>
                            )}
                        </h2>
                        <div className="flex items-center gap-4 mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                            <span className="flex items-center gap-1">
                                <Calendar size={14} />
                                {new Date(event.date).toLocaleDateString('pt-BR')}
                            </span>
                            {/* Add venue if available or parse from name */}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="overflow-y-auto p-6 space-y-8">
                    {/* Financial Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center gap-2 text-zinc-500 text-sm mb-2">
                                <DollarSign size={16} className="text-emerald-500" />
                                Receita Total
                            </div>
                            <div className="text-xl font-bold text-zinc-900 dark:text-white">
                                {parseCurrency(event.totalRevenue)}
                            </div>
                        </div>
                        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center gap-2 text-zinc-500 text-sm mb-2">
                                <Users size={16} className="text-blue-500" />
                                Público Total
                            </div>
                            <div className="text-xl font-bold text-zinc-900 dark:text-white">
                                {event.totalAudience}
                            </div>
                        </div>
                        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center gap-2 text-zinc-500 text-sm mb-2">
                                <Ticket size={16} className="text-purple-500" />
                                Ticket Médio
                            </div>
                            <div className="text-xl font-bold text-zinc-900 dark:text-white">
                                {parseCurrency(event.avgTicket)}
                            </div>
                        </div>
                        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center gap-2 text-zinc-500 text-sm mb-2">
                                <Tag size={16} className="text-orange-500" />
                                Cupons Usados
                            </div>
                            <div className="text-xl font-bold text-zinc-900 dark:text-white">
                                {sortedCoupons.reduce((acc, [, count]) => acc + count, 0)}
                            </div>
                        </div>
                    </div>

                    {/* Manual Financial Data Section */}
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                <DollarSign className="text-emerald-500" size={20} />
                                Gestão Financeira (Dados Manuais)
                            </h3>
                            {isEditing && (
                                <button
                                    onClick={handleSave}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    <Save size={16} />
                                    Salvar Alterações
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                                    Custo Total do Evento
                                </label>
                                {isEditing ? (
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-medium z-10">R$</span>
                                        <input
                                            type="text"
                                            value={formatInputValue(eventCost)}
                                            onChange={(e) => handleCurrencyChange(e.target.value, setEventCost)}
                                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-zinc-900 dark:text-white font-medium"
                                            placeholder="0,00"
                                        />
                                    </div>
                                ) : (
                                    <div className="text-lg font-semibold text-zinc-900 dark:text-white">
                                        {parseCurrency(event.manualData?.eventCost || 0)}
                                    </div>
                                )}
                                <p className="text-xs text-zinc-400 mt-1">Usado para calcular ROI e Margem.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                                    Receita Bruta do Bar
                                </label>
                                {isEditing ? (
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-medium z-10">R$</span>
                                        <input
                                            type="text"
                                            value={formatInputValue(barRevenue)}
                                            onChange={(e) => handleCurrencyChange(e.target.value, setBarRevenue)}
                                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-zinc-900 dark:text-white font-medium"
                                            placeholder="0,00"
                                        />
                                    </div>
                                ) : (
                                    <div className="text-lg font-semibold text-zinc-900 dark:text-white">
                                        {parseCurrency(event.manualData?.barGrossRevenue || event.barRevenue || 0)}
                                    </div>
                                )}
                                <p className="text-xs text-zinc-400 mt-1">
                                    {event.manualData?.barGrossRevenue ? 'Valor *manual* (substitui integração)' : 'Valor vindo da integração (se houver)'}
                                </p>
                            </div>

                            <div className="md:col-span-2 border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-2">
                                <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                                    Local do Evento
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="Ex: Espaço Hall"
                                        className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-zinc-900 dark:text-white font-medium"
                                    />
                                ) : (
                                    <div className="text-lg font-semibold text-zinc-900 dark:text-white">
                                        {event.manualData?.location || event.location || 'Local não definido'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Coupons List */}
                    <div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                            <Tag className="text-emerald-500" size={20} />
                            Detalhamento de Cupons
                        </h3>

                        {sortedCoupons.length > 0 ? (
                            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-zinc-50 dark:bg-zinc-800/80 text-zinc-500 font-medium">
                                        <tr>
                                            <th className="px-4 py-3">Código do Cupom</th>
                                            <th className="px-4 py-3 text-right">Qtd. Usos</th>
                                            <th className="px-4 py-3 text-right w-1/3">Participação</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                        {sortedCoupons.map(([code, count], _) => {
                                            const total = sortedCoupons.reduce((acc, [, c]) => acc + c, 0);
                                            const percent = (count / total) * 100;

                                            return (
                                                <tr key={code} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                                    <td className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                                                        {code}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                                        {count}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <span className="text-xs text-zinc-400">{percent.toFixed(1)}%</span>
                                                            <div className="w-20 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-emerald-500 rounded-full"
                                                                    style={{ width: `${percent}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                                <p className="text-zinc-500">Nenhum cupom utilizado neste evento.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
