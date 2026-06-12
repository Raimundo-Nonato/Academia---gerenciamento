import type { Metadata, Viewport } from "next";
import { Archivo, Figtree } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
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
 * - Registro das fontes (next/font, self-hosted no build)
 * - ThemeProvider (dark mode via classe, next-themes)
 * - Toaster global (sonner)
 */

/**
 * Fontes do design system:
 * - Archivo: títulos e números de destaque (athletic, geométrica)
 * - Figtree: texto corrido (legível e amigável)
 *
 * next/font baixa e self-hosta os arquivos no build — zero requests
 * ao Google Fonts em runtime.
 */
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});

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
 * Configuração de viewport.
 * NOTA: não bloqueamos zoom (maximumScale/userScalable) — bloquear
 * viola WCAG 1.4.4 e atrapalha usuários com baixa visão.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#14161f" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: o next-themes altera a classe do <html>
    // no cliente antes da hidratação (evita flash de tema errado)
    <html
      lang="pt-BR"
      className={`${archivo.variable} ${figtree.variable} bg-background`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="bottom-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
