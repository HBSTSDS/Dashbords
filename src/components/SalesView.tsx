import { Ticket } from 'lucide-react';

export function SalesView() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 animate-in fade-in duration-500">
            <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
                <Ticket size={48} />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Gestão de Vendas</h2>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-md">
                Integração direta com Gateways de pagamento e gestão de lotes em breve.
            </p>
        </div>
    );
}
