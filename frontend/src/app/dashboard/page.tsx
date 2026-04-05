"use client";

import { useEffect, useState } from "react";

export default function DashboardHome() {
  const [stats, setStats] = useState({ documents: 0, queries: 0 });

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="flex flex-col mb-8">
        <h2 className="text-3xl font-bold text-white tracking-tight">Visão Geral</h2>
        <p className="text-slate-400 mt-1">Estatísticas do sistema RAG e utilização da Inteligência Artificial</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-400">Documentos RAG</h3>
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-white">4</p>
          <p className="text-xs text-emerald-400 mt-2 flex items-center">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" /></svg>
            1 adicionado esta semana
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-400">Consultas de IA</h3>
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-white">128</p>
          <p className="text-xs text-emerald-400 mt-2 flex items-center">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" /></svg>
            +14% em relação a ontem
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-400">Modelos Ativos</h3>
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-white">Gemini 2.5</p>
          <p className="text-xs text-purple-400 mt-2 flex items-center">
            Flash + Text Embeddings 004
          </p>
        </div>
      </div>
      
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-white mb-4">Próximos Passos</h3>
          <ul className="text-slate-400 space-y-3">
             <li className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-500 mr-3"></span> Vá para a Base de Conhecimento e adicione os manuais PDF do Detran.</li>
             <li className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-500 mr-3"></span> O sistema extraíra o texto e gerará Embeddings via API.</li>
             <li className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-500 mr-3"></span> Use a aba de Chat IA para conversar com os documentos de forma Inteligente.</li>
          </ul>
      </div>
    </div>
  );
}
