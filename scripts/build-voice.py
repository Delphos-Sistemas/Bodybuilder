"""Gera as falas do timer guiado com voz neural (Kokoro-82M, Apache-2.0) em public/voz/.

Uso (uma vez, quando mudar src/data/voice-lines.json):
  pip install kokoro-onnx soundfile
  python scripts/build-voice.py MODELO.onnx PASTA_VOZES
MODELO: kokoro-quantized.onnx (Kokoro-82M v1.0). PASTA_VOZES: arquivos pf_dora.bin, pm_alex.bin, pm_santa.bin.
Precisa do ffmpeg para converter em MP3.
"""

import json
import pathlib
import subprocess
import sys
import tempfile

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = pathlib.Path(__file__).resolve().parent.parent
PACKS = {"dora": "pf_dora", "alex": "pm_alex", "santa": "pm_santa"}
SPEED = {"dora": 1.05, "alex": 1.05, "santa": 1.0}

model, voices_dir = sys.argv[1], pathlib.Path(sys.argv[2])
lines = json.loads((ROOT / "src/data/voice-lines.json").read_text("utf-8"))
with tempfile.TemporaryDirectory() as tmp:
    npz = pathlib.Path(tmp) / "voices.npz"
    np.savez(npz, **{v: np.fromfile(voices_dir / f"{v}.bin", dtype=np.float32).reshape(-1, 1, 256) for v in PACKS.values()})
    k = Kokoro(model, str(npz))
    for pack, voice in PACKS.items():
        for style, events in lines.items():
            out = ROOT / "public/voz" / pack / style
            out.mkdir(parents=True, exist_ok=True)
            for event, texts in events.items():
                for i, text in enumerate(texts):
                    samples, sr = k.create(text, voice=voice, speed=SPEED[pack], lang="pt-br")
                    wav = pathlib.Path(tmp) / "a.wav"
                    sf.write(wav, samples, sr)
                    dest = out / f"{event}-{i}.mp3"
                    # volume normalizado e MP3 mono leve (toca em iPhone e Android)
                    subprocess.run(
                        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-af", "loudnorm=I=-14:TP=-1", "-ac", "1", "-ar", "44100", "-b:a", "64k", "-map_metadata", "-1", str(dest)],
                        check=True,
                    )
                    print(dest.relative_to(ROOT), text)
