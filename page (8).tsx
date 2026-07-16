import { Card } from "@/components/ui/Card";

export default function AdminPage() {
  const items = ["Exercicios", "Modelos de treino", "Mensagens do mascote", "Conquistas", "Usuarios", "Metricas de uso"];
  return (
    <div className="space-y-5">
      <h1 className="font-display text-4xl font-black">Admin</h1>
      <p className="text-sand">Rota administrativa protegida no roadmap. No modo demonstração, os dados são mockados.</p>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <Card key={item}>
            <h2 className="font-bold">{item}</h2>
            <p className="mt-2 text-sm text-sand">Estrutura preparada para gestão futura.</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
