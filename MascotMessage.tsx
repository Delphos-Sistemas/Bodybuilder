"use client";

import { Card } from "@/components/ui/Card";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAppStore } from "@/stores/appStore";

export default function ConfiguracoesPage() {
  const { profile } = useAppStore();
  return (
    <div className="space-y-5">
      <h1 className="font-display text-4xl font-black">Configurações</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {[
          ["Tema", "Escuro premium como padrão"],
          ["Unidade de peso", "Quilogramas"],
          ["Notificacoes", "Estrutura preparada para lembretes locais"],
          ["Vibração", "Ativa quando o navegador permitir"],
          ["Descanso padrão", "90 segundos"],
          ["Modo demonstração", profile.demoMode ? "Ativo" : "Inativo"],
          ["Supabase", isSupabaseConfigured ? "Configurado" : "Não configurado"],
          ["Privacidade", "Dados locais no navegador neste MVP"]
        ].map(([title, text]) => (
          <Card key={title}>
            <h2 className="font-bold">{title}</h2>
            <p className="mt-2 text-sm text-sand">{text}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
