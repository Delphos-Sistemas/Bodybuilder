export function Monogram({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="14" fill="#171513" />
      <rect x="3.5" y="3.5" width="57" height="57" rx="11" fill="none" stroke="#B07D45" strokeWidth="3" />
      <text x="32" y="42" textAnchor="middle" fontFamily="Impact, 'Arial Narrow', sans-serif" fontSize="27" fontWeight="700" fill="#D3A46B" letterSpacing="1">
        BB
      </text>
    </svg>
  );
}

export function Signature({ className = "" }: { className?: string }) {
  return <p className={`text-xs text-muted ${className}`}>Desenvolvido por Delphos Sistemas</p>;
}
