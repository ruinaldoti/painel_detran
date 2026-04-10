"use client";

import { useEffect, useState } from "react";
import { Upload, X, FileText, Loader2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface RAGDocument {
  id: string;
  titulo: string;
  nome_arquivo: string;
  assunto: string;
  id_area: string | null;
  area_nome?: string;
}

interface Area {
  id: string;
  area: string;
}

export default function DocumentosPage() {
  const [documents, setDocuments] = useState<RAGDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [titulo, setTitulo] = useState("");
  const [assunto, setAssunto] = useState("");
  const [idArea, setIdArea] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [areas, setAreas] = useState<Area[]>([]);
  const [assuntosDrop, setAssuntosDrop] = useState<any[]>([]);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const API_URL = "https://api.iairuinaldo.com.br";

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedFile(null);
    setTitulo("");
    setAssunto("");
    setIdArea("");
    setAttemptedSubmit(false);
  };

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/rag/documents`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error("Erro ao carregar documentos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAreas = async () => {
    try {
      const response = await fetch(`${API_URL}/areas/`);
      if (response.ok) setAreas(await response.json());
    } catch { /* silencioso */ }
  };

  useEffect(() => {
    fetchDocuments();
    fetchAreas();
  }, []);

  // Busca Assuntos dinamicamente quando a Área é selecionada
  useEffect(() => {
    if (!idArea) {
      setAssuntosDrop([]);
      setAssunto("");
      return;
    }
    fetch(`${API_URL}/assuntos/area/${idArea}`)
      .then(res => res.json())
      .then(data => {
        setAssuntosDrop(Array.isArray(data) ? data : []);
        setAssunto(""); // reset assunto when area changes
      })
      .catch(() => setAssuntosDrop([]));
  }, [idArea]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedSubmit(true);

    if (!selectedFile || !idArea || !assunto || !titulo) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("titulo", titulo);
    formData.append("assunto", assunto);
    formData.append("id_area", idArea);
    formData.append("file", selectedFile);

    try {
      const response = await fetch(`${API_URL}/rag/upload`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        await fetchDocuments();
        closeModal();
        toast.success("Documento inserido com sucesso!");
      } else {
        alert("Erro no upload do arquivo.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Erro ao enviar o documento.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string, titulo: string) => {
    if (!window.confirm(`ATENÇÃO!\nTem certeza que deseja excluir o documento "${titulo}" e TODOS os seus blocos da base de conhecimento?`)) {
      return;
    }
    try {
      const response = await fetch(`${API_URL}/rag/documents/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        await fetchDocuments();
      } else {
        alert("Erro ao excluir o arquivo.");
      }
    } catch (error) {
      console.error("Erro na exclusao:", error);
      alert("Erro de conexao ao excluir.");
    }
  };

  return (
    <div className="w-full h-full flex flex-col space-y-6">
      
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm font-medium text-blue-600 gap-1.5">
        <span className="cursor-pointer hover:underline">Início</span>
        <span className="text-gray-400">→</span>
        <span className="text-gray-600">Documentos</span>
      </div>

      {/* Page Title & Button */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">DOCUMENTOS INDEXADOS</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded bg-[#2563eb] px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          Upload do Arquivo
        </button>
      </div>

      {/* Table Box */}
      <div className="bg-white border border-gray-200 rounded-sm shadow-sm border-t-[3px] border-t-orange-500 flex-1 flex flex-col overflow-hidden">
        <div className="overflow-x-auto flex-1">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white border-b border-gray-200">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-bold text-blue-600 w-1/4">
                  ÁREA
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold text-blue-600 w-1/4">
                  ASSUNTO
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold text-blue-600">
                  DESCRIÇÃO
                </th>
                <th className="px-5 py-4 text-right text-xs font-bold text-blue-600 w-24">
                  AÇÕES
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-400" />
                    <p className="mt-2">Carregando documentos...</p>
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    <FileText className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                    <p className="font-medium">Nenhum documento encontrado.</p>
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="even:bg-gray-50 hover:bg-blue-50/50 transition-colors">
                    <td className="px-5 py-3 text-sm text-gray-600 align-middle">
                      {doc.id_area
                        ? (areas.find(a => a.id === doc.id_area)?.area || "-")
                        : "-"}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600 align-middle break-words">
                      {doc.assunto || "Geral"}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-800 break-words align-middle font-medium">
                      {doc.titulo || doc.nome_arquivo}
                    </td>
                    <td className="px-5 py-3 text-right align-middle">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleDelete(doc.id, doc.titulo || doc.nome_arquivo)}
                          className="bg-gray-100 border border-gray-300 text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors p-1.5 rounded-sm"
                          title="Excluir Documento"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Upload */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Novo Documento PDF</h3>
              <button
                onClick={closeModal}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                disabled={isUploading}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpload} className="p-6" noValidate>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Área *
                  </label>
                  <select
                    value={idArea}
                    onChange={(e) => setIdArea(e.target.value)}
                    required
                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-gray-900 placeholder-gray-500 bg-white ${
                      attemptedSubmit && !idArea ? "border-red-500" : "border-gray-300 focus:border-primary"
                    }`}
                  >
                    <option value="" className="text-gray-700">Selecione uma área...</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id} className="text-gray-900">{a.area}</option>
                    ))}
                  </select>
                  {attemptedSubmit && !idArea && (
                    <p className="mt-1 text-xs text-red-500">A área é obrigatória.</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Título Arquivo *
                  </label>
                  <input
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    required
                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-gray-900 placeholder-gray-500 bg-white ${
                      attemptedSubmit && !titulo ? "border-red-500" : "border-gray-300 focus:border-primary"
                    }`}
                    placeholder="Digite o título do arquivo aqui"
                  />
                  {attemptedSubmit && !titulo && (
                    <p className="mt-1 text-xs text-red-500">O título é obrigatório.</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Assunto do Arquivo *
                  </label>
                  <select
                    value={assunto}
                    onChange={(e) => setAssunto(e.target.value)}
                    required
                    disabled={!idArea || assuntosDrop.length === 0}
                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-gray-900 placeholder-gray-500 bg-white ${
                      attemptedSubmit && !assunto ? "border-red-500" : "border-gray-300 focus:border-primary"
                    }`}
                  >
                    <option value="" className="text-gray-700">
                      {!idArea ? "Selecione uma área primeiro..." : (assuntosDrop.length === 0 ? "Nenhum assunto nesta área..." : "Selecione um assunto...")}
                    </option>
                    {assuntosDrop.map((a) => (
                      <option key={a.id} value={a.assunto} className="text-gray-900">{a.assunto}</option>
                    ))}
                  </select>
                  {attemptedSubmit && !assunto && (
                    <p className="mt-1 text-xs text-red-500">O assunto é obrigatório.</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Arquivo (PDF apenas) *
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                    className={`block w-full text-sm text-gray-500
                      file:mr-4 file:py-2.5 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-secondary/10 file:text-secondary
                      hover:file:bg-secondary/20 transition-colors
                      cursor-pointer focus:outline-none ${
                        attemptedSubmit && !selectedFile ? "border border-red-500 rounded p-1" : ""
                      }`}
                    required
                  />
                  {attemptedSubmit && !selectedFile && (
                    <p className="mt-1 text-xs text-red-500">O arquivo é obrigatório.</p>
                  )}
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                  disabled={isUploading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  onClick={() => setAttemptedSubmit(true)}
                  disabled={isUploading}
                  className={`flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors ${
                    isUploading || !selectedFile || !titulo || !idArea || !assunto
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-[#00522e]"
                  }`}
                >
                  {isUploading && <Loader2 size={16} className="animate-spin" />}
                  {isUploading ? "Enviando e Vetorizando..." : "Concluir Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
