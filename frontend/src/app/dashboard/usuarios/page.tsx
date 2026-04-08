"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, KeyRound, X } from "lucide-react";

interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: string;
  ativo: boolean;
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmar_senha: "",
    ativo: true,
  });

  const [passwordFormData, setPasswordFormData] = useState({
    senha_atual: "",
    nova_senha: "",
    confirmar_senha: "",
  });

  // Load Users
  const fetchUsuarios = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/usuarios/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Falha ao carregar usuários");
      const data = await res.json();
      setUsuarios(data);
    } catch (err: any) {
      setError(err.message || "Erro desconhecido");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  // Handlers
  const handleOpenModal = (user?: Usuario) => {
    if (user) {
      setEditingUserId(user.id);
      setFormData({
        nome: user.nome,
        email: user.email,
        senha: "",
        confirmar_senha: "",
        ativo: user.ativo,
      });
    } else {
      setEditingUserId(null);
      setFormData({
        nome: "",
        email: "",
        senha: "",
        confirmar_senha: "",
        ativo: true,
      });
    }
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenPasswordModal = (user: Usuario) => {
    setEditingUserId(user.id);
    setPasswordFormData({
      senha_atual: "",
      nova_senha: "",
      confirmar_senha: "",
    });
    setError(null);
    setIsPasswordModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsPasswordModalOpen(false);
    setError(null);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!editingUserId && formData.senha !== formData.confirmar_senha) {
      setError("As senhas não conferem");
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/usuarios/${editingUserId || ""}`;
      const method = editingUserId ? "PUT" : "POST";

      const payload = editingUserId
        ? { nome: formData.nome, email: formData.email, ativo: formData.ativo }
        : { nome: formData.nome, email: formData.email, senha: formData.senha, perfil: "admin" };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Erro ao salvar usuário");
      }

      closeModal();
      fetchUsuarios();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (passwordFormData.nova_senha !== passwordFormData.confirmar_senha) {
      setError("Nova senha e confirmação não conferem");
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/usuarios/${editingUserId}/senha`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(passwordFormData)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Erro ao alterar senha");
      }

      closeModal();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir permanentemente este usuário?")) return;

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/usuarios/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Erro ao deletar usuário");
      }
      fetchUsuarios();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
      <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Users className="text-[#0E8B42]" size={24} />
          Usuários do Sistema
        </h1>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 rounded bg-[#0E8B42] px-4 py-2 text-sm font-medium text-white hover:bg-[#0b7537] transition-colors shadow-sm"
        >
          <Plus size={16} />
          Novo Usuário
        </button>
      </div>

      <div className="p-6 flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0E8B42]"></div>
          </div>
        ) : usuarios.length === 0 ? (
          <div className="text-center py-12">
             <p className="text-gray-500">Nenhum usuário cadastrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="bg-[#0E8B42] text-white">
                <tr>
                  <th className="px-6 py-4 font-semibold text-sm">Nome</th>
                  <th className="px-6 py-4 font-semibold text-sm">E-mail</th>
                  <th className="px-6 py-4 font-semibold text-sm text-center">Status</th>
                  <th className="px-6 py-4 font-semibold text-sm text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {usuarios.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{user.nome}</td>
                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        user.ativo 
                          ? "bg-green-100 text-green-800 border border-green-200" 
                          : "bg-red-100 text-red-800 border border-red-200"
                      }`}>
                        {user.ativo ? '✅ Ativo' : '❌ Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleOpenPasswordModal(user)}
                          title="Alterar Senha"
                          className="text-amber-500 hover:text-amber-600 p-1.5 rounded-md hover:bg-amber-50 transition-colors"
                        >
                          <KeyRound size={18} />
                        </button>
                        <button
                          onClick={() => handleOpenModal(user)}
                          title="Editar Usuário"
                          className="text-blue-500 hover:text-blue-600 p-1.5 rounded-md hover:bg-blue-50 transition-colors"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          title="Excluir"
                          className="text-red-500 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Criar/Editar Usuário */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50/80">
              <h3 className="text-lg font-bold text-gray-800">
                {editingUserId ? "Editar Usuário" : "Novo Usuário"}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveUser} className="p-6">
              {error && (
                <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600 border border-red-200 flex items-center gap-2">
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#0E8B42] focus:ring-1 focus:ring-[#0E8B42]"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#0E8B42] focus:ring-1 focus:ring-[#0E8B42]"
                  />
                </div>

                {!editingUserId && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                      <input
                        type="password"
                        required
                        value={formData.senha}
                        onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#0E8B42] focus:ring-1 focus:ring-[#0E8B42]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Senha</label>
                      <input
                        type="password"
                        required
                        value={formData.confirmar_senha}
                        onChange={(e) => setFormData({ ...formData, confirmar_senha: e.target.value })}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#0E8B42] focus:ring-1 focus:ring-[#0E8B42]"
                      />
                    </div>
                  </>
                )}

                {editingUserId && (
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="ativoFlag"
                      checked={formData.ativo}
                      onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-[#0E8B42] focus:ring-[#0E8B42]"
                    />
                    <label htmlFor="ativoFlag" className="text-sm font-medium text-gray-700">Usuário Ativo</label>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 mt-4">Perfil</label>
                  <input
                    type="text"
                    disabled
                    value="Administrador"
                    className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="mt-8 flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-[#0E8B42] px-4 py-2 text-sm font-medium text-white hover:bg-[#0b7537] transition-colors shadow-sm"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Alterar Senha */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all">
            <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-4 bg-gray-50/80">
              <KeyRound className="text-amber-500" size={20} />
              <h3 className="text-lg font-bold text-gray-800 flex-1">
                Alterar Senha
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSavePassword} className="p-6">
              {error && (
                <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600 border border-red-200 flex items-center gap-2">
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senha Atual</label>
                  <input
                    type="password"
                    required
                    value={passwordFormData.senha_atual}
                    onChange={(e) => setPasswordFormData({ ...passwordFormData, senha_atual: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
                  <input
                    type="password"
                    required
                    value={passwordFormData.nova_senha}
                    onChange={(e) => setPasswordFormData({ ...passwordFormData, nova_senha: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nova Senha</label>
                  <input
                    type="password"
                    required
                    value={passwordFormData.confirmar_senha}
                    onChange={(e) => setPasswordFormData({ ...passwordFormData, confirmar_senha: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="mt-8 flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 transition-colors shadow-sm"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
