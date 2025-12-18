import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// "R$ 1.000,00" -> 1000.00
// "-R$ 500,00" -> -500.00
export function parseCurrency(value: string | undefined): number {
    if (!value) return 0;
    // Remove "R$", spaces, dots, and replace comma with dot
    const cleanValue = value.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
    const number = parseFloat(cleanValue);
    return isNaN(number) ? 0 : number;
}

// "06/01/2025" -> Date Object
export function parseDate(dateStr: string | undefined): Date | null {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    const year = parseInt(parts[2], 10);

    return new Date(year, month, day);
}

// "50,00%" -> 0.5
export function parsePercentage(value: string | undefined): number {
    if (!value) return 0;
    const cleanValue = value.replace('%', '').replace(',', '.').trim();
    const number = parseFloat(cleanValue);
    return isNaN(number) ? 0 : number;
}

export const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const formatPercentage = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 2 }).format(value / 100);
