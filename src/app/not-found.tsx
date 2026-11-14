import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <p className="eyebrow">Página não encontrada</p>
      <h1 className="h1 mt-1">Esta tela não existe</h1>
      <Link href="/" className="btn-primary mt-6">
        Voltar ao início
      </Link>
    </div>
  );
}
