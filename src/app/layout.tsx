import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pilastri — Finanze Famiglia",
  description: "Sistema di controllo finanziario familiare. Ogni euro ha un compito.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Pilastri",
  },
};

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-stone-50">
        <main className="flex-1 max-w-2xl mx-auto w-full px-4 pt-6 pb-24">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
