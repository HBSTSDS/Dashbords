import type { ManualEventData } from '../utils/storage';

export interface SummaryRow {
    edition_id: string;
    edition_name: string;
    edition_date: string;
    porta_tickets: number;
    porta_revenue_brl: number;
    cortesias: number;
    total_tickets: number; // Represents TOTAL AUDIENCE (Paid + Free)
    total_revenue_brl: number;
}

export interface DailyRow {
    edition_id: string;
    edition_name: string;
    edition_date: string;
    sales_date: string;
    weekday_pt: string;
    sales_count: number;
    revenue_brl: number;
}

export interface ProcessedEvent {
    id: string;
    name: string;
    date: string; // ISO string YYYY-MM-DD

    // Financials
    totalRevenue: number;
    totalPayingQty: number; // Tickets Sold (Total Audience - Cortesias)
    totalAudience: number; // Total Access
    avgTicket: number; // Revenue / TotalPayingQty
    percentPaying: number; // (TotalPaying / TotalAudience) * 100

    // Door specific
    doorQty: number; // Paid Door Qty
    doorRevenue: number;
    doorTM: number; // Avg Ticket for Door

    // Bar Data
    barRevenue?: number;
    barTM?: number;

    // Sales Breakdown
    dailySales: DailyRow[];
    preSaleQty: number;
    preSaleRevenue: number;
    onlineRevenue?: number; // From "RECEITA INGRESSE"

    // Demographics & Channel
    location?: string; // Manual or parsed
    avgAge?: number;
    salesChannels?: {
        pos: number;
        site: number;
        app: number;
    };

    // Metadata
    cortesias: number;
    coupons?: Record<string, number>;
    totalCoupons?: number;

    // Manual Data overrides/additions
    manualData?: ManualEventData;
}
