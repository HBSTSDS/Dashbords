import { useState, useRef } from 'react';
import { Upload, FileText, Edit2, Save, X } from 'lucide-react';
import type { ProcessedEvent } from '../types/Analytics';

interface DataManagementProps {
    onDataUpdate: (summaryCsv: string, dailyCsv: string) => void;
    currentEvents: ProcessedEvent[];
}

export function DataManagement({ onDataUpdate }: DataManagementProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [summaryFile, setSummaryFile] = useState<string | null>(null);
    const [dailyFile, setDailyFile] = useState<string | null>(null);

    const summaryInputRef = useRef<HTMLInputElement>(null);
    const dailyInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'summary' | 'daily') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (type === 'summary') setSummaryFile(content);
            else setDailyFile(content);
        };
        reader.readAsText(file);
    };

    const handleApply = () => {
        if (summaryFile && dailyFile) {
            onDataUpdate(summaryFile, dailyFile);
            setIsOpen(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-lg text-zinc-600 hover:bg-zinc-50 transition-colors shadow-sm dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-300"
            >
                <Edit2 size={16} />
                <span>Gerenciar Dados</span>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div>
                        <h3 className="text-xl font-bold text-zinc-800 dark:text-white">Gerenciamento de Dados</h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Importe as planilhas CSV atualizadas</p>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full dark:hover:bg-zinc-800 transition-colors">
                        <X size={20} className="text-zinc-500" />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Summary CSV Upload */}
                        <div className="space-y-3">
                            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                                1. CSV de Resumo (Edições)
                            </label>
                            <div
                                onClick={() => summaryInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all hover:border-emerald-400 hover:bg-emerald-50/30 group ${summaryFile ? 'border-emerald-400 bg-emerald-50/30' : 'border-zinc-200 dark:border-zinc-700'}`}
                            >
                                <input
                                    type="file"
                                    ref={summaryInputRef}
                                    className="hidden"
                                    accept=".csv"
                                    onChange={(e) => handleFileUpload(e, 'summary')}
                                />
                                <div className="flex flex-col items-center gap-2">
                                    <div className={`p-3 rounded-full ${summaryFile ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-50 text-emerald-500 group-hover:bg-emerald-100'} transition-colors`}>
                                        {summaryFile ? <FileText size={24} /> : <Upload size={24} />}
                                    </div>
                                    <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                        {summaryFile ? 'Arquivo carregado!' : 'Clique para enviar'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Daily CSV Upload */}
                        <div className="space-y-3">
                            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                                2. CSV de Vendas Diárias
                            </label>
                            <div
                                onClick={() => dailyInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all hover:border-emerald-400 hover:bg-emerald-50/30 group ${dailyFile ? 'border-emerald-400 bg-emerald-50/30' : 'border-zinc-200 dark:border-zinc-700'}`}
                            >
                                <input
                                    type="file"
                                    ref={dailyInputRef}
                                    className="hidden"
                                    accept=".csv"
                                    onChange={(e) => handleFileUpload(e, 'daily')}
                                />
                                <div className="flex flex-col items-center gap-2">
                                    <div className={`p-3 rounded-full ${dailyFile ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-50 text-emerald-500 group-hover:bg-emerald-100'} transition-colors`}>
                                        {dailyFile ? <FileText size={24} /> : <Upload size={24} />}
                                    </div>
                                    <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                        {dailyFile ? 'Arquivo carregado!' : 'Clique para enviar'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-sm text-amber-800 dark:bg-amber-900/20 dark:border-amber-900/30 dark:text-amber-200">
                        <strong>Nota:</strong> Certifique-se de que os IDs das edições correspondam em ambos os arquivos. O sistema fará o cruzamento automático.
                    </div>
                </div>

                <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 flex justify-end gap-3">
                    <button
                        onClick={() => setIsOpen(false)}
                        className="px-5 py-2.5 rounded-xl font-medium text-zinc-600 hover:bg-zinc-200 transition-colors dark:text-zinc-300 dark:hover:bg-zinc-700"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleApply}
                        disabled={!summaryFile || !dailyFile}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                    >
                        <Save size={18} />
                        Aplicar e Atualizar
                    </button>
                </div>
            </div>
        </div>
    );
}
