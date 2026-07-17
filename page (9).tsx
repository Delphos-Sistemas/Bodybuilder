import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BarChart3, Dumbbell, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { MascotMessage } from "@/components/mascot/MascotMessage";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-iron text-parchment">
      <section className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-5 py-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <Image src="/brand/logo-horizontal.svg" alt="Logo BODYBUILDER" width={420} height={120} className="mb-6 h-auto w-64 sm:w-80" priority />
          <div className="mb-6 inline-flex items-center gap-2 rounded-lg border border-bronze/40 px-3 py-2 text-sm text-sand">
            <ShieldCheck size={16} /> MVP instalável em modo demonstração
          </div>
          <h1 className="font-display text-5xl font-black leading-none text-parchment md:text-7xl">Construa mais que músculos.</h1>
          <p className="mt-5 max-w-2xl text-lg text-sand">
            Planeje seus treinos, acompanhe sua evolução e transforme constância em legado.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/inicio" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-bronze px-4 py-2 text-sm font-bold text-iron transition hover:bg-bronze-light">
              Começar agora <ArrowRight size={18} />
            </Link>
            <Link href="/treinos" className="inline-flex min-h-11 items-center rounded-lg border border-bronze/40 px-4 font-bold text-sand">
              Ver demonstração
            </Link>
          </div>
        </div>
        <div className="space-y-4">
          <MascotMessage
            variant="focus"
            title="BB"
            size="lg"
            message="Você não precisa estar motivado. Precisa começar."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Treino guiado", "Registre cargas, repetições, RIR e descanso."],
              ["Evolução clara", "Peso, volume, frequência e recordes em gráficos."],
              ["Recuperação", "Adapte a semana conforme fadiga e dores."],
              ["Offline primeiro", "Funciona sem Supabase no modo demonstração."]
            ].map(([title, text]) => (
              <Card key={title}>
                <Dumbbell className="mb-3 text-bronze-light" />
                <h2 className="font-bold">{title}</h2>
                <p className="mt-2 text-sm text-sand">{text}</p>
              </Card>
            ))}
          </div>
          <Card>
            <BarChart3 className="mb-3 text-bronze-light" />
            <p className="font-bold">Versão inicial</p>
            <p className="mt-2 text-sm text-sand">
              Focada no fluxo essencial: início, treino do dia, séries, resumo e evolução.
            </p>
          </Card>
        </div>
        <footer className="lg:col-span-2 border-t border-white/10 pt-5 text-center text-sm text-sand">
          Desenvolvido por Delphos Sistemas
        </footer>
      </section>
    </main>
  );
}
