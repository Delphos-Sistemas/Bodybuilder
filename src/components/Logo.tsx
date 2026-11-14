/** Logo do app (bode musculoso no esquadro e compasso), com fundo transparente. */
export function Monogram({ size = 36 }: { size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element -- export estático, sem otimizador de imagem
  return <img src="/brand/logo-192.png" width={size} height={size} alt="" aria-hidden="true" className="shrink-0" />;
}

export function Signature({ className = "" }: { className?: string }) {
  return <p className={`text-xs text-muted ${className}`}>Desenvolvido por Delphos Sistemas</p>;
}
