"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { X, Loader2, Trash2, Plus, Layers, ChevronDown, ChevronUp, Edit2 } from "lucide-react";
import { toast } from "react-hot-toast";

interface Assunto {
  id: string;
  id_area: string;
  assunto: string;
}

interface Area {
  id: string;
  area: string;
}

export default function AreasPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for Accordion
  const [expandedAreaId, setExpandedAreaId] = useState<string | null>(null);
  const [assuntos, setAssuntos] = useState<Assunto[]>([]);
  const [isLoadingAssuntos, setIsLoadingAssuntos] = useState(false);

  // States for Areas Modal
  const [isModalAreaOpen, setIsModalAreaOpen] = useState(false);
  const [novaArea, setNovaArea] = useState("");
  const [isSavingArea, setIsSavingArea] = useState(false);
  const [errorArea, setErrorArea] = useState("");

  // States for Assunto Modal
  const [isModalAssuntoOpen, setIsModalAssuntoOpen] = useState(false);
  const [assuntoEditingId, setAssuntoEditingId] = useState<string | null>(null);
  const [novoAssuntoDesc, setNovoAssuntoDesc] = useState("");
  const [isSavingAssunto, setIsSavingAssunto] = useState(false);
  const [errorAssunto, setErrorAssunto] = useState("");

  const router = useRouter();
  const pathname = usePathname();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.iairuinaldo.com.br";

  const fetchAreas = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const cleanToken = token ? token.replace(/^["']|["']$/g, "").trim() : "";
      
      const response = await fetch(`${API_URL}/areas/`, {
        headers: { Authorization: `Bearer ${cleanToken}` }
      });

      if (response.status === 401) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("access_token");
        }
        router.push("/");
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setAreas(data);
      }
    } catch (error) {
      console.error("Erro ao carregar áreas:", error);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const fetchAssuntos = async (areaId: string) => {
    setIsLoadingAssuntos(true);
    try {
      const response = await fetch(`${API_URL}/assuntos/area/${areaId}`);
      if (response.ok) {
        const data = await response.json();
        setAssuntos(data);
      }
    } catch (error) {
      console.error("Erro ao carregar assuntos", error);
    } finally {
      setIsLoadingAssuntos(false);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, [fetchAreas]);

  // Handle visibility changes for automatic refetch when returning to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchAreas();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchAreas]);

  // Handle SPA routing to reload data when explicitly navigating to this screen
  useEffect(() => {
    if (pathname === '/dashboard/areas') {
      fetchAreas();
    }
  }, [pathname, fetchAreas]);

  const toggleArea = (areaId: string) => {
    if (expandedAreaId === areaId) {
      setExpandedAreaId(null);
      setAssuntos([]);
    } else {
      setExpandedAreaId(areaId);
      fetchAssuntos(areaId);
    }
  };

  // --- AREA ACTIONS ---
  const handleSaveArea = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorArea("");
    if (!novaArea.trim()) return;
    setIsSavingArea(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const cleanToken = token ? token.replace(/^["']|["']$/g, "").trim() : "";
      
      const response = await fetch(`${API_URL}/areas/`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${cleanToken}`
        },
        body: JSON.stringify({ area: novaArea.trim() }),
      });

      if (response.ok) {
        toast.success("Área cadastrada com sucesso!");
        await fetchAreas();
        setIsModalAreaOpen(false);
        setNovaArea("");
      } else {
        const data = await response.json();
        setErrorArea(data.detail || "Erro ao cadastrar área.");
      }
    } catch {
      setErrorArea("Erro de conexão com o servidor.");
    } finally {
      setIsSavingArea(false);
    }
  };

  const handleDeleteArea = async (id: string, nome: string) => {
    if (!window.confirm(`Tem certeza de que deseja excluir a área "${nome}"?`)) return;
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const cleanToken = token ? token.replace(/^["']|["']$/g, "").trim() : "";
      
      const response = await fetch(`${API_URL}/areas/${id}`, { 
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${cleanToken}`
        }
      });
      if (response.ok) {
        if (expandedAreaId === id) setExpandedAreaId(null);
        await fetchAreas();
      } else {
        let msg = "Não foi possível excluir a área devido a um erro no servidor.";
        try {
          const data = await response.json();
          if (data.detail) msg = data.detail;
        } catch(e) {}
        alert(`Atenção: ${msg}`);
      }
    } catch (error: any) {
      alert(`Erro de conexão ao tentar excluir.`);
    }
  };

  // --- ASSUNTO ACTIONS ---
  const handleOpenAssuntoModal = (assuntoId: string | null = null, desc: string = "") => {
    setAssuntoEditingId(assuntoId);
    setNovoAssuntoDesc(desc);
    setErrorAssunto("");
    setIsModalAssuntoOpen(true);
  };

  const handleSaveAssunto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expandedAreaId || !novoAssuntoDesc.trim()) return;
    setIsSavingAssunto(true);
    setErrorAssunto("");

    const isEditing = assuntoEditingId !== null;
    const url = isEditing ? `${API_URL}/assuntos/${assuntoEditingId}` : `${API_URL}/assuntos/`;
    const method = isEditing ? "PUT" : "POST";

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const cleanToken = token ? token.replace(/^["']|["']$/g, "").trim() : "";
      
      const response = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${cleanToken}`
        },
        body: JSON.stringify({ id_area: expandedAreaId, assunto: novoAssuntoDesc.trim() }),
      });

      if (response.ok) {
        toast.success(isEditing ? "Assunto atualizado com sucesso!" : "Assunto cadastrado com sucesso!");
        await fetchAssuntos(expandedAreaId);
        setIsModalAssuntoOpen(false);
      } else {
        const data = await response.json();
        setErrorAssunto(data.detail || "Erro ao salvar assunto.");
      }
    } catch {
      setErrorAssunto("Erro de conexão.");
    } finally {
      setIsSavingAssunto(false);
    }
  };

  const handleDeleteAssunto = async (id: string, desc: string) => {
    if (!window.confirm(`Excluir o assunto "${desc}"?`)) return;
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const cleanToken = token ? token.replace(/^["']|["']$/g, "").trim() : "";
      
      const response = await fetch(`${API_URL}/assuntos/${id}`, { 
        method: "DELETE",
        headers: { Authorization: `Bearer ${cleanToken}` } 
      });
      if (response.ok && expandedAreaId) {
        await fetchAssuntos(expandedAreaId);
      } else {
        let msg = "Não foi possível excluir o assunto devido a um erro no servidor.";
        try {
          const data = await response.json();
          if (data.detail) msg = data.detail;
        } catch (e) {}
        alert(`Atenção: ${msg}`);
      }
    } catch {
      alert("Erro de conexão ao tentar excluir.");
    }
  };

  return (
    <div className="w-full h-full flex flex-col space-y-6">
      <div className="flex items-center text-sm font-medium text-blue-600 gap-1.5">
        <span className="cursor-pointer hover:underline">Início</span>
        <span className="text-gray-400">→</span>
        <span className="text-gray-600">Áreas e Assuntos</span>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">CADASTRO DE ÁREAS & ASSUNTOS</h1>
        <button
          onClick={() => { setIsModalAreaOpen(true); setErrorArea(""); setNovaArea(""); }}
          className="rounded bg-[#2563eb] px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          Nova Área
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-sm shadow-sm border-t-[3px] border-t-orange-500 flex-1 flex flex-col overflow-hidden">
        <div className="overflow-x-auto flex-1 p-4">
          {isLoading ? (
            <div className="py-12 text-center text-gray-500 flex flex-col items-center">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <p className="mt-2">Carregando áreas...</p>
            </div>
          ) : areas.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <Layers className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="font-medium text-gray-500">Nenhuma área cadastrada.</p>
              <p className="text-sm mt-1">Clique em "Nova Área" para começar.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {areas.map((area) => {
                const isExpanded = expandedAreaId === area.id;
                return (
                  <div key={area.id} className="border border-gray-200 rounded overflow-hidden">
                    {/* Header Area */}
                    <div 
                      className={`flex items-center justify-between px-5 py-3 cursor-pointer select-none transition-colors ${isExpanded ? "bg-blue-50" : "bg-white hover:bg-gray-50"}`}
                      onClick={() => toggleArea(area.id)}
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? <ChevronUp size={20} className="text-blue-600" /> : <ChevronDown size={20} className="text-gray-400" />}
                        <span className="font-semibold text-gray-800">{area.area}</span>
                      </div>
                      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                        {isExpanded && (
                          <button 
                            onClick={() => handleOpenAssuntoModal()}
                            className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium hover:bg-blue-200 transition"
                          >
                            + Add Assunto
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteArea(area.id, area.area)}
                          className="text-red-500 hover:bg-red-50 p-1.5 rounded transition"
                          title="Excluir Área"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Collapsible Content */}
                    {isExpanded && (
                      <div className="bg-gray-50 border-t border-gray-200 p-4">
                        {isLoadingAssuntos ? (
                          <div className="text-sm text-gray-500 flex items-center gap-2">
                            <Loader2 size={14} className="animate-spin" /> Carregando assuntos...
                          </div>
                        ) : assuntos.length === 0 ? (
                          <div className="text-sm text-gray-500 italic">Nenhum assunto cadastrado para esta área.</div>
                        ) : (
                          <table className="min-w-full divide-y divide-gray-200 bg-white rounded border border-gray-200">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Assunto</th>
                                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 w-24">Ações</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {assuntos.map(assunto => (
                                <tr key={assunto.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-2 text-sm text-gray-800">{assunto.assunto}</td>
                                  <td className="px-4 py-2 text-right flex justify-end gap-2">
                                    <button 
                                      onClick={() => handleOpenAssuntoModal(assunto.id, assunto.assunto)}
                                      className="text-blue-500 hover:text-blue-700 p-1"
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteAssunto(assunto.id, assunto.assunto)}
                                      className="text-red-500 hover:text-red-700 p-1"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal Nova Área */}
      {isModalAreaOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Layers size={18} className="text-blue-600" />
                Nova Área
              </h3>
              <button
                onClick={() => setIsModalAreaOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveArea} className="p-6 space-y-4">
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
                  placeholder="Digite aqui o nome da Área"
                />
              </div>
              {errorArea && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{errorArea}</p>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalAreaOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingArea}
                  className="flex items-center gap-2 rounded-lg bg-[#2563eb] px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isSavingArea ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  {isSavingArea ? "Salvando..." : "Cadastrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Novo/Editar Assunto */}
      {isModalAssuntoOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Layers size={18} className="text-blue-600" />
                {assuntoEditingId ? "Editar Assunto" : "Novo Assunto"}
              </h3>
              <button
                onClick={() => setIsModalAssuntoOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveAssunto} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Assunto *
                </label>
                <input
                  type="text"
                  value={novoAssuntoDesc}
                  onChange={(e) => setNovoAssuntoDesc(e.target.value)}
                  required
                  autoFocus
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Digite aqui o nome do Assunto"
                />
              </div>
              <p className="text-[10px] text-gray-500 leading-tight">O sistema irá gerar um vetor semântico disto automaticamente conectando à Área selecionada. Esta operação demanda tempo (1-3 segs).</p>
              {errorAssunto && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{errorAssunto}</p>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalAssuntoOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingAssunto}
                  className="flex items-center gap-2 rounded-lg bg-[#2563eb] px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isSavingAssunto ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  {isSavingAssunto ? "Processando..." : (assuntoEditingId ? "Salvar" : "Criar")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
