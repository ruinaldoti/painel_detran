"use client";

import { useEffect, useState } from "react";
import { FileText, Users, MessageSquare, BarChart2, Layers, TrendingUp } from "lucide-react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface TopPergunta {
  pergunta: string;
  quantidade: number;
}

interface ChartArea {
  area: string;
  total: number;
  respondidas: number;
  pendentes: number;
}

interface Stats {
  total: number;
  pendentes: number;
  respondidas: number;
  chart_area?: ChartArea[];
  top_perguntas?: TopPergunta[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ total: 0, pendentes: 0, respondidas: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const storedToken = localStorage.getItem("token") || localStorage.getItem("access_token");
        if (!storedToken) return;
        const cleanToken = storedToken.replace(/^["']|["']$/g, "").trim();

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "https://api.iairuinaldo.com.br"}/duvidas/stats`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cleanToken}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Erro ao buscar stats:", err);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bem-vindo ao Painel Administrativo</h1>
        <p className="mt-1 text-gray-500">Visão geral do sistema e tráfego de conhecimento.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Card 1 */}
        <div className="rounded-xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Documentos Indexados</p>
              <h3 className="mt-2 text-3xl font-bold text-gray-900">Gerenciar</h3>
            </div>
            <div className="rounded-full bg-secondary/10 p-3 text-secondary">
              <FileText size={24} />
            </div>
          </div>
          <div className="mt-6">
            <Link 
              href="/dashboard/documentos" 
              className="text-sm font-medium text-secondary hover:text-primary transition-colors"
            >
              Acessar documentos →
            </Link>
          </div>
        </div>

        {/* Card 2 */}
        <div className="rounded-xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Usuários do Sistema</p>
              <h3 className="mt-2 text-3xl font-bold text-gray-900">Acessos</h3>
            </div>
            <div className="rounded-full bg-primary/10 p-3 text-primary">
              <Users size={24} />
            </div>
          </div>
          <div className="mt-6">
            <Link 
              href="/dashboard/usuarios" 
              className="text-sm font-medium text-primary hover:text-[#00522e] transition-colors"
            >
              Gerenciar usuários →
            </Link>
          </div>
        </div>

        {/* Card 3 */}
        <div className="rounded-xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Acesso Rápido</p>
              <h3 className="mt-2 text-3xl font-bold text-gray-900">Chat</h3>
            </div>
            <div className="rounded-full bg-accent/10 p-3 text-accent">
              <MessageSquare size={24} />
            </div>
          </div>
          <div className="mt-6">
            <Link 
              href="/dashboard/chat" 
              className="text-sm font-medium text-accent hover:text-[#cc4405] transition-colors"
            >
              Testar assistente →
            </Link>
          </div>
        </div>
      </div>

      {stats.chart_area && stats.chart_area.length > 0 && (
        <div className="mt-8 mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico 1: Perguntas por Área */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart2 size={16} className="text-[#0E8B42]" />
              Total de Perguntas por Área
            </h3>
            <div className="flex-1 w-full h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chart_area} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="area" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: "#F3F4F6" }} 
                    contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  />
                  <Bar dataKey="total" name="Total" fill="#0E8B42" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Gráfico 2: Respondidas vs Pendentes */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Layers size={16} className="text-[#0E8B42]" />
              Status por Área (Empilhado)
            </h3>
            <div className="flex-1 w-full h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chart_area} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="area" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: "#F3F4F6" }}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                  <Bar dataKey="respondidas" name="Respondidas" stackId="a" fill="#0E8B42" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="pendentes" name="Pendentes" stackId="a" fill="#F5A623" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Top 10 Ranking */}
      {stats.top_perguntas && stats.top_perguntas.length > 0 && (
        <div className="mb-6 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-[#0E8B42]" />
            Top 10 Perguntas Mais Frequentes do Assistente
          </h3>
          <div className="space-y-4">
            {stats.top_perguntas.map((item, idx) => {
              const maxQtd = stats.top_perguntas![0].quantidade;
              const percent = Math.max(5, (item.quantidade / maxQtd) * 100);
              
              return (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-6 text-center text-xs font-bold text-gray-400">
                    #{idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1.5 align-middle">
                      <span className="font-medium text-gray-700 truncate max-w-lg" title={item.pergunta}>{item.pergunta}</span>
                      <span className="text-gray-500 font-semibold text-xs ml-2">{item.quantidade}x</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-[#0E8B42] h-full rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
