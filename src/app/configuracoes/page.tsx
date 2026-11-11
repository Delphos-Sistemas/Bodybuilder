"use client";

import { Download, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { AudioControls } from "@/components/AudioControls";
import { MusicPlayer } from "@/components/MusicPlayer";
import { Card, PageHeader } from "@/components/ui";
import { EXERCISES } from "@/data/exercises";
import { getMedia } from "@/data/media";
import { useStore } from "@/lib/store";

export default function ConfiguracoesPage() {
  const mode = useStore((s) => s.mode);
  const enterDemo = useStore((s) => s.enterDemo);
  const exitDemo = useStore((s) => s.exitDemo);
  const exportData = useStore((s) => s.exportData);
  const importData = useStore((s) => s.importData);
  const clearUserData = useStore((s) => s.clearUserData);
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const download = () => {
    const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bodybuilder-dados-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMsg({ ok: true, text: "Arquivo de backup gerado com os seus dados (sem os dados de demonstração)." });
  };

  const onImport = async (f: File | undefined) => {
    if (!f) return;
    try {
      const res = importData(JSON.parse(await f.text()));
      setMsg(res.ok ? { ok: true, text: "Dados importados com sucesso." } : { ok: false, text: res.error });
    } catch {
      setMsg({ ok: false, text: "Não foi possível ler o arquivo. Use um backup exportado pelo BODYBUILDER." });
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader eyebrow="Preferências" title="Configurações" />

      <Card className="space-y-3">
        <h2 className="font-display text-xl font-bold">Som e vibração</h2>
        <p className="text-sm text-muted">Os alertas tocam no início do treino, no fim de cada descanso e no encerramento. O treino funciona normalmente mesmo sem som.</p>
        <AudioControls />
      </Card>

      <Card className="space-y-3">
        <h2 className="font-display text-xl font-bold">Música</h2>
        <MusicPlayer />
      </Card>

      <Card className="space-y-3">
        <h2 className="font-display text-xl font-bold">Seus dados</h2>
        <p className="text-sm text-muted">Tudo fica salvo apenas neste aparelho (armazenamento local do navegador). Faça backups para não perder seus treinos ao limpar o navegador ou trocar de aparelho.</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary" onClick={download}>
            <Download size={18} aria-hidden /> Exportar dados
          </button>
          <button type="button" className="btn-secondary" onClick={() => fileRef.current?.click()}>
            <Upload size={18} aria-hidden /> Importar dados
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" aria-label="Escolher arquivo de backup" onChange={(e) => void onImport(e.target.files?.[0]).then(() => (e.target.value = ""))} />
        </div>
        <p className="text-xs text-muted">Importar substitui os dados atuais deste aparelho pelos do arquivo.</p>
        {msg && (
          <p role="status" className={msg.ok ? "text-sm text-ok" : "text-sm text-danger"}>
            {msg.text}
          </p>
        )}
        {confirmClear ? (
          <div role="alert" className="rounded-xl border border-danger/50 p-3 text-sm">
            <p className="mb-2">Apagar todos os seus treinos, histórico, pesos e perfil deste aparelho? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-danger min-h-10 flex-1"
                onClick={() => {
                  clearUserData();
                  setConfirmClear(false);
                  setMsg({ ok: true, text: "Dados apagados." });
                }}
              >
                Apagar tudo
              </button>
              <button type="button" className="btn-ghost min-h-10 flex-1" onClick={() => setConfirmClear(false)}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="btn-danger" onClick={() => setConfirmClear(true)}>
            Apagar meus dados
          </button>
        )}
      </Card>

      <Card className="space-y-3">
        <h2 className="font-display text-xl font-bold">Modo demonstração</h2>
        <p className="text-sm text-muted">Explore o app com treinos e histórico de exemplo, sem cadastro. Os dados de exemplo ficam separados dos seus.</p>
        {mode === "demo" ? (
          <button type="button" className="btn-secondary" onClick={exitDemo}>
            Sair da demonstração
          </button>
        ) : (
          <button type="button" className="btn-secondary" onClick={enterDemo}>
            Entrar na demonstração
          </button>
        )}
      </Card>

      <Card className="space-y-2">
        <h2 className="font-display text-xl font-bold">Uso sem internet</h2>
        <p className="text-sm text-sand">Depois da primeira visita, o app pode ser instalado na tela inicial e abre sem internet: telas, treinos, treino ativo, histórico, gráficos e imagens dos exercícios.</p>
        <p className="text-sm text-muted">Os vídeos das demonstrações são baixados quando você toca em reproduzir; os que já foram vistos ficam disponíveis offline. Músicas adicionadas do aparelho ficam salvas neste navegador.</p>
      </Card>

      <Card className="space-y-2">
        <h2 className="font-display text-xl font-bold">Créditos de mídia</h2>
        <p className="text-sm text-muted">
          Ilustrações dos exercícios: Everkinetic (everkinetic.com), licença CC BY-SA 4.0, adaptadas (recorte, cores e vídeo curto). As adaptações seguem a mesma licença.
        </p>
        <details>
          <summary className="cursor-pointer text-sm text-sand">Fonte por exercício ({EXERCISES.length})</summary>
          <ul className="mt-2 space-y-1 text-xs text-muted">
            {EXERCISES.map((e) => {
              const m = getMedia(e.id);
              return (
                <li key={e.id}>
                  <span className="text-sand">{e.name}</span>: {m ? `${m.credit.author}, ${m.credit.license}, arquivos ${m.credit.originalFiles.join(", ")}` : "sem mídia"}
                </li>
              );
            })}
          </ul>
        </details>
      </Card>
    </div>
  );
}
