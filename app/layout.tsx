import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import type React from "react";
import { Suspense } from "react";
import { NextAuthProvider } from "@/components/session-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import "streamdown/styles.css";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Zero Calendar | AI-Powered Scheduling",
  description:
    "Transform your time management with AI. Zero Calendar learns your patterns, optimizes your schedule, and gives you back what matters most.",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body className={`${geist.variable} font-sans antialiased`}>
        <Suspense fallback={null}>
          <NextAuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              forcedTheme="dark"
            >
              {children}
              <Toaster />
            </ThemeProvider>
          </NextAuthProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  );
}
