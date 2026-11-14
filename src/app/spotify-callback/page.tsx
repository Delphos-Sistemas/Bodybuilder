"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { finishLogin } from "@/lib/spotifyAuth";

/** Volta do login do Spotify: troca o código pelo token e retorna às configurações. */
export default function SpotifyCallbackPage() {
  const [error, setError] = useState("");

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const code = q.get("code");
    if (!code) {
      setError(q.get("error") === "access_denied" ? "Você cancelou o login no Spotify." : "Resposta do Spotify sem código de acesso.");
      return;
    }
    finishLogin(code)
      .then(() => location.replace("/configuracoes?spotify=ok"))
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <div className="mx-auto max-w-md space-y-4 py-10 text-center">
      {error ? (
        <>
          <p role="alert" className="text-danger">
            {error}
          </p>
          <Link href="/configuracoes" className="btn-secondary">
            Voltar às configurações
          </Link>
        </>
      ) : (
        <p className="text-sand">Conectando ao Spotify…</p>
      )}
    </div>
  );
}
