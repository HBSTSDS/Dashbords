import { Calendar } from 'lucide-react';
import type { ProcessedEvent } from '../types/Analytics';
import { useState } from 'react';
import { EventDetailsModal } from './EventDetailsModal';

interface EventsViewProps {
    events: ProcessedEvent[];
}

export function EventsView({ events }: EventsViewProps) {
    // Sort descending by date for the list
    const sortedEvents = [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const [selectedEvent, setSelectedEvent] = useState<ProcessedEvent | null>(null);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <EventDetailsModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
            <div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Calendar className="text-emerald-500" />
                    Todos os Eventos
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400">Lista completa das edições importadas.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedEvents.map(evt => (
                    <div
                        key={evt.id}
                        onClick={() => setSelectedEvent(evt)}
                        className="group relative overflow-hidden rounded-2xl border border-white/20 bg-white/70 p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 backdrop-blur-xl dark:bg-zinc-900/80 dark:border-zinc-800/50 cursor-pointer"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-50 text-zinc-200 dark:text-zinc-800 group-hover:scale-110 transition-transform">
                            <Calendar size={64} />
                        </div>
                        <div className="relative">
                            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-1">{new Date(evt.date).toLocaleDateString('pt-BR')}</p>
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-4 line-clamp-1">{evt.name}</h3>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-zinc-500 dark:text-zinc-400">Público</p>
                                    <p className="font-semibold text-zinc-900 dark:text-zinc-200">{evt.totalAudience}</p>
                                </div>
                                <div>
                                    <p className="text-zinc-500 dark:text-zinc-400">Receita</p>
                                    <p className="font-semibold text-zinc-900 dark:text-zinc-200">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(evt.totalRevenue)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
