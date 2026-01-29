import type { ProcessedEvent } from '../types/Analytics';
import type { ManualEventData } from '../utils/storage';

// URL Dinâmica:
// - Em Produção (no servidor): usa 'api.php' (mesma pasta)
// - Em Desenvolvimento (localhost): usa o link temporário da HostGator
const API_BASE = import.meta.env.PROD
    ? 'api.php'
    : 'http://sh-pro72.teste.website/~ascsco21/agnova/api.php';

export const api = {
    // 1. Buscar Relatório Completo
    getReport: async (): Promise<any[]> => {
        const response = await fetch(`${API_BASE}?action=get_report`);
        if (!response.ok) throw new Error('Falha ao buscar dados');
        return response.json();
    },

    // 2. Salvar Métricas do Evento (CSV)
    saveEventMetrics: async (event: ProcessedEvent) => {
        const payload = {
            id: event.id,
            name: event.name,
            date: event.date,
            totalRevenue: event.totalRevenue,
            totalAudience: event.totalAudience,
            totalPayingQty: event.totalPayingQty,
            doorRevenue: event.doorRevenue,
            barRevenue: event.barRevenue || 0,
            onlineRevenue: event.onlineRevenue || 0,
            avgAge: event.avgAge || 0,
            salesChannels: event.salesChannels || { pos: 0, site: 0, app: 0 }
        };

        const response = await fetch(`${API_BASE}?action=save_metrics`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server Error (${response.status}): ${errorText}`);
        }
        return response.json();
    },

    // 3. Salvar Dados Manuais (Custo, Local)
    saveManualData: async (eventId: string, data: ManualEventData) => {
        const payload = {
            event_id: eventId,
            location: data.location,
            event_cost: data.eventCost,
            bar_revenue_manual: data.barGrossRevenue,
            notes: '' // Futuro
        };

        const response = await fetch(`${API_BASE}?action=save_manual`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error('Falha ao salvar dados manuais');
        return response.json();
    },

    // 4. Salvar Cupons
    saveCoupons: async (eventId: string, coupons: Record<string, number>) => {
        if (!coupons || Object.keys(coupons).length === 0) return;

        const payload = {
            event_id: eventId,
            coupons: coupons
        };

        await fetch(`${API_BASE}?action=save_coupons`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
