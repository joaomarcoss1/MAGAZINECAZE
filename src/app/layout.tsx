import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { DemoBanner } from "@/components/layout/demo-banner";
import { store } from "@/lib/config";

export const metadata: Metadata = {
  metadataBase: new URL(store.url),
  title: { default: `${store.name} — ${store.tagline}`, template: `%s | ${store.name}` },
  description: store.description,
  openGraph: { siteName: store.name, locale: "pt_BR", type: "website" },
};

export const viewport: Viewport = { themeColor: "#0f4772" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="flex min-h-dvh flex-col">
        <DemoBanner />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
