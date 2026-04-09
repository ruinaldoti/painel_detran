"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MessageCircleQuestion,
  CheckCircle2,
  Clock,
  Inbox,
  Filter,
  X,
  Send,
  Trash2,
  ChevronDown,
  AlertCircle,
  Edit2,
  Database,
} from "lucide-react";

// ─────────────── Types ───────────────

type Status = "pendente" | "respondido";

interface Duvida {
  id: string;
  duvida: string;
  resposta: string | null;
  id_area: string | null;
  area_nome: string | null;
  status: Status;
  criado_em: string;
  respondido_em: string | null;
  origem: string;
  documento_id: string | null;
  ingerido_no_rag: boolean;
}

interface Stats {
  total: number;
  pendentes: number;
  respondidas: number;
}

interface Area {
  id: string;
  area: string;
}

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://api.iairuinaldo.com.br";

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// ─────────────── Components ───────────────

function StatusBadge({ status, ingerido }: { status: Status; ingerido: boolean }) {
  if (status === "respondido") {
    return (
      <div className="flex flex-col gap-1 items-start">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
          <CheckCircle2 size={11} />
          Respondida
        </span>
        {ingerido && (
          <span className="inline-flex items-center gap-1 rounded bg-[#0E8B42]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#0E8B42]">
            <Database size={10} />
            RAG Ingerido
          </span>
        )}
      </div>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-500/30">
      <Clock size={11} />
      Pendente
    </span>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            {label}
          </p>
          <p className="mt-1.5 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`rounded-lg p-2.5 ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
      <div className={`absolute bottom-0 left-0 h-0.5 w-full ${color.replace("bg-", "bg-").replace("/20", "")}`} />
    </div>
  );
}

// ─────────────── Toast System ───────────────
export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
  };

  const ToastContainer = () => {
    if (!toast) return null;
    return (
      <div className="fixed bottom-4 right-4 z-[9999] animate-in slide-in-from-bottom-5 fade-in duration-300">
        <div className={`flex items-center gap-2 rounded-lg px-4 py-3 shadow-xl ${
          toast.type === "success" ? "bg-[#0E8B42] text-white" : "bg-red-600 text-white"
        }`}>
          {toast.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      </div>
    );
  };

  return { showToast, ToastContainer };
}


// ─────────────── Modal de Resposta/Edição ───────────────

function ResponderModal({
  duvida,
  onClose,
  onSaved,
}: {
  duvida: Duvida;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const isEditing = duvida.status === "respondido";
  const [resposta, setResposta] = useState(duvida.resposta ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!resposta.trim()) {
      setError("A resposta não pode estar vazia.");
      return;
    }
    setSaving(true);
    setError("");

    const endpoint = isEditing ? "editar" : "responder";
    
    try {
      const res = await fetch(`${API}/duvidas/${duvida.id}/${endpoint}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ resposta }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Erro ao salvar resposta");
      }
      
      // Emit event for layout to update sidebar badge
      window.dispatchEvent(new Event("duvidas_changed"));
      
      onSaved(isEditing ? "Resposta atualizada na base de conhecimento! ✅" : "Dúvida respondida e adicionada à base de conhecimento! ✅");
    } catch (e: any) {
      setError(e.message || "Não foi possível salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-2xl rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:fade-in duration-200">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-full ${isEditing ? 'bg-blue-100' : 'bg-[#0E8B42]/10'}`}>
              {isEditing ? (
                <Edit2 size={18} className="text-blue-600" />
              ) : (
                <MessageCircleQuestion size={18} className="text-[#0E8B42]" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                {isEditing ? "Editar Resposta e Base RAG" : "Responder Dúvida"}
              </h2>
              {duvida.area_nome && (
                <p className="text-xs text-gray-500">Área: {duvida.area_nome}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-4 rounded-xl bg-gray-50 border border-gray-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Pergunta do cidadão
          </p>
          <p className="text-sm text-gray-800 leading-relaxed">{duvida.duvida}</p>
          <p className="mt-2 text-xs text-gray-400">
            Recebida em{" "}
            {new Date(duvida.criado_em).toLocaleString("pt-BR", {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </p>
        </div>

        <div className="mb-1 relative">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
            Resposta Oficial
          </label>
          <textarea
            rows={5}
            className={`w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 transition ${isEditing ? 'focus:border-blue-500 focus:ring-blue-500/20' : 'focus:border-[#0E8B42] focus:ring-[#0E8B42]/20'}`}
            placeholder="Digite a resposta que será enviada para o RAG..."
            value={resposta}
            onChange={(e) => setResposta(e.target.value)}
          />
        </div>

        {error && (
          <div className="mb-3 flex items-center gap-2 text-xs text-red-600 font-medium bg-red-50 p-2 rounded-lg border border-red-100 mt-2">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60 transition-colors ${
              isEditing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#0E8B42] hover:bg-[#0b7537]'
            }`}
          >
            {saving ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Salvando & Ingerindo no RAG...
              </>
            ) : (
              <>
                {isEditing ? <Edit2 size={14} /> : <Send size={14} />}
                {isEditing ? "Atualizar Base" : "Responder e Ingerir"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────── Main Page ───────────────

export default function DuvidasPage() {
  const [duvidas, setDuvidas] = useState<Duvida[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pendentes: 0, respondidas: 0 });
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterArea, setFilterArea] = useState<string>("");
  const [filterPeriodo, setFilterPeriodo] = useState<string>("7"); // default 7 days
  
  const [selected, setSelected] = useState<Duvida | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  
  const { showToast, ToastContainer } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      if (filterArea) params.set("id_area", filterArea);
      if (filterPeriodo) params.set("periodo_dias", filterPeriodo);

      const [duvidasRes, statsRes, areasRes] = await Promise.all([
        fetch(`${API}/duvidas/?${params.toString()}`, { headers: authHeaders() }),
        fetch(`${API}/duvidas/stats`, { headers: authHeaders() }),
        fetch(`${API}/areas/`, { headers: authHeaders() }),
      ]);

      if (duvidasRes.ok) setDuvidas(await duvidasRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      if (areasRes.ok) setAreas(await areasRes.json());
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterArea, filterPeriodo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (duvida: Duvida) => {
    const isRespondida = duvida.status === "respondido";
    const alertMsg = "Deseja excluir esta dúvida? Se já foi respondida, o conteúdo também será removido da base de conhecimento.";
    
    if (!confirm(alertMsg)) return;
    
    setDeleting(duvida.id);
    try {
      const res = await fetch(`${API}/duvidas/${duvida.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      
      if (!res.ok) throw new Error("Erro ao excluir");
      
      showToast("Dúvida excluída com sucesso", "success");
      
      // Update sidebar counter
      window.dispatchEvent(new Event("duvidas_changed"));
      
      fetchData();
    } catch (e) {
      showToast("Não foi possível excluir. Tente novamente.", "error");
    } finally {
      setDeleting(null);
    }
  };

  const handleSaved = (successMsg: string) => {
    setSelected(null);
    showToast(successMsg, "success");
    fetchData();
  };

  return (
    <div className="min-h-full pb-10">
      <ToastContainer />
      
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0E8B42]/10">
            <MessageCircleQuestion size={18} className="text-[#0E8B42]" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Dúvidas Não Respondidas</h1>
        </div>
        <p className="ml-11 text-sm text-gray-500">
          Perguntas do chat que o motor RAG não localizou. Responda diretamente por aqui para abastecer a base de conhecimento.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          icon={Inbox}
          label="Total de Dúvidas"
          value={stats.total}
          color="bg-gray-600"
        />
        <MetricCard
          icon={Clock}
          label="Pendentes"
          value={stats.pendentes}
          color="bg-amber-500"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Respondidas & Ingeridas"
          value={stats.respondidas}
          color="bg-[#0E8B42]"
        />
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Filter size={15} />
          <span className="font-medium">Filtros:</span>
        </div>

        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none rounded-lg border border-gray-300 bg-gray-50 py-1.5 pl-3 pr-8 text-sm text-gray-700 hover:bg-gray-100 focus:border-[#0E8B42] focus:outline-none focus:ring-1 focus:ring-[#0E8B42]/50 transition cursor-pointer"
          >
            <option value="">Status: Todos</option>
            <option value="pendente">Pendentes</option>
            <option value="respondido">Respondidas</option>
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-2.5 text-gray-400" />
        </div>

        <div className="relative">
          <select
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
            className="appearance-none rounded-lg border border-gray-300 bg-gray-50 py-1.5 pl-3 pr-8 text-sm text-gray-700 hover:bg-gray-100 focus:border-[#0E8B42] focus:outline-none focus:ring-1 focus:ring-[#0E8B42]/50 transition cursor-pointer"
          >
            <option value="">Área: Todas</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.area}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-2.5 text-gray-400" />
        </div>

        <div className="relative">
          <select
            value={filterPeriodo}
            onChange={(e) => setFilterPeriodo(e.target.value)}
            className="appearance-none rounded-lg border border-gray-300 bg-gray-50 py-1.5 pl-3 pr-8 text-sm text-gray-700 hover:bg-gray-100 focus:border-[#0E8B42] focus:outline-none focus:ring-1 focus:ring-[#0E8B42]/50 transition cursor-pointer"
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="">Todo o período</option>
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-2.5 text-gray-400" />
        </div>

        {(filterStatus || filterArea || filterPeriodo !== "7") && (
          <button
            onClick={() => { setFilterStatus(""); setFilterArea(""); setFilterPeriodo("7"); }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
          >
            <X size={12} />
            Limpar Filtros
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-gray-200 border-t-[#0E8B42]" />
          </div>
        ) : duvidas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-50">
              <CheckCircle2 size={26} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-700">Nenhuma dúvida encontrada</p>
            <p className="mt-1 text-xs text-gray-400">
              Mude os filtros de período ou status para ver mais resultados.
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 pl-5 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 w-full">
                  Pergunta
                </th>
                <th className="hidden px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 md:table-cell whitespace-nowrap">
                  Área Sugerida
                </th>
                <th className="hidden px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 lg:table-cell whitespace-nowrap">
                  Recebida
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap">
                  Status
                </th>
                <th className="py-3 pl-3 pr-5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 min-w-[200px]">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {duvidas.map((d) => (
                <tr
                  key={d.id}
                  className="group hover:bg-blue-50/30 transition-colors"
                >
                  <td className="py-4 pl-5 pr-3">
                    <p className="text-sm font-medium text-gray-900 leading-snug">
                      {d.duvida}
                    </p>
                    {d.resposta && (
                      <p className="mt-1 text-xs text-gray-500 line-clamp-1 italic bg-gray-50 p-1 w-fit rounded">
                        " {d.resposta} "
                      </p>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-2 md:hidden">
                      {d.area_nome && (
                        <span className="rounded bg-[#0E8B42]/10 px-2 py-0.5 text-xs font-medium text-[#0E8B42]">
                          {d.area_nome}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                        {new Date(d.criado_em).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </td>

                  <td className="hidden px-3 py-4 md:table-cell">
                    {d.area_nome ? (
                      <span className="inline-block max-w-[160px] truncate rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                        {d.area_nome}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>

                  <td className="hidden px-3 py-4 lg:table-cell">
                    <span className="text-sm text-gray-500 font-medium">
                      {new Date(d.criado_em).toLocaleDateString("pt-BR")}
                    </span>
                    <span className="block text-[10px] text-gray-400">
                      {new Date(d.criado_em).toLocaleTimeString("pt-BR", {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </td>

                  <td className="px-3 py-4">
                    <StatusBadge status={d.status} ingerido={d.ingerido_no_rag} />
                  </td>

                  <td className="py-4 pl-3 pr-5">
                    <div className="flex justify-end gap-2 items-center">
                      {d.status === "pendente" ? (
                        <button
                          onClick={() => setSelected(d)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0E8B42] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#0b7537] transition-colors"
                        >
                          <Send size={12} /> Responder
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelected(d)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
                        >
                          <Edit2 size={12} className="text-blue-500"/> Editar
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDelete(d)}
                        disabled={deleting === d.id}
                        title="Excluir"
                        className="inline-flex items-center justify-center rounded-lg border border-transparent bg-red-50 p-1.5 text-red-500 hover:border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        {deleting === d.id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-300 border-t-red-600" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && duvidas.length > 0 && (
        <p className="mt-3 text-right text-xs text-gray-400">
          {duvidas.length} dúvida(s) neste filtro
        </p>
      )}

      {selected && (
        <ResponderModal
          duvida={selected}
          onClose={() => setSelected(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
