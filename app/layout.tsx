import type { Metadata, Viewport } from "next";
import "./globals.css";

/**
 * ============================================================================
 * ROOT LAYOUT - SISTEMA DE GESTÃO ACADEMIA
 * ============================================================================
 * 
 * Layout raiz da aplicação Next.js.
 * 
 * RESPONSABILIDADES:
 * - Configuração de metadados SEO
 * - Configuração de viewport
 * - Estrutura HTML base
 * 
 * TIP: Não usamos Google Fonts aqui por performance.
 * Estamos usando system fonts definidas no globals.css.
 */

/**
 * Metadados para SEO e compartilhamento.
 * TODO: Atualizar com nome real da academia
 */
export const metadata: Metadata = {
  title: {
    default: "FitPro - Sistema de Gestão",
    template: "%s | FitPro",
  },
  description: "Sistema de gestão interna para academia de musculação",
  keywords: ["academia", "gestão", "musculação", "fitness"],
  authors: [{ name: "FitPro Academia" }],
  robots: {
    index: false, // Sistema interno - não indexar
    follow: false,
  },
};

/**
 * Configuração de viewport para responsividade.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Evita zoom acidental em tablets
  themeColor: "#1e40af", // Azul primário
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="bg-background">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
