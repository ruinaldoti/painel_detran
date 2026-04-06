"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, FileText, Users, LogOut, Menu, X, Layers } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("USUÁRIO DO SISTEMA");
  const [userProfile, setUserProfile] = useState("ADMINISTRADOR");

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
    }
  }, [router]);

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
          <span className="text-[20px] font-bold tracking-wide text-white">PAINEL DO CHAT</span>
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
                <item.icon size={18} />
                {item.name}
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
