// Gera src/data/voice-exercises.json (id → texto falado) para scripts/build-voice.py.
import { writeFileSync } from "node:fs";
import { EXERCISES } from "../src/data/exercises";
import { exerciseAnnouncement } from "../src/lib/voiceLines";

const out = Object.fromEntries(EXERCISES.filter((e) => !e.custom).map((e) => [e.id, exerciseAnnouncement(e)]));
writeFileSync("src/data/voice-exercises.json", JSON.stringify(out, null, 2) + "\n");
console.log(Object.keys(out).length, "exercícios");
