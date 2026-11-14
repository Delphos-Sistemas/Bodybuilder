"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Dumbbell, Home, Library, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHydratedStore } from "@/hooks/useHydratedStore";

const nav = [
  { href: "/inicio", label: "Início", icon: Home },
  { href: "/treinos", label: "Treino", icon: Dumbbell },
  { href: "/evolucao", label: "Evolução", icon: BarChart3 },
  { href: "/biblioteca", label: "Biblioteca", icon: Library },
  { href: "/perfil", label: "Perfil", icon: User }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hydrated = useHydratedStore();
  const activeWorkout = pathname.startsWith("/treino-ativo");
  const publicPage = pathname === "/" || pathname === "/entrar" || pathname === "/cadastro";

  if (publicPage || activeWorkout) return <>{children}</>;

  return (
    <div className="min-h-screen bg-iron text-parchment">
      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-white/10 bg-graphite/90 p-5 lg:block">
        <Link href="/inicio" className="flex items-center gap-3">
          <Image src="/brand/logo.svg" alt="Logo BODYBUILDER" width={44} height={44} className="rounded-lg" priority />
          <span>
            <strong className="block font-display text-2xl">BODYBUILDER</strong>
            <small className="text-sand">Construa mais que músculos.</small>
          </span>
        </Link>
        <nav className="mt-8 space-y-2">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn("flex min-h-11 items-center gap-3 rounded-lg px-3 text-sand", active && "bg-bronze text-iron")}
              >
                <Icon size={19} /> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-5 left-5 right-5 rounded-lg border border-white/10 bg-iron p-3 text-sm text-sand">
          {hydrated ? "Modo demonstração ativo" : "Carregando dados locais"}
        </div>
      </aside>
      <main className="mx-auto min-h-screen max-w-6xl px-4 pb-24 pt-5 lg:ml-64 lg:px-8">
        {children}
        <footer className="mt-10 border-t border-white/10 pt-5 text-center text-sm text-sand">
          Desenvolvido por Delphos Sistemas
        </footer>
      </main>
      <nav className="fixed bottom-0 left-0 right-0 z-20 grid grid-cols-5 border-t border-white/10 bg-graphite/95 lg:hidden">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={cn("grid min-h-16 place-items-center text-xs text-sand", active && "text-bronze-light")}>
              <Icon size={21} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
