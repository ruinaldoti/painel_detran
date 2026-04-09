"use client";

import { useState, useRef, useEffect } from "react";

type Message = { role: "user" | "bot"; text: string };

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "Olá! Como posso ajudar você com os dados e portarias do Detran hoje?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setMessages(prev => [...prev, { role: "user", text: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.iairuinaldo.com.br";
      const response = await fetch(`${baseURL}/chat/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ message: userMessage })
      });

      if (!response.ok) throw new Error("Erro na requisição");

      const data = await response.json();
      setMessages(prev => [...prev, { role: "bot", text: data.reply }]);
    } catch (err) {
       setMessages(prev => [...prev, { role: "bot", text: "Desculpe, ocorreu um erro ao conectar com a IA do Detran." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <div className="p-6 border-b border-slate-800 bg-slate-900/50">
        <h2 className="text-2xl font-bold text-white tracking-tight">Atendimento Inteligente</h2>
        <p className="text-sm text-slate-400">Suporte interno via RAG (Baseado em documentos vetoriais)</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 ${m.role === "user" ? "bg-blue-600 text-white" : "bg-slate-800 border border-slate-700 text-slate-200"}`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 flex items-center space-x-2">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 bg-slate-900 border-t border-slate-800">
        <form onSubmit={sendMessage} className="flex space-x-3 max-w-4xl mx-auto w-full">
          <input
            type="text"
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-5 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
            placeholder="Pergunte sobre portarias, CRVs, CNH..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3.5 rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </form>
      </div>
    </div>
  );
}
