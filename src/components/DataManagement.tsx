import { useState, useRef } from 'react';
import { Upload, FileText, Save, X, Database } from 'lucide-react';
import { processEventData, parseRawCSV, processConsolidatedCSV } from '../utils/csvParser';
import { api } from '../services/api';
import type { ProcessedEvent } from '../types/Analytics';

interface DataManagementProps {
    onDataUpdate: (summaryCsv: string, dailyCsv: string) => void;
    currentEvents: ProcessedEvent[];
}

export function DataManagement({ onDataUpdate: _onDataUpdate }: DataManagementProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<'dual' | 'consolidated'>('consolidated'); // Default to consolidated

    // Dual Mode State
    const [summaryFile, setSummaryFile] = useState<string | null>(null);
    const [dailyFile, setDailyFile] = useState<string | null>(null);
    const summaryInputRef = useRef<HTMLInputElement>(null);
    const dailyInputRef = useRef<HTMLInputElement>(null);

    // Consolidated/Mixed State
    const [mixedFile, setMixedFile] = useState<string | null>(null);
    const mixedInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'summary' | 'daily' | 'mixed') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (type === 'summary') setSummaryFile(content);
            else if (type === 'daily') setDailyFile(content);
            else setMixedFile(content);
        };
        reader.readAsText(file); // Note: For special chars, consider readAsText(file, 'ISO-8859-1') if needed
    };

    const handleApply = async () => {
        let eventsToSave: ProcessedEvent[] = [];

        if (mode === 'consolidated' && mixedFile) {
            try {
                eventsToSave = processConsolidatedCSV(mixedFile);
                if (eventsToSave.length === 0) {
                    alert('Nenhum evento encontrado no arquivo consolidado. Verifique o formato.');
                    return;
                }
            } catch (error) {
                console.error(error);
                alert('Erro ao processar o arquivo consolidado.');
                return;
            }
        }
        else if (mode === 'dual' && summaryFile && dailyFile) {
            // ... (Existing dual logic)
            // 1. Parse both files
            const summaryRows = parseRawCSV<any>(summaryFile).filter(r => r.edition_id);
            const dailyRows = parseRawCSV<any>(dailyFile).filter(r => r.edition_id);

            // 2. Group by Event (Edition ID)
            const eventsMap: Record<string, { summary?: any, daily: any[] }> = {};

            // Helper to get or create event entry
            const getEvent = (id: string, name: string) => {
                const key = name || id;
                if (!eventsMap[key]) eventsMap[key] = { daily: [] };
                return eventsMap[key];
            };

            // Process Summary Rows
            summaryRows.forEach(row => {
                if (!row.edition_name) return;
                const entry = getEvent(row.edition_id, row.edition_name);
                entry.summary = row;
            });

            // Process Daily Rows
            dailyRows.forEach(row => {
                if (!row.edition_name) return;
                const entry = getEvent(row.edition_id, row.edition_name);
                entry.daily.push(row);
            });

            // 3. Convert to ProcessedEvents
            for (const [_key, data] of Object.entries(eventsMap)) {
                if (!data.summary) continue;
                try {
                    const allEventRows = [data.summary, ...data.daily];
                    eventsToSave.push(processEventData(allEventRows));
                } catch (err) {
                    console.error(err);
                }
            }
        }

        // SAVE TO API LOOP
        if (eventsToSave.length > 0) {
            let processedCount = 0;
            let errors = 0;

            for (const eventData of eventsToSave) {
                try {
                    await api.saveEventMetrics(eventData);

                    // Save Coupons if any
                    if (eventData.coupons) {
                        await api.saveCoupons(eventData.id, eventData.coupons);
                    }
                    processedCount++;
                } catch (err: any) {
                    console.error(`Error saving event ${eventData.name}:`, err);
                    errors++;
                    if (errors === 1) alert(`Erro detalhado: ${err.message}`); // Show first error
                }
            }
            alert(`Processamento concluído!\n${processedCount} eventos enviados.\n${errors} erros.`);
            setIsOpen(false);
            window.location.reload();
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-lg text-zinc-600 hover:bg-zinc-50 transition-colors shadow-sm dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-300"
            >
                <Database size={16} />
                <span>Importar Dados</span>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div>
                        <h3 className="text-xl font-bold text-zinc-800 dark:text-white">Importação de Dados</h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Atualize o banco de dados via CSV</p>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full dark:hover:bg-zinc-800 transition-colors">
                        <X size={20} className="text-zinc-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-zinc-100 dark:border-zinc-800">
                    <button
                        onClick={() => setMode('consolidated')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === 'consolidated' ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/30' : 'text-zinc-500 hover:text-zinc-700'}`}
                    >
                        Arquivo Único (Consolidado)
                    </button>
                    <button
                        onClick={() => setMode('dual')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === 'dual' ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/30' : 'text-zinc-500 hover:text-zinc-700'}`}
                    >
                        Modo Duplo (Zig/Report)
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    {mode === 'consolidated' ? (
                        <div className="space-y-3">
                            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                                Upload do CSV Consolidado
                            </label>
                            <div
                                onClick={() => mixedInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all hover:border-emerald-400 hover:bg-emerald-50/30 group ${mixedFile ? 'border-emerald-400 bg-emerald-50/30' : 'border-zinc-200 dark:border-zinc-700'}`}
                            >
                                <input
                                    type="file"
                                    ref={mixedInputRef}
                                    className="hidden"
                                    accept=".csv"
                                    onChange={(e) => handleFileUpload(e, 'mixed')}
                                />
                                <div className="flex flex-col items-center gap-3">
                                    <div className={`p-4 rounded-full ${mixedFile ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-50 text-emerald-500 group-hover:bg-emerald-100'} transition-colors`}>
                                        {mixedFile ? <FileText size={32} /> : <Upload size={32} />}
                                    </div>
                                    <div className="space-y-1">
                                        <span className="block text-base font-semibold text-zinc-700 dark:text-zinc-200">
                                            {mixedFile ? 'Arquivo pronto para processar!' : 'Clique para selecionar'}
                                        </span>
                                        <span className="block text-xs text-zinc-400">
                                            Suporta formato detalhado (ticket a ticket)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Summary CSV Upload */}
                            <div className="space-y-3">
                                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                                    1. CSV de Resumo
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
                                            {summaryFile ? 'Carregado' : 'Enviar Resumo'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Daily CSV Upload */}
                            <div className="space-y-3">
                                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                                    2. CSV de Vendas
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
                                            {dailyFile ? 'Carregado' : 'Enviar Diário'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
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
                        disabled={mode === 'consolidated' ? !mixedFile : (!summaryFile || !dailyFile)}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                    >
                        <Save size={18} />
                        Processar e Salvar
                    </button>
                </div>
            </div>
        </div>
    );
}
