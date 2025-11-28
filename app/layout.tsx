import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner'; 

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Partiet Sentrum Medlem",
  description: "Medlemsportal for Partiet Sentrum og Unge Sentrum",
  manifest: "/manifest.json", // Henviser til PWA-manifestet (Next.js genererer dette automatisk fra manifest.ts)
};

// PWA-innstillinger for mobil
export const viewport: Viewport = {
  themeColor: "#c93960", // Rød statusbar på mobil (matcher PS-fargen)
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Får det til å føles mer som en app (hindrer zooming)
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="no">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        // Hindrer krasj hvis plugins (f.eks. Grammarly) endrer HTML-koden
        suppressHydrationWarning={true} 
      >
        {children}
        
        {/* Varslingssystem (Toasts) */}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}