import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Assistente Virtual | DETRAN-CE",
  description: "Assistente virtual inteligente do Departamento Estadual de Trânsito do Ceará.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
