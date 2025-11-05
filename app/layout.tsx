import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AnimatePresence } from "framer-motion";
import CosmicBackground from "@/components/CosmicBackground";
import LoadingPreloader from "@/components/LoadingPreloader";
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
  title: "PhotoPocket 3.0",
  description: "Secure on-demand digital photo delivery platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
        style={{ background: '#0A0A0A', color: '#EDEDED', fontFamily: 'Poppins, Segoe UI, Arial, sans-serif' }}
      >
        <div id="cosmic-bg"></div>
        <LoadingPreloader />
        <CosmicBackground />
        <AnimatePresence mode="wait">
          {children}
        </AnimatePresence>
        <footer className="mt-auto text-center py-4 text-gray-500 text-sm">
          made with love by fotofolks
        </footer>
      </body>
    </html>
  );
}
