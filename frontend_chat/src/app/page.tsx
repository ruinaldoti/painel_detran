"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, ChevronDown, Loader2 } from "lucide-react";

const API_URL = "https://api.iairuinaldo.com.br";

interface Area {
  id: string;
  area: string;
}

type Message = {
  role: "user" | "bot";
  text: string;
};

export default function ChatPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text: "Olá! Sou o assistente virtual do **DETRAN-CE**. Selecione uma área de interesse e faça sua pergunta. Estou aqui para te ajudar! 😊",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [areaOpen, setAreaOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const res = await fetch(`${API_URL}/areas/`);
        if (res.ok) setAreas(await res.json());
      } catch {}
    };
    fetchAreas();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setLoading(true);

    try {
      const payload: Record<string, string> = { message: userText };
      if (selectedArea) payload.area = selectedArea.area;

      const res = await fetch(`${API_URL}/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Erro na resposta");
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "bot", text: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "⚠️ Desculpe, não consegui obter uma resposta no momento. Tente novamente em instantes.",
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const formatText = (text: string) => {
    // Negrito simples
    return text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  };

  return (
    <div className="flex flex-col h-screen bg-[#f4f4f4]">
      {/* ───── HEADER DETRAN ───── */}
      <header className="bg-[#006B3C] text-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          {/* Logo placeholder */}
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Bot size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight tracking-wide">
              DETRAN-CE
            </h1>
            <p className="text-xs text-green-200 font-medium">
              Assistente Virtual de Atendimento
            </p>
          </div>
          <div className="ml-auto">
            <span className="flex items-center gap-1.5 text-xs bg-green-700/60 text-green-100 px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Online
            </span>
          </div>
        </div>

        {/* Seletor de Área */}
        {areas.length > 0 && (
          <div className="border-t border-green-700/50 bg-[#005230]">
            <div className="max-w-4xl mx-auto px-4 py-2 flex items-center gap-3">
              <span className="text-xs text-green-300 font-medium whitespace-nowrap">
                Área de interesse:
              </span>
              <div className="relative flex-1 max-w-xs">
                <button
                  type="button"
                  onClick={() => setAreaOpen(!areaOpen)}
                  className="w-full text-left text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded px-3 py-1.5 flex items-center justify-between transition-colors"
                >
                  <span>{selectedArea ? selectedArea.area : "Todas as áreas"}</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${areaOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {areaOpen && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white rounded shadow-lg z-50 overflow-hidden border border-gray-200">
                    <button
                      onClick={() => { setSelectedArea(null); setAreaOpen(false); }}
                      className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 border-b border-gray-100"
                    >
                      Todas as áreas
                    </button>
                    {areas.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => { setSelectedArea(a); setAreaOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${
                          selectedArea?.id === a.id
                            ? "text-[#006B3C] font-semibold bg-green-50"
                            : "text-gray-700"
                        }`}
                      >
                        {a.area}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ───── MENSAGENS ───── */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex items-end gap-2 ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {/* Avatar do bot */}
              {m.role === "bot" && (
                <div className="w-8 h-8 rounded-full bg-[#006B3C] flex items-center justify-center shrink-0 mb-0.5">
                  <Bot size={16} className="text-white" />
                </div>
              )}

              {/* Balão */}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  m.role === "user"
                    ? "bg-[#006B3C] text-white rounded-br-sm"
                    : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm"
                }`}
                dangerouslySetInnerHTML={{ __html: formatText(m.text) }}
              />

              {/* Avatar do usuário */}
              {m.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-[#E8520A] flex items-center justify-center shrink-0 mb-0.5">
                  <User size={16} className="text-white" />
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex items-end gap-2 justify-start">
              <div className="w-8 h-8 rounded-full bg-[#006B3C] flex items-center justify-center shrink-0">
                <Bot size={16} className="text-white" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-5 py-3.5 flex gap-1.5 shadow-sm">
                <span className="typing-dot w-2 h-2 rounded-full bg-gray-400 inline-block" />
                <span className="typing-dot w-2 h-2 rounded-full bg-gray-400 inline-block" />
                <span className="typing-dot w-2 h-2 rounded-full bg-gray-400 inline-block" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </main>

      {/* ───── INPUT ───── */}
      <footer className="bg-white border-t border-gray-200 px-4 py-3 shadow-lg">
        <form
          onSubmit={sendMessage}
          className="max-w-4xl mx-auto flex items-center gap-3"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder={
              selectedArea
                ? `Pergunte sobre ${selectedArea.area}...`
                : "Digite sua dúvida sobre o DETRAN-CE..."
            }
            className="flex-1 border border-gray-300 rounded-full px-5 py-3 text-sm focus:outline-none focus:border-[#006B3C] focus:ring-2 focus:ring-[#006B3C]/20 disabled:opacity-60 transition-all"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-11 h-11 rounded-full bg-[#006B3C] hover:bg-[#005230] text-white flex items-center justify-center disabled:opacity-40 transition-all shrink-0 shadow-md hover:shadow-lg active:scale-95"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </form>
        <p className="text-center text-[10px] text-gray-400 mt-2">
          Assistente baseado em inteligência artificial • DETRAN-CE
        </p>
      </footer>
    </div>
  );
}
