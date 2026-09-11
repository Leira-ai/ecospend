import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import { PwaRegister } from "@/components/public/pwa-register";
import { Providers } from "@/components/providers";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["600", "700", "800"],
});

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "EcoSpend — Keuangan lebih sehat, pilihan lebih sadar",
    template: "%s | EcoSpend",
  },
  description: "Kelola keuangan pribadi, anggaran, target, dan estimasi jejak karbon secara transparan dalam satu tempat.",
  applicationName: "EcoSpend",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "id_ID",
    title: "EcoSpend — Pahami uang Anda, kenali dampaknya",
    description: "Catat pengeluaran, atur anggaran, dan lihat estimasi jejak karbon dalam satu dasbor.",
    url: "/",
    siteName: "EcoSpend",
  },
  twitter: {
    card: "summary_large_image",
    title: "EcoSpend — Pahami uang Anda, kenali dampaknya",
    description: "Keuangan lebih sehat, pilihan lebih sadar.",
  },
  icons: { icon: "/favicon.svg", apple: "/icons/icon.svg" },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f4ec" },
    { media: "(prefers-color-scheme: dark)", color: "#08130e" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`h-full antialiased ${display.variable} ${sans.variable}`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
          <PwaRegister />
        </Providers>
      </body>
    </html>
  );
}
