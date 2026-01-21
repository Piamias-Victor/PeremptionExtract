import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { ThemeProvider } from "@/components/ThemeProvider";

import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "MediCheck | Extraction IA",
  description: "Extraction intelligente de données pharmaceutiques par IA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen text-foreground selection:bg-primary/20 selection:text-primary transition-colors duration-300`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
            <div className="bg-mesh opacity-50 dark:opacity-100 transition-opacity duration-300" />
            
            <Header />

            <main className="relative z-10 flex flex-col min-h-screen">
              {children}
            </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
