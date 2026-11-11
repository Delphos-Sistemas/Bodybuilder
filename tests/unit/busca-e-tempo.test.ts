import { matchesSearch, normalize } from "@/lib/text";
import { formatClock, formatDuration, restRemaining, startOfWeek, workoutElapsed } from "@/lib/time";

describe("busca sem acentos", () => {
  it("normaliza acentos e caixa", () => {
    expect(normalize("Tríceps Francês")).toBe("triceps frances");
  });
  it("encontra com ou sem acento e com vários termos", () => {
    expect(matchesSearch(["Elevação lateral com halteres", "Ombros"], "elevacao")).toBe(true);
    expect(matchesSearch(["Tríceps na polia"], "TRICEPS polia")).toBe(true);
    expect(matchesSearch(["Abdômen"], "abdomen")).toBe(true);
    expect(matchesSearch(["Supino reto"], "agachamento")).toBe(false);
  });
});

describe("tempos baseados em horários registrados", () => {
  it("formata relógio", () => {
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(75)).toBe("01:15");
    expect(formatClock(3725)).toBe("1:02:05");
  });
  it("calcula descanso restante pelo horário de término, mesmo após tempo em segundo plano", () => {
    const rest = { startedAt: 0, endsAt: 90_000 };
    expect(restRemaining(rest, 0)).toBe(90);
    expect(restRemaining(rest, 60_500)).toBe(30);
    expect(restRemaining(rest, 500_000)).toBe(0);
    expect(restRemaining(null, 0)).toBe(0);
  });
  it("duração real do treino usa início e fim", () => {
    expect(workoutElapsed({ startedAt: 1000, endedAt: 1000 + 45 * 60_000 }, 0)).toBe(2700);
    expect(workoutElapsed({ startedAt: 1000 }, 61_000)).toBe(60);
  });
  it("formata duração em minutos", () => {
    expect(formatDuration(30)).toBe("menos de 1 min");
    expect(formatDuration(45 * 60)).toBe("45 min");
    expect(formatDuration(90 * 60)).toBe("1 h 30 min");
  });
  it("semana começa na segunda-feira", () => {
    const wed = new Date(2026, 10, 11, 15).getTime();
    expect(new Date(startOfWeek(wed)).getDay()).toBe(1);
  });
});
