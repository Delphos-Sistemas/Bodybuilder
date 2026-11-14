import Link from "next/link";
import { ArrowRight, BarChart3, Dumbbell, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { MascotMessage } from "@/components/mascot/MascotMessage";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-iron text-parchment">
      <section className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-5 py-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-lg border border-bronze/40 px-3 py-2 text-sm text-sand">
            <ShieldCheck size={16} /> MVP instalavel em modo demonstracao
          </div>
          <h1 className="font-display text-5xl font-black leading-none text-parchment md:text-7xl">Construa mais que musculos.</h1>
          <p className="mt-5 max-w-2xl text-lg text-sand">
            Planeje seus treinos, acompanhe sua evolucao e transforme constancia em legado.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/inicio" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-bronze px-4 py-2 text-sm font-bold text-iron transition hover:bg-bronze-light">
              Comecar agora <ArrowRight size={18} />
            </Link>
            <Link href="/treinos" className="inline-flex min-h-11 items-center rounded-lg border border-bronze/40 px-4 font-bold text-sand">
              Ver demonstracao
            </Link>
          </div>
        </div>
        <div className="space-y-4">
          <MascotMessage
            variant="focus"
            title="BB"
            size="lg"
            message="Voce nao precisa estar motivado. Precisa comecar."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Treino guiado", "Registre cargas, repeticoes, RIR e descanso."],
              ["Evolucao clara", "Peso, volume, frequencia e recordes em graficos."],
              ["Recuperacao", "Adapte a semana conforme fadiga e dores."],
              ["Offline primeiro", "Funciona sem Supabase no modo demonstracao."]
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
            <p className="font-bold">Versao inicial</p>
            <p className="mt-2 text-sm text-sand">
              Focada no fluxo essencial: inicio, treino do dia, series, resumo e evolucao.
            </p>
          </Card>
        </div>
      </section>
    </main>
  );
}
