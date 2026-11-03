import type { Metadata, Viewport } from "next";
import { Public_Sans, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { ElectionProvider } from "@/context/election-context";
import { PwaRegister } from "@/components/pwa-register";

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  weight: ["500", "600", "700"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0A5C36",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Eleição de Oficiais 2026 — IPB Serra Talhada",
  description:
    "Assembleia Geral Extraordinária - Eleição de Diáconos e Presbíteros da Igreja Presbiteriana de Serra Talhada",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Eleição IPST",
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "64x64", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${publicSans.variable} ${sourceSerif.variable} antialiased`}
    >
      <body className="min-h-screen bg-[#E9ECE8] text-[#15201A] flex flex-col font-sans">
        <ElectionProvider>
          <div className="flex-1 flex flex-col">{children}</div>
          <PwaRegister />
        </ElectionProvider>
      </body>
    </html>
  );
}
