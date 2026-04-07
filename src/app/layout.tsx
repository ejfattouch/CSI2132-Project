import type { Metadata } from "next";
import { Fraunces, Manrope, Space_Mono } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-geist-mono",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "e-Hotels | Dashboard",
  description: "Phase 1 dashboard shell for the e-Hotels web application.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${manrope.variable} ${fraunces.variable} ${spaceMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full bg-background text-foreground">{children}</body>
    </html>
  );
}
