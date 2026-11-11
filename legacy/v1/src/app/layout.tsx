import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { RegisterServiceWorker } from "./register-sw";

export const metadata: Metadata = {
  title: "BODYBUILDER",
  description: "Planeje seus treinos, acompanhe sua evolucao e transforme constancia em legado.",
  manifest: "/manifest.webmanifest"
};

export const viewport: Viewport = {
  themeColor: "#090909",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <RegisterServiceWorker />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
