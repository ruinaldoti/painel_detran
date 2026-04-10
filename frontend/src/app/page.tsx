"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const fd = new URLSearchParams();
      fd.append("username", email);
      fd.append("password", password);

      const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.iairuinaldo.com.br";
      const response = await fetch(`${baseURL}/auth/login`, {
        method: "POST",
        body: fd,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      if (!response.ok) {
        throw new Error("Credenciais inválidas ou sem autorização");
      }

      const data = await response.json();
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user_name", data.user_name);
      localStorage.setItem("user_perfil", data.user_perfil);
      if (data.user_id) localStorage.setItem("user_id", data.user_id);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center p-4">
      {/* Container Principal */}
      <div className="w-full max-w-md bg-white border border-gray-200 p-8 rounded-2xl shadow-xl shadow-gray-200/40">
        
        {/* Cabeçalho / Brasão Institucional */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#006B3C] rounded-full flex items-center justify-center mb-4 shadow-md">
            {/* Ícone placeholder para o Brasão Detran */}
            <svg 
              className="w-8 h-8 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#1A1A1A]">Gestão do Chat IA</h2>
          <p className="text-[#00A896] mt-1 font-medium text-sm text-center tracking-wide">
            Governo do Estado do Ceará
          </p>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-6 text-sm text-center font-medium">
            {error}
          </div>
        )}

        {/* Formulário de Autenticação */}
        <form onSubmit={handleLogin} className="space-y-6">
          
          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-[#1A1A1A] mb-1.5">
              E-mail Institucional
            </label>
            <input
              type="email"
              required
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-black font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#006B3C]/50 focus:border-[#006B3C] transition-all"
              placeholder="seu.nome@detran.ce.gov.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Senha com Toggle */}
          <div>
            <label className="block text-sm font-semibold text-[#1A1A1A] mb-1.5">
              Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-4 pr-12 py-3 text-black font-medium tracking-widest placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#006B3C]/50 focus:border-[#006B3C] transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-[#006B3C] transition-colors focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Ocultar Senha" : "Mostrar Senha"}
              >
                {showPassword ? (
                  // Eye Slash Icon
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  // Eye Icon
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            
            {/* Link de Esquecer Senha Estilizado */}
            <div className="flex justify-end mt-2">
              <a href="#" className="text-sm text-[#006B3C] font-semibold hover:text-[#00A896] transition-colors">
                Esqueceu a senha?
              </a>
            </div>
          </div>

          {/* Botão Primário Laranja */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E8520A] hover:bg-[#cf4808] disabled:bg-[#f3956c] disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center transform active:scale-[0.98]"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : "Entrar"}
          </button>
        </form>

      </div>
      
      {/* Rodapé Oficial Discreto */}
      <div className="absolute bottom-6 text-center text-xs text-gray-400">
        <p>&copy; {new Date().getFullYear()} Departamento Estadual de Trânsito - CE</p>
        <p className="mt-1">Todos os direitos reservados.</p>
      </div>

    </div>
  );
}
