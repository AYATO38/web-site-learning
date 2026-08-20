import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  Geist_Mono,
  Inter,
  Noto_Sans_JP,
  Noto_Serif_JP,
} from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/home/bottom-nav";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const noto = Noto_Sans_JP({
  variable: "--font-noto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const serifJp = Noto_Serif_JP({
  variable: "--font-serif-jp",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "POSSE Learning",
  description: "大学生向けプログラミング学習アプリ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${inter.variable} ${noto.variable} ${serifJp.variable} ${cormorant.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="app-bg flex min-h-full flex-col">
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
