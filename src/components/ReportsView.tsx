import { BarChart3 } from 'lucide-react';

export function ReportsView() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 animate-in fade-in duration-500">
            <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
                <BarChart3 size={48} />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Relatórios Avançados</h2>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-md">
                Esta funcionalidade está em desenvolvimento. Em breve você poderá exportar PDFs e planilhas personalizadas.
            </p>
        </div>
    );
}
