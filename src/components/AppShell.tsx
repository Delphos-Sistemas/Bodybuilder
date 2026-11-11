"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BookOpen, ChartLine, Dumbbell, History, House, Settings, User, Play } from "lucide-react";
import { Monogram, Signature } from "./Logo";
import { useData, useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { UpdateBanner } from "./UpdateBanner";
import { AudioUnlocker } from "./AudioUnlocker";

const NAV = [
  { href: "/", label: "Início", icon: House },
  { href: "/treinos", label: "Treinos", icon: Dumbbell },
  { href: "/biblioteca", label: "Biblioteca", icon: BookOpen },
  { href: "/evolucao", label: "Evolução", icon: ChartLine },
  { href: "/perfil", label: "Perfil", icon: User }
];

function isActive(pathname: string, href: string) {
  const p = pathname.replace(/\/$/, "") || "/";
  return href === "/" ? p === "/" : p === href || p.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const hydrated = useHydrated();

  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-iron/90 backdrop-blur">
        <div className="flex h-16 items-center gap-3 px-4">
          <Link href="/" className="flex items-center gap-2.5" aria-label="BODYBUILDER, ir para o início">
            <Monogram size={36} />
            <span className="font-display text-lg font-bold tracking-wide">BODYBUILDER</span>
          </Link>
          {hydrated && <DemoBadge />}
          <nav aria-label="Navegação principal" className="ml-6 hidden gap-1 lg:flex">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                aria-current={isActive(pathname, n.href) ? "page" : undefined}
                className={clsx(
                  "rounded-lg px-3 py-2 text-sm font-medium",
                  isActive(pathname, n.href) ? "bg-steel text-bronze-light" : "text-sand hover:text-parchment"
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <Link href="/historico" className={clsx("btn-ghost min-h-11 px-3", isActive(pathname, "/historico") && "text-bronze-light")} aria-label="Histórico">
              <History size={20} aria-hidden />
              <span className="hidden sm:inline">Histórico</span>
            </Link>
            <Link
              href="/configuracoes"
              className={clsx("btn-ghost min-h-11 px-3", isActive(pathname, "/configuracoes") && "text-bronze-light")}
              aria-label="Configurações"
            >
              <Settings size={20} aria-hidden />
              <span className="hidden sm:inline">Configurações</span>
            </Link>
          </div>
        </div>
      </header>

      <UpdateBanner />
      {hydrated && <AudioUnlocker />}

      <main className="flex-1 px-4 pb-40 pt-5 lg:pb-16">{hydrated ? children : <p className="py-16 text-center text-muted">Carregando seus dados…</p>}</main>

      <footer className="hidden px-4 pb-6 text-center lg:block">
        <Signature />
      </footer>

      {hydrated && !isActive(pathname, "/treino-ativo") && <ActiveSessionBar />}

      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-iron/95 backdrop-blur lg:hidden"
        style={{ paddingBottom: "var(--safe-bottom)" }}
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {NAV.map((n) => {
            const active = isActive(pathname, n.href);
            const Icon = n.icon;
            return (
              <li key={n.href}>
                <Link
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    "flex h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                    active ? "text-bronze-light" : "text-muted"
                  )}
                >
                  <Icon size={22} aria-hidden />
                  {n.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <Signature className="pb-1 text-center text-[10px]" />
      </nav>
    </div>
  );
}

function DemoBadge() {
  const mode = useStore((s) => s.mode);
  const exitDemo = useStore((s) => s.exitDemo);
  if (mode !== "demo") return null;
  return (
    <button
      type="button"
      onClick={exitDemo}
      className="rounded-full border border-bronze/60 bg-bronze/10 px-2.5 py-1 text-xs font-semibold text-bronze-light"
      title="Sair do modo demonstração"
    >
      Demonstração · sair
    </button>
  );
}

function ActiveSessionBar() {
  const active = useData().activeSession;
  if (!active) return null;
  return (
    <div className="fixed inset-x-0 bottom-[84px] z-20 px-3 lg:bottom-4">
      <Link
        href="/treino-ativo"
        className="mx-auto flex max-w-lg items-center justify-between gap-3 rounded-2xl border border-bronze/60 bg-steel px-4 py-3 shadow-lg"
      >
        <span className="min-w-0">
          <span className="block text-xs text-bronze-light">Treino em andamento</span>
          <span className="block truncate font-semibold">{active.workoutName}</span>
        </span>
        <span className="btn-primary min-h-10 px-3 text-sm">
          <Play size={16} aria-hidden /> Retomar
        </span>
      </Link>
    </div>
  );
}
