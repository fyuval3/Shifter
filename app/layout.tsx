import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Shifter - שיפטר",
  description: "כלי לניהול משמרות שמירה עבור מילואימניקים",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body
        className={`${inter.variable} antialiased font-sans bg-slate-900 text-slate-100`}
      >
        {children}
      </body>
    </html>
  );
}
