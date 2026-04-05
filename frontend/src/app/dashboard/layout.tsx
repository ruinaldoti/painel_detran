"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col p-4">
        <div className="py-4 mb-4 border-b border-slate-800">
          <h1 className="text-xl font-bold text-white tracking-tight">Painel Detran</h1>
          <p className="text-xs text-blue-400 mt-1">RAG & AI Control</p>
        </div>
        
        <nav className="flex-1 space-y-2">
          <Link href="/dashboard" className={`flex items-center px-4 py-3 rounded-lg transition-colors ${pathname === '/dashboard' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' : 'hover:bg-slate-800/80 text-slate-400'}`}>
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            Visão Geral
          </Link>
          
          <Link href="/dashboard/chat" className={`flex items-center px-4 py-3 rounded-lg transition-colors ${pathname.includes('/chat') ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' : 'hover:bg-slate-800/80 text-slate-400'}`}>
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            Chat IA
          </Link>
          
          <Link href="/dashboard/documents" className={`flex items-center px-4 py-3 rounded-lg transition-colors ${pathname.includes('/documents') ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' : 'hover:bg-slate-800/80 text-slate-400'}`}>
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Base de Conhecimento
          </Link>
        </nav>
        
        <div className="pt-4 border-t border-slate-800">
          <button 
             onClick={() => { localStorage.removeItem("token"); router.push("/login"); }}
             className="flex items-center px-4 py-2 w-full text-left text-slate-400 hover:text-red-400 transition-colors rounded-lg hover:bg-slate-800/80"
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Sair
          </button>
        </div>
      </aside>
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
