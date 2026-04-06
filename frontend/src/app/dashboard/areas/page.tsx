"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Trash2, Plus, Layers } from "lucide-react";

interface Area {
  id: string;
  area: string;
}

export default function AreasPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [novaArea, setNovaArea] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const API_URL = "https://api.iairuinaldo.com.br";

  const fetchAreas = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/areas/`);
      if (response.ok) {
        const data = await response.json();
        setAreas(data);
      }
    } catch (error) {
      console.error("Erro ao carregar áreas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!novaArea.trim()) return;
    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/areas/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ area: novaArea.trim() }),
      });

      if (response.ok) {
        await fetchAreas();
        setIsModalOpen(false);
        setNovaArea("");
      } else {
        const data = await response.json();
        setError(data.detail || "Erro ao cadastrar área.");
      }
    } catch {
      setError("Erro de conexão com o servidor.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, nome: string) => {
    if (!window.confirm(`Excluir a área "${nome}"?\n\nAtenção: documentos vinculados a ela perderão a classificação de área.`)) return;
    try {
      const response = await fetch(`${API_URL}/areas/${id}`, { method: "DELETE" });
      if (response.ok) {
        await fetchAreas();
      } else {
        alert("Erro ao excluir a área.");
      }
    } catch {
      alert("Erro de conexão ao excluir.");
    }
  };

  return (
    <div className="w-full h-full flex flex-col space-y-6">

      {/* Breadcrumbs */}
      <div className="flex items-center text-sm font-medium text-blue-600 gap-1.5">
        <span className="cursor-pointer hover:underline">Início</span>
        <span className="text-gray-400">→</span>
        <span className="text-gray-600">Áreas</span>
      </div>

      {/* Título + Botão */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">CADASTRO DE ÁREAS</h1>
        <button
          onClick={() => { setIsModalOpen(true); setError(""); setNovaArea(""); }}
          className="rounded bg-[#2563eb] px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          Nova Área
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-white border border-gray-200 rounded-sm shadow-sm border-t-[3px] border-t-orange-500 flex-1 flex flex-col overflow-hidden">
        <div className="overflow-x-auto flex-1">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white border-b border-gray-200">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-bold text-blue-600">
                  ÁREA
                </th>
                <th className="px-5 py-4 text-right text-xs font-bold text-blue-600 w-24">
                  AÇÕES
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={2} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-400" />
                    <p className="mt-2">Carregando áreas...</p>
                  </td>
                </tr>
              ) : areas.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-6 py-16 text-center text-gray-400">
                    <Layers className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p className="font-medium text-gray-500">Nenhuma área cadastrada.</p>
                    <p className="text-sm mt-1">Clique em "Nova Área" para começar.</p>
                  </td>
                </tr>
              ) : (
                areas.map((area) => (
                  <tr key={area.id} className="even:bg-gray-50 hover:bg-blue-50/50 transition-colors">
                    <td className="px-5 py-3 text-sm text-gray-800 font-medium align-middle">
                      {area.area}
                    </td>
                    <td className="px-5 py-3 text-right align-middle">
                      <button
                        onClick={() => handleDelete(area.id, area.area)}
                        className="bg-gray-100 border border-gray-300 text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors p-1.5 rounded-sm"
                        title="Excluir Área"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nova Área */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Layers size={18} className="text-blue-600" />
                Nova Área
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Área *
                </label>
                <input
                  type="text"
                  value={novaArea}
                  onChange={(e) => setNovaArea(e.target.value)}
                  required
                  autoFocus
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Ex: Atendimento ao Cidadão, Jurídico..."
                />
              </div>
              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-lg bg-[#2563eb] px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  {isSaving ? "Salvando..." : "Cadastrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
