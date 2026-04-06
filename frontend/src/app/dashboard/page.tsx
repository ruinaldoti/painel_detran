"use client";

import { FileText, Users, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bem-vindo ao Painel Administrativo</h1>
        <p className="mt-1 text-gray-500">Gerencie a base de conhecimento e usuários do chat RAG.</p>
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
    </div>
  );
}
