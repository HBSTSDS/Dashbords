export interface ManualEventData {
    eventCost?: number;
    barGrossRevenue?: number;
    location?: string;
}

const STORAGE_KEY = 'hb_dashboard_manual_data';

export const getManualData = (): Record<string, ManualEventData> => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch (e) {
        console.error('Failed to parse manual data', e);
        return {};
    }
};

export const saveManualData = (eventId: string, data: ManualEventData) => {
    try {
        const current = getManualData();
        const updated = {
            ...current,
            [eventId]: { ...current[eventId], ...data }
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        // Dispatch a custom event to notify listeners (like hooks)
        window.dispatchEvent(new Event('manualDataUpdated'));
    } catch (e) {
        console.error('Failed to save manual data', e);
    }
};

export const getEventManualData = (eventId: string): ManualEventData | undefined => {
    const all = getManualData();
    return all[eventId];
};
