"use client";

import { useEffect, useState } from "react";
import { Upload, X, FileText, Loader2, Trash2 } from "lucide-react";

interface RAGDocument {
  id: string;
  titulo: string;
  nome_arquivo: string;
  assunto: string;
  setor: string;
}

export default function DocumentosPage() {
  const [documents, setDocuments] = useState<RAGDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [titulo, setTitulo] = useState("");
  const [assunto, setAssunto] = useState("");
  const [servico, setServico] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const API_URL = "https://api.iairuinaldo.com.br";

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

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("titulo", titulo);
    formData.append("assunto", assunto);
    if (servico) formData.append("setor", servico);
    formData.append("file", selectedFile);

    try {
      const response = await fetch(`${API_URL}/rag/upload`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        await fetchDocuments();
        setIsModalOpen(false);
        setSelectedFile(null);
        setTitulo("");
        setAssunto("");
        setServico("");
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
    if (!window.confirm(`ATENÇÃO!\nTem certeza que deseja excluir o documento "${titulo}" e TODOS os seus blocos da IA?`)) {
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
    <div className="w-full h-full flex flex-col p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      
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
          Novo
        </button>
      </div>

      {/* Filtro de Pesquisa Box */}
      <div className="bg-white border border-gray-200 rounded-sm shadow-sm flex flex-col">
        <div className="border-b border-gray-100 px-4 py-3 bg-gray-50/50">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <span className="text-xs">▼</span> Filtro de Pesquisa
          </h3>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Título/Descrição</label>
            <input type="text" className="w-full border border-gray-300 rounded-sm px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Área</label>
            <input type="text" className="w-full border border-gray-300 rounded-sm px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500" />
          </div>
        </div>
        <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100 flex justify-start gap-2">
          <button className="bg-gray-200 text-gray-700 px-4 py-1.5 text-sm font-medium rounded-sm border border-gray-300 hover:bg-gray-300 transition-colors">
            Limpar
          </button>
          <button className="bg-[#2563eb] text-white px-4 py-1.5 text-sm font-medium rounded-sm hover:bg-blue-700 transition-colors">
            Pesquisar
          </button>
        </div>
      </div>

      {/* Table Box */}
      <div className="bg-white border border-gray-200 rounded-sm shadow-sm border-t-[3px] border-t-orange-500 flex-1 flex flex-col overflow-hidden">
        <div className="overflow-x-auto flex-1">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white border-b border-gray-200">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-bold text-blue-600">
                  DESCRIÇÃO
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold text-blue-600 w-1/4">
                  ÁREA
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold text-blue-600 w-1/4">
                  ASSUNTO
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
                    <td className="px-5 py-3 text-sm text-gray-800 break-words align-middle font-medium">
                      {doc.titulo || doc.nome_arquivo}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600 align-middle">
                      {doc.setor || "-"}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600 align-middle break-words">
                      {doc.assunto || "Geral"}
                    </td>
                    <td className="px-5 py-3 text-right align-middle">
                      <div className="flex justify-end gap-1">
                        <button
                          className="bg-gray-100 border border-gray-300 text-gray-600 hover:bg-gray-200 transition-colors p-1.5 rounded-sm"
                          title="Detalhes"
                        >
                          <FileText size={14} />
                        </button>
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
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                disabled={isUploading}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpload} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Área *
                  </label>
                  <input
                    type="text"
                    value={servico}
                    onChange={(e) => setServico(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Ex: Atendimento, Jurídico..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título Arquivo *
                  </label>
                  <input
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Ex: Manual do DETRAN v1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assunto do Arquivo *
                  </label>
                  <input
                    type="text"
                    value={assunto}
                    onChange={(e) => setAssunto(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Ex: CNH, Multas, IPVA..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Arquivo (PDF apenas)
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2.5 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-secondary/10 file:text-secondary
                      hover:file:bg-secondary/20 transition-colors
                      cursor-pointer focus:outline-none"
                    required
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                  disabled={isUploading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !selectedFile}
                  className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#00522e] disabled:opacity-50 transition-colors"
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
