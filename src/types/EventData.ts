export interface EventData {
    data: Date | null;
    evento: string;
    local: string;
    repassePrevisto: number;
    repasseReal: number;
    receitaIngresse: number;
    receitaPorta: number;
    totalIngressos: number;
    custosTotais: number;
    vips: number;
    tmPorta: number;
    tmBar: number;
    receitaBar: number;
    roi: number; // Stored as percentage value (e.g. 0.5 for 50%) or raw number depending on needs
}

export type DashboardSummary = {
    totalReceita: number;
    totalCustos: number;
    lucroLiquido: number;
    totalPublico: number;
    eventosRealizados: number;
};
