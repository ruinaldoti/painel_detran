"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, FileText, Users, LogOut, Menu, X, Layers, MessageCircleQuestion } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("USUÁRIO DO SISTEMA");
  const [userProfile, setUserProfile] = useState("ADMINISTRADOR");
  const [pendentesCount, setPendentesCount] = useState<number>(0);

  const fetchPendentes = async () => {
    try {
      const storedToken = localStorage.getItem("token");
      if (!storedToken || storedToken === "undefined" || storedToken === "null") {
        return;
      }
      
      const cleanToken = storedToken.replace(/^["']|["']$/g, "").trim();

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "https://api.iairuinaldo.com.br"}/duvidas/stats`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${cleanToken}` }
      });

      if (res.status === 401 && typeof window !== "undefined") {
        console.error("Token Inválido no layout. Deslogando.");
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setPendentesCount(data.pendentes || 0);
      }
    } catch (e) {
      // silent fail
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/");
    } else {
      setIsAuthenticated(true);
      const name = localStorage.getItem("user_name");
      const profile = localStorage.getItem("user_perfil");
      if (name) setUserName(name);
      if (profile) setUserProfile(profile);
      fetchPendentes();
    }
  }, [router]);

  useEffect(() => {
    const handleDuvidasChanged = () => fetchPendentes();
    // Escuta o evento local do page.tsx para atualizar o menu em tempo real
    window.addEventListener("duvidas_changed", handleDuvidasChanged);
    return () => window.removeEventListener("duvidas_changed", handleDuvidasChanged);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    router.push("/");
  };

  if (!isAuthenticated) {
    return null; // Return empty until auth is verified
  }

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Documentos", href: "/dashboard/documentos", icon: FileText },
    { name: "Áreas", href: "/dashboard/areas", icon: Layers },
    { name: "Dúvidas", href: "/dashboard/duvidas", icon: MessageCircleQuestion },
    { name: "Usuários", href: "/dashboard/usuarios", icon: Users },
  ];

  return (
    <div className="flex h-screen bg-[#f4f4f4] overflow-hidden font-sans">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-50 w-64 bg-[#0E8B42] text-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 border-r border-[#0E8B42]`}
      >
        <div className="flex h-16 items-center justify-between bg-[#0b7537] px-6">
          <span className="text-[20px] font-bold tracking-wide text-white">GESTÃO DO CHAT IA</span>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-green-100 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <nav className="mt-4 space-y-1 px-0">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors border-l-4 ${
                  isActive
                    ? "bg-[#0b7537] text-white border-white"
                    : "text-green-50 border-transparent hover:bg-[#0c803c] hover:text-white"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <item.icon size={18} />
                    {item.name}
                  </div>
                  {item.name === "Dúvidas" && pendentesCount > 0 && (
                    <span className="flex items-center justify-center rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm ring-1 ring-amber-600/50">
                      {pendentesCount} {pendentesCount === 1 ? 'pendente' : 'pendentes'}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between bg-[#0E8B42] px-4 md:px-6 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-white hover:text-green-100"
            >
              <Menu size={24} />
            </button>
            <div className="hidden lg:block text-white">
              <button 
                onClick={() => setSidebarOpen(!isSidebarOpen)}
                className="text-white hover:text-green-200 focus:outline-none"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-white text-xs md:text-sm font-semibold tracking-wide">
            <div className="hidden sm:flex items-center gap-2">
              <Users size={16} />
              <span className="uppercase">{userName} - {userProfile === 'admin' ? 'ADMINISTRADOR' : 'AGENTE'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="ml-2 flex items-center gap-2 rounded bg-[#0b7537] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#09602c] transition-colors"
            >
              <LogOut size={14} />
              Sair
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="flex-1 overflow-y-auto w-full p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
