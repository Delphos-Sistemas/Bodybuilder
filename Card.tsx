import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export default function EntrarPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-iron p-5 text-parchment">
      <Card className="w-full max-w-md space-y-4">
        <h1 className="font-display text-4xl font-black">Entrar</h1>
        <Input placeholder="email@exemplo.com" />
        <Input placeholder="senha" type="password" />
        <Link href="/inicio"><Button className="w-full">Entrar no modo demonstração</Button></Link>
      </Card>
    </main>
  );
}
