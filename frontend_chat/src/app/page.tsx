"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, ChevronRight, ArrowLeft, Bot } from "lucide-react";

const API_URL = "https://api.iairuinaldo.com.br";

interface Area { id: string; area: string }
interface Documento { id: string; titulo: string; assunto: string }
type Message = { role: "user" | "bot"; text: string };
type ChatView = "areas" | "assuntos" | "chat";

export default function ChatPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<ChatView>("areas");
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "👋 Olá! Sou o assistente virtual do Detran-CE.\n\nPara agilizarmos seu atendimento, escolha uma das opções abaixo ou **digite sua dúvida**:" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Busca áreas ao montar
  useEffect(() => {
    fetch(`${API_URL}/areas/`)
      .then(r => r.ok ? r.json() : [])
      .then(setAreas)
      .catch(() => {});
  }, []);

  // Scroll automático
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const [expandedAreaId, setExpandedAreaId] = useState<string | null>(null);

  // Ao clicar numa área, alterna o accordion e busca os documentos vinculados
  const toggleArea = async (area: Area) => {
    if (expandedAreaId === area.id) {
      setExpandedAreaId(null);
      return;
    }
    
    setExpandedAreaId(area.id);
    setSelectedArea(area);
    setLoadingDocs(true);
    try {
      const res = await fetch(`${API_URL}/areas/${area.id}/assuntos`);
      setDocumentos(res.ok ? await res.json() : []);
    } catch {
      setDocumentos([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  // Ao clicar num documento (título), envia para o chat
  const handleSelectDocumento = (doc: Documento) => {
    const texto = `${selectedArea?.area}: ${doc.titulo}`;
    setView("chat");
    setMessages(prev => [...prev, { role: "user", text: texto }]);
    sendToAPI(texto);
  };

  // Envia mensagem para o backend RAG
  const sendToAPI = async (text: string) => {
    setLoading(true);
    try {
      const payload: Record<string, string> = { message: text };
      if (selectedArea) payload.area = selectedArea.area;
      const res = await fetch(`${API_URL}/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages(prev => [...prev, { role: "bot", text: data.reply }]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: "bot", text: "⚠️ Erro ao conectar com o servidor. Tente novamente." }
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  // Envio pelo input de texto
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");
    setView("chat");
    setMessages(prev => [...prev, { role: "user", text }]);
    await sendToAPI(text);
  };

  // Botão Voltar
  const handleBack = () => {
    if (view === "chat") setView("areas");
  };

  // Formata texto: negrito, quebra de linha e URLs clicáveis
  const fmt = (text: string) =>
    text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br/>")
      .replace(
        /(https?:\/\/[^\s<>"']+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:#006B3C;text-decoration:underline;word-break:break-all;">$1</a>'
      );

  return (
    <>
      {/* ── HEADER DA PÁGINA ── */}
      <header className="bg-[#006B3C] border-b-4 border-[#E8520A] px-6 py-3">
        <div className="flex flex-col">
          <span className="text-white font-bold text-xl tracking-widest leading-tight">DETRAN</span>
          <span className="text-green-200 text-[10px] font-medium tracking-wider">DEPARTAMENTO ESTADUAL DE TRÂNSITO</span>
        </div>
      </header>

      {/* ── CONTEÚDO DA PÁGINA ── */}
      <main className="min-h-[calc(100vh-64px)] bg-[#f0f0f0]" />

      {/* ── WIDGET FLUTUANTE ── */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">

        {/* PAINEL DO CHAT */}
        {isOpen && (
          <div className="w-[370px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200" style={{ height: "520px" }}>

              {/* Header */}
              <div className="bg-[#006B3C] border-b-4 border-[#E8520A] px-4 py-3 flex items-center gap-3">
                {view === "chat" && (
                  <button onClick={handleBack} className="text-white/80 hover:text-white transition-colors shrink-0">
                    <ArrowLeft size={18} />
                  </button>
                )}
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Bot size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm leading-tight">Assistente Virtual</p>
                <p className="text-green-200 text-[11px]">Detran-CE</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[#f7f7f7]">

              {/* VIEW: ÁREAS (Accordion) */}
              {view === "areas" && (
                <div className="p-4 space-y-3">
                  <div
                    className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100 text-sm text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: fmt(messages[0].text) }}
                  />
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-1">
                    Principais serviços
                  </p>
                  {areas.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">Carregando...</p>
                  ) : (
                    areas.map(a => (
                      <div key={a.id} className="flex flex-col mb-1">
                        <button
                          onClick={() => toggleArea(a)}
                          className={`w-full text-left bg-white hover:bg-green-50 border hover:border-green-300 rounded-xl px-4 py-3 flex items-center justify-between text-sm transition-all shadow-sm ${
                            expandedAreaId === a.id ? "border-green-300 text-[#006B3C] font-semibold" : "border-gray-200 text-gray-800 font-medium"
                          }`}
                        >
                          <span>{a.area}</span>
                          <ChevronRight 
                             size={16} 
                             className={`text-gray-400 transition-transform duration-300 ${expandedAreaId === a.id ? 'rotate-90' : ''}`} 
                          />
                        </button>

                        {/* Accordion Content */}
                        <div 
                          className={`overflow-hidden transition-all duration-300 ${
                            expandedAreaId === a.id ? "max-h-[800px] mt-2 opacity-100" : "max-h-0 opacity-0"
                          }`}
                        >
                          <div className="p-2 space-y-1.5 border-l-2 border-[#006B3C] border-opacity-30 ml-3">
                            {loadingDocs && expandedAreaId === a.id ? (
                              <div className="flex justify-center py-4">
                                <Loader2 size={18} className="animate-spin text-[#006B3C]" />
                              </div>
                            ) : expandedAreaId === a.id && documentos.length === 0 ? (
                              <p className="text-xs text-gray-400 py-3 text-center border bg-white border-gray-100 rounded-lg shadow-sm">
                                Nenhum assunto cadastrado nesta área.
                              </p>
                            ) : expandedAreaId === a.id ? (
                              documentos.map(doc => (
                                <button
                                  key={doc.id}
                                  onClick={() => handleSelectDocumento(doc)}
                                  className="w-full text-left bg-white hover:bg-green-50 border border-gray-100 hover:border-green-200 rounded-lg px-3 py-2.5 flex items-center gap-2 text-sm text-gray-700 transition-all shadow-sm"
                                >
                                  <span className="text-[#E8520A] text-[15px] leading-none shrink-0">•</span>
                                  <span className="text-xs">{doc.titulo}</span>
                                </button>
                              ))
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* VIEW: CHAT */}
              {view === "chat" && (
                <div className="p-4 space-y-3">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm break-words overflow-hidden ${
                          m.role === "user"
                            ? "bg-[#006B3C] text-white rounded-br-sm"
                            : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm"
                        }`}
                        dangerouslySetInnerHTML={{ __html: fmt(m.text) }}
                      />
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex gap-1.5">
                        {[0, 150, 300].map(d => (
                          <span key={d} className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            {/* Footer / Input */}
            <div className="bg-white border-t border-gray-200 px-3 py-2.5">
              <form onSubmit={handleSend} className="flex gap-2 items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  disabled={loading}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 text-sm border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:border-[#006B3C] focus:ring-1 focus:ring-[#006B3C]/20 disabled:opacity-50 transition-all"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="bg-[#E8520A] hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-full disabled:opacity-40 transition-all shrink-0 shadow-sm flex items-center justify-center"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* BOTÃO FLUTUANTE */}
        {!isOpen && (
          <div className="flex items-end gap-3 cursor-pointer" onClick={() => setIsOpen(true)}>
            {/* Balão de fala */}
            <div className="bg-[#006B3C] text-white text-sm px-5 py-3.5 rounded-2xl rounded-br-none shadow-lg w-[240px] leading-relaxed">
              Olá! Sou o Assistente Virtual do Detran-CE.<br />
              <strong>Como posso te ajudar?</strong>
            </div>
            {/* Ícone do bot */}
            <div className="w-16 h-16 rounded-full bg-[#006B3C] shadow-2xl flex items-center justify-center border-4 border-white shrink-0 hover:bg-[#005230] transition-all hover:scale-105 active:scale-95">
              <Bot size={30} className="text-white" />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
