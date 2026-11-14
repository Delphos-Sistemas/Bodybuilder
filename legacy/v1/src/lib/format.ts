const labelMap: Record<string, string> = {
  Biceps: "Bíceps",
  Triceps: "Tríceps",
  Quadriceps: "Quadríceps",
  Gluteos: "Glúteos",
  Abdomen: "Abdômen",
  Antebraco: "Antebraço",
  Trapezio: "Trapézio",
  Maquina: "Máquina",
  Eliptico: "Elíptico",
  Avancado: "Avançado",
  Intermediario: "Intermediário"
};

export function ptLabel(value: string) {
  return labelMap[value] ?? value;
}
