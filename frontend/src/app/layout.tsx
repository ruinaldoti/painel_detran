import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Painel Detran CE",
  description: "Painel administrativo do Chatbot Detran-CE",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <Toaster 
          position="top-center" 
          toastOptions={{
            duration: 8000,
            style: {
              fontSize: '20px',
              padding: '24px 32px',
              maxWidth: '600px',
              fontWeight: '600',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            },
            success: {
              style: {
                background: '#6fc27c',
                color: '#ffffff',
              },
              iconTheme: {
                primary: '#ffffff',
                secondary: '#6fc27c',
              },
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
