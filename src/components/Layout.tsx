import { useState } from 'react';
import { Menu, X, LayoutDashboard, BarChart3, Settings, LogOut, Ticket, Calendar } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import logo from '../assets/logo_da_empresa.jpg';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface LayoutProps {
    children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Modern Navigation Items with better naming and icons
    const navItems = [
        { icon: LayoutDashboard, label: 'Visão Geral', active: true },
        { icon: Calendar, label: 'Eventos', active: false },
        { icon: BarChart3, label: 'Relatórios', active: false },
        { icon: Ticket, label: 'Vendas', active: false },
        { icon: Settings, label: 'Configurações', active: false },
    ];

    return (
        <div className="min-h-screen bg-zinc-50/50 dark:bg-black selection:bg-emerald-500/30">
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between p-4 bg-white/80 border-b border-zinc-200 dark:bg-black dark:border-zinc-800 sticky top-0 z-50 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <img src={logo} alt="Agencia Nova" className="h-8 w-auto object-contain" />
                    <span className="font-bold text-zinc-900 dark:text-white uppercase tracking-wide text-sm">Agência Nova</span>
                </div>
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-300 transition-colors">
                    {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            <div className="flex">
                {/* Sidebar */}
                <aside className={cn(
                    "fixed lg:sticky top-0 z-40 h-screen w-72 bg-black text-white transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-xl border-r border-zinc-800",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}>
                    <div className="flex h-full flex-col">
                        <div className="p-8 flex items-center justify-center">
                            <img src={logo} alt="Agencia Nova" className="h-16 w-auto object-contain" />
                        </div>

                        <nav className="flex-1 px-4 space-y-2">
                            {navItems.map((item, index) => (
                                <a
                                    key={index}
                                    href="#"
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-medium",
                                        item.active
                                            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                                            : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                                    )}
                                >
                                    <item.icon className={cn("w-5 h-5 transition-colors", item.active ? "text-white" : "text-zinc-400 group-hover:text-white")} />
                                    {item.label}
                                </a>
                            ))}
                        </nav>

                        <div className="p-6 border-t border-zinc-800">
                            <button className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors text-sm font-medium w-full px-4 py-2 hover:bg-zinc-900 rounded-xl">
                                <LogOut className="w-5 h-5" />
                                Sair do Sistema
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-4 lg:p-8 overflow-x-hidden w-full bg-zinc-50 dark:bg-black">
                    {/* Header for Desktop */}
                    <header className="hidden lg:flex items-center justify-between mb-8">
                        <div>
                            <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1 block">Agência Nova</span>
                            <h2 className="text-2xl font-bold text-zinc-800 dark:text-white">Visão Geral</h2>
                            <p className="text-sm text-zinc-500 mt-1 dark:text-zinc-400">Bem-vindo ao seu painel de controle financeiro.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/20 cursor-pointer hover:scale-105 transition-transform">
                                AN
                            </div>
                        </div>
                    </header>
                    {children}
                </main>

                {/* Backdrop for mobile */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </div>
        </div>
    );
}
