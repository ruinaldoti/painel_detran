"use client";

import { useEffect, useState } from "react";
import { FileText, Users, MessageSquare, BarChart2, Layers, TrendingUp } from "lucide-react";
import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ChartData {
  nome: string;
  total: number;
}

interface Stats {
  total: number;
  pendentes: number;
  respondidas: number;
  chart_area?: ChartData[];
  chart_assunto?: ChartData[];
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

      {(stats.chart_area || stats.chart_assunto) && (
        <div className="mt-8 mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico 1: Por Área */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart2 size={16} className="text-[#0E8B42]" />
              Total de Dúvidas por Área
            </h3>
            <div style={{ height: "300px", width: "100%" }}>
              {stats.chart_area && stats.chart_area.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.chart_area}
                      dataKey="total"
                      nameKey="nome"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={50}
                      paddingAngle={2}
                      label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {stats.chart_area.map((entry, index) => (
                        <Cell key={`cell-area-${index}`} fill={['#0E8B42', '#2563EB', '#F5A623', '#8B5CF6', '#EC4899', '#14B8A6'][index % 6]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any, name: any) => [`${value} dúvídas`, name]}
                      contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-400">Sem dados de área vinculados.</div>
              )}
            </div>
          </div>
          
          {/* Gráfico 2: Por Assunto */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Layers size={16} className="text-[#0E8B42]" />
              Total de Dúvidas por Assunto
            </h3>
            <div style={{ height: "300px", width: "100%" }}>
              {stats.chart_assunto && stats.chart_assunto.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.chart_assunto}
                      dataKey="total"
                      nameKey="nome"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={50}
                      paddingAngle={2}
                      label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {stats.chart_assunto.map((entry, index) => (
                        <Cell key={`cell-assunto-${index}`} fill={['#2563EB', '#F5A623', '#0E8B42', '#8B5CF6', '#EC4899', '#14B8A6'][index % 6]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any, name: any) => [`${value} dúvídas`, name]}
                      contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-400">Sem dados de assunto vinculados.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
