"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, ChevronRight, ArrowLeft, Bot } from "lucide-react";

const API_URL = "https://api.iairuinaldo.com.br";

interface Area { id: string; area: string }
interface Assunto { id: string; id_area: string; assunto: string }
type Message = { role: "user" | "bot"; text: string };

type ChatView = "areas" | "assuntos" | "chat";

export default function ChatPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<ChatView>("areas");
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [assuntos, setAssuntos] = useState<Assunto[]>([]);
  const [loadingAssuntos, setLoadingAssuntos] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "👋 Olá! Sou o assistente virtual do Detran-CE.\n\nPara agilizarmos seu atendimento, escolha uma das opções abaixo ou **digite sua dúvida**:" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${API_URL}/areas/`)
      .then(r => r.ok ? r.json() : [])
      .then(setAreas)
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSelectArea = async (area: Area) => {
    setSelectedArea(area);
    setLoadingAssuntos(true);
    setView("assuntos");
    try {
      const res = await fetch(`${API_URL}/areas/${area.id}/assuntos`);
      const data = res.ok ? await res.json() : [];
      setAssuntos(data);
    } catch { setAssuntos([]); }
    finally { setLoadingAssuntos(false); }
  };

  const handleSelectAssunto = (assunto: Assunto) => {
    const texto = `${selectedArea?.area} → ${assunto.assunto}`;
    setView("chat");
    setMessages(prev => [
      ...prev,
      { role: "user", text: texto },
    ]);
    sendToAPI(texto);
  };

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
        { role: "bot", text: "⚠️ Erro ao conectar com o servidor. Por favor, tente novamente." }
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");
    setView("chat");
    setMessages(prev => [...prev, { role: "user", text }]);
    await sendToAPI(text);
  };

  const handleBack = () => {
    if (view === "assuntos") setView("areas");
    else if (view === "chat") setView(selectedArea ? "assuntos" : "areas");
  };

  const renderBotText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br/>");
  };

  return (
    <>
      {/* ──────── HEADER DA PÁGINA ──────── */}
      <header className="bg-[#006B3C] border-b-4 border-[#E8520A] px-6 py-3 flex items-center gap-3">
        <div className="flex flex-col">
          <span className="text-white font-bold text-xl tracking-widest leading-tight">DETRAN</span>
          <span className="text-green-200 text-[10px] font-medium tracking-wider">DEPARTAMENTO ESTADUAL DE TRÂNSITO</span>
        </div>
      </header>

      {/* ──────── CONTEÚDO DA PÁGINA ──────── */}
      <main className="min-h-[calc(100vh-64px)] bg-[#f0f0f0]" />

      {/* ──────── WIDGET CONTAINER ──────── */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">

        {/* CHAT PANEL */}
        {isOpen && (
          <div className="w-[370px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200"
            style={{ height: "520px" }}>

            {/* Header do chat */}
            <div className="bg-[#006B3C] border-b-4 border-[#E8520A] px-4 py-3 flex items-center gap-3">
              {(view === "assuntos" || view === "chat") && (
                <button onClick={handleBack}
                  className="text-white/80 hover:text-white transition-colors shrink-0">
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
              <button onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto bg-[#f7f7f7]">

              {/* VIEW: ÁREAS */}
              {view === "areas" && (
                <div className="p-4 space-y-3">
                  <div className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100 text-sm text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderBotText(messages[0].text) }} />
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-1">
                    Principais serviços
                  </p>
                  {areas.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">Carregando...</p>
                  ) : (
                    areas.map(a => (
                      <button key={a.id} onClick={() => handleSelectArea(a)}
                        className="w-full text-left bg-white hover:bg-green-50 border border-gray-200 hover:border-green-300 rounded-xl px-4 py-3 flex items-center justify-between text-sm font-medium text-gray-800 transition-all shadow-sm">
                        <span>{a.area}</span>
                        <ChevronRight size={16} className="text-gray-400" />
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* VIEW: ASSUNTOS */}
              {view === "assuntos" && selectedArea && (
                <div className="p-4 space-y-3">
                  <div className="inline-block bg-[#006B3C] text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                    📂 {selectedArea.area}
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed px-1">
                    Selecione um assunto ou <strong>digite sua dúvida</strong> abaixo:
                  </p>
                  {loadingAssuntos ? (
                    <div className="flex justify-center py-6">
                      <Loader2 size={20} className="animate-spin text-gray-400" />
                    </div>
                  ) : assuntos.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                      Nenhum assunto cadastrado nesta área ainda.
                    </p>
                  ) : (
                    assuntos.map(s => (
                      <button key={s.id} onClick={() => handleSelectAssunto(s)}
                        className="w-full text-left bg-white hover:bg-green-50 border border-gray-200 hover:border-green-300 rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm text-gray-700 transition-all shadow-sm">
                        <span className="text-[#E8520A] font-bold text-xs">+</span>
                        <span>{s.assunto}</span>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* VIEW: CHAT */}
              {view === "chat" && (
                <div className="p-4 space-y-3">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                        m.role === "user"
                          ? "bg-[#006B3C] text-white rounded-br-sm"
                          : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm"
                      }`}
                        dangerouslySetInnerHTML={{ __html: renderBotText(m.text) }} />
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex gap-1.5">
                        {[0, 150, 300].map(d => (
                          <span key={d} className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                            style={{ animationDelay: `${d}ms` }} />
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
                <button type="submit" disabled={loading || !input.trim()}
                  className="bg-[#E8520A] hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-full disabled:opacity-40 transition-all shrink-0 shadow-sm">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* BOTÃO FLUTUANTE */}
        {!isOpen && (
          <div className="flex flex-col items-end gap-2">
            <div className="bg-[#006B3C] text-white text-xs px-4 py-2.5 rounded-2xl rounded-br-sm shadow-lg max-w-[200px] text-right leading-snug animate-fade-in">
              Olá!<br />
              Eu sou o Assistente Virtual do Detran!<br />
              <strong>Como posso te ajudar?</strong>
            </div>
            <button
              onClick={() => setIsOpen(true)}
              className="w-16 h-16 rounded-full bg-[#006B3C] hover:bg-[#005230] shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 border-4 border-white"
            >
              <Bot size={30} className="text-white" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
