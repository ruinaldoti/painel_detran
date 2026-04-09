"use client";

import { useState } from "react";

export default function DocumentsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
        const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.iairuinaldo.com.br";
        const response = await fetch(`${baseURL}/rag/upload`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")?.replace(/^["']|["']$/g, "").trim()}`
            },
            body: formData
        });

        if (!response.ok) throw new Error("Erro no upload/vectorização");

        const data = await response.json();
        setMessage({type: 'success', text: `${data.message}. Processado em ${data.chunks_criados} chunks.`});
        setFile(null);
    } catch(err) {
        setMessage({type: 'error', text: "Erro ao enviar e processar o documento PDF."});
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-slate-950 h-full">
      <div className="flex flex-col mb-8">
        <h2 className="text-3xl font-bold text-white tracking-tight">Base de Conhecimento</h2>
        <p className="text-slate-400 mt-1">Carregue PDFs e manuais. A IA dividirá e gerará embeddings automaticamente (RAG).</p>
      </div>

      <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl">
        <div className="border-2 border-dashed border-slate-700 rounded-2xl p-10 flex flex-col items-center justify-center bg-slate-900/50 hover:bg-slate-800/50 transition-colors">
            
            <svg className="w-12 h-12 text-slate-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            <h3 className="text-lg font-medium text-slate-200 mb-1">Upload de Documento (PDF)</h3>
            <p className="text-sm text-slate-500 text-center mb-6">Tamanho máximo: 10MB. Somente PDF.</p>
            
            <input 
              type="file" 
              accept=".pdf" 
              id="file-upload" 
              className="hidden" 
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            
            <label htmlFor="file-upload" className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl font-medium border border-slate-600 transition-colors">
              Selecionar Arquivo
            </label>

            {file && (
                <div className="mt-6 p-4 w-full bg-slate-950 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                    <div className="flex items-center text-emerald-400">
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="text-sm truncate w-48 font-medium">{file.name}</span>
                    </div>
                </div>
            )}
        </div>

        {message && (
            <div className={`mt-6 p-4 rounded-xl text-sm border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-red-500/10 border-red-500/50 text-red-400'}`}>
                {message.text}
            </div>
        )}

        <button 
            disabled={!file || loading}
            onClick={handleUpload}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
            {loading ? "Processando Embeddings..." : "Vetorizar Documento"}
        </button>
      </div>
    </div>
  );
}
