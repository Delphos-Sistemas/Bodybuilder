"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/Card";
import { useAppStore } from "@/stores/appStore";

export default function EvolucaoPage() {
  const { weightLogs, sessions } = useAppStore();
  const weights = [...weightLogs].reverse().slice(-14).map((item) => ({
    dia: new Date(item.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    peso: item.weightKg
  }));
  const volume = [...sessions].reverse().filter((item) => item.finishedAt).slice(-12).map((item, index) => ({
    treino: `T${index + 1}`,
    volume: item.totalVolume
  }));

  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm uppercase text-bronze-light">Evolução</p>
        <h1 className="font-display text-4xl font-black">Capacidade em construção</h1>
      </header>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-bold">Peso corporal</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weights}>
                <CartesianGrid stroke="#2b2b2b" />
                <XAxis dataKey="dia" stroke="#D5C2A5" />
                <YAxis stroke="#D5C2A5" domain={["dataMin - 1", "dataMax + 1"]} />
                <Tooltip contentStyle={{ background: "#171717", border: "1px solid #A9783F" }} />
                <Area dataKey="peso" stroke="#C89B62" fill="#A9783F33" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="mb-4 font-bold">Volume por treino</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volume}>
                <CartesianGrid stroke="#2b2b2b" />
                <XAxis dataKey="treino" stroke="#D5C2A5" />
                <YAxis stroke="#D5C2A5" />
                <Tooltip contentStyle={{ background: "#171717", border: "1px solid #A9783F" }} />
                <Bar dataKey="volume" fill="#A9783F" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Treinos concluídos" value={`${sessions.filter((item) => item.finishedAt).length}`} />
        <Stat label="Duração média" value="58 min" />
        <Stat label="Recordes" value="5" />
        <Stat label="Constancia mensal" value="82%" />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-sm text-sand">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </Card>
  );
}
