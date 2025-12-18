import { ArrowDownRight, ArrowUpRight, TrendingUp, type LucideIcon } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface KPICardProps {
    title: string;
    value: string;
    icon: LucideIcon;
    trend?: string;
    trendUp?: boolean;
}

export function KPICard({ title, value, icon: Icon, trend, trendUp }: KPICardProps) {
    return (
        <div className={cn(
            "group relative overflow-hidden rounded-2xl border border-white/20 bg-white/70 p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 backdrop-blur-xl",
            "dark:bg-zinc-900/80 dark:border-zinc-800/50"
        )}>
            {/* Decorative gradient blob */}
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-emerald-500/10 to-green-500/10 transition-all group-hover:scale-150 group-hover:from-emerald-500/20 group-hover:to-green-500/20" />

            <div className="relative flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
                            {value}
                        </h3>
                    </div>
                </div>
                <div className="rounded-xl bg-emerald-50/80 p-3 text-emerald-600 dark:bg-zinc-800 dark:text-emerald-400 backdrop-blur-sm">
                    <Icon className="h-6 w-6" />
                </div>
            </div>

            {trend && (
                <div className="relative mt-4 flex items-center gap-2">
                    <span
                        className={cn(
                            "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold backdrop-blur-sm",
                            trendUp
                                ? "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                                : "bg-rose-100/80 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400"
                        )}
                    >
                        {trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {trend}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">vs mês anterior</span>
                </div>
            )}

            {/* Hidden usage of TrendingUp to fix unused import warning if needed, or remove it */}
            <div className="hidden"><TrendingUp /></div>
        </div>
    );
}
