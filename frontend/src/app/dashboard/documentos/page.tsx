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
  const [setor, setSetor] = useState("");
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
    if (setor) formData.append("setor", setor);
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
        setSetor("");
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
    <div className="space-y-6 lg:max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documentos Indexados</h1>
          <p className="mt-1 text-sm text-gray-500">
            Nesta área você gerencia a base de arquivos em PDF do Chatbot.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#008f7f] transition-colors"
        >
          <Upload size={18} />
          Upload de Documento
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Título
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Assunto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Setor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Arquivo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-400" />
                    <p className="mt-2">Carregando documentos...</p>
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <FileText className="mx-auto h-8 w-8 text-gray-300" />
                    <p className="mt-2 font-medium">Nenhum documento encontrado.</p>
                    <p className="text-sm">Faça o upload do seu primeiro PDF.</p>
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 w-1/4 align-middle">
                      <div className="flex items-center">
                        <FileText className="mr-3 h-5 w-5 text-gray-400 shrink-0" />
                        <span className="font-medium text-gray-900 break-words">{doc.titulo || doc.nome_arquivo}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 w-1/3 align-middle">
                      <span className="inline-block rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 break-words text-wrap">
                        {doc.assunto || "Geral"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 align-middle">
                      {doc.setor || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400 break-words max-w-[200px] align-middle">
                      {doc.nome_arquivo}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium w-16 align-middle">
                      <button
                        onClick={() => handleDelete(doc.id, doc.titulo || doc.nome_arquivo)}
                        className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-full hover:bg-red-50"
                        title="Excluir Documento"
                      >
                        <Trash2 size={18} />
                      </button>
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
                    Setor (Opcional)
                  </label>
                  <input
                    type="text"
                    value={setor}
                    onChange={(e) => setSetor(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Ex: Atendimento, Jurídico..."
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
