import { useState } from 'react';
import { Sparkles, Bot, Loader2, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { generateInsights } from '../services/ai';
import type { EventData } from '../types/EventData';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface AIInsightsProps {
    data: EventData[];
}

export function AIInsights({ data }: AIInsightsProps) {
    const [insights, setInsights] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await generateInsights(data);
            setInsights(result);
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const errorMessage = (err as any).message || (err as any).toString();
            setError(errorMessage.includes('API Key') ? errorMessage : `Erro da API: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={cn(
            "rounded-2xl border border-white/20 bg-white/70 p-6 shadow-sm backdrop-blur-xl transition-all",
            "dark:bg-zinc-900/80 dark:border-zinc-800/50"
        )}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg dark:bg-emerald-900/30">
                        <Sparkles className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                            IA Business Intelligence
                        </h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            Análise estratégica via Gemini 2.0 Flash
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className={cn(
                        "flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                        loading
                            ? "bg-zinc-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500"
                    )}
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Analisando...
                        </>
                    ) : (
                        <>
                            <Bot className="w-5 h-5" />
                            Gerar Relatório Executivo
                        </>
                    )}
                </button>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 border border-red-100 flex items-start gap-3 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/30 animate-in fade-in slide-in-from-top-2">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="text-sm font-medium">{error}</div>
                </div>
            )}

            {insights ? (
                <div className="prose prose-zinc max-w-none dark:prose-invert animate-in fade-in duration-500">
                    <div className="pl-4 border-l-4 border-emerald-500 py-2 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-r-xl pr-4">
                        <ReactMarkdown
                            components={{
                                strong: ({ ...props }) => <span className="font-bold text-emerald-700 dark:text-emerald-300" {...props} />,
                                li: ({ ...props }) => <li className="mb-2" {...props} />,
                                ul: ({ ...props }) => <ul className="pl-4 space-y-2 list-disc marker:text-emerald-500" {...props} />,
                                p: ({ ...props }) => <p className="mb-4 text-zinc-700 dark:text-zinc-300 leading-relaxed" {...props} />,
                                h3: ({ ...props }) => <h3 className="text-xl font-bold text-zinc-900 dark:text-white mt-6 mb-3" {...props} />
                            }}
                        >
                            {insights}
                        </ReactMarkdown>
                    </div>
                </div>
            ) : (
                !loading && !error && (
                    <div className="text-center py-8 px-4 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30">
                        <p className="text-zinc-500 dark:text-zinc-400 font-medium">
                            Nenhuma análise gerada. Clique no botão acima para processar os dados atuais.
                        </p>
                    </div>
                )
            )}
        </div>
    );
}
