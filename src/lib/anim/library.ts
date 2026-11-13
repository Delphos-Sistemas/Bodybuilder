import type { AnimSpec, Prop } from "./render";
import type { Pose } from "./rig";

/**
 * Animações próprias de cada exercício (boneco em vista lateral ou de frente).
 * keys[0] = posição inicial; as seguintes são percorridas em ciclo e voltam à primeira.
 * dur = tempo (s) para chegar nesta posição; hold = pausa nela.
 */

const STAND: Pose = { torso: -90, thN: 90, shN: 90, thF: 92, shF: 90, ftN: 0 };
const st = (p: Partial<Pose>): Pose => ({ ...STAND, ...p });

/** banco reto com o tampo em y, de x0 a x1 */
const flatBench = (x0: number, x1: number, y: number, floor: number): Prop[] => [
  {
    k: "frame",
    pts: [
      [x0 + 8, y + 4],
      [x0 + 8, floor]
    ]
  },
  {
    k: "frame",
    pts: [
      [x1 - 8, y + 4],
      [x1 - 8, floor]
    ]
  },
  {
    k: "frame",
    pts: [
      [x0 - 2, floor],
      [x0 + 18, floor]
    ]
  },
  {
    k: "frame",
    pts: [
      [x1 - 18, floor],
      [x1 + 2, floor]
    ]
  },
  { k: "pad", a: [x0, y], b: [x1, y], w: 8 }
];

/** banco de frente (visto pela ponta) */
const benchEnd = (cx: number, y: number, floor: number, w = 46): Prop[] => [
  {
    k: "frame",
    pts: [
      [cx, y + 4],
      [cx, floor]
    ],
    w: 4
  },
  {
    k: "frame",
    pts: [
      [cx - 16, floor],
      [cx + 16, floor]
    ]
  },
  { k: "pad", a: [cx - w / 2, y], b: [cx + w / 2, y], w: 10 }
];

/** encosto + assento vistos de frente */
const seatFront = (cx: number, seatY: number, floor: number, back = true): Prop[] => [
  ...(back ? ([{ k: "pad", a: [cx, seatY - 78], b: [cx, seatY - 8], w: 40 }] as Prop[]) : []),
  {
    k: "frame",
    pts: [
      [cx, seatY + 4],
      [cx, floor]
    ],
    w: 4
  },
  {
    k: "frame",
    pts: [
      [cx - 18, floor],
      [cx + 18, floor]
    ]
  },
  { k: "pad", a: [cx - 26, seatY], b: [cx + 26, seatY], w: 10 }
];

const SUPINE_LEGS = { thN: 14, shN: 98, ftN: -8, thF: 20, shF: 92, ftF: -8 };

const LEG_PRESS: Prop[] = [
  {
    k: "frame",
    pts: [
      [150, 162],
      [250, 62]
    ],
    w: 4
  },
  {
    k: "frame",
    pts: [
      [100, 190],
      [100, 222]
    ],
    w: 4
  },
  {
    k: "frame",
    pts: [
      [240, 72],
      [240, 222]
    ],
    w: 4
  },
  {
    k: "frame",
    pts: [
      [80, 222],
      [266, 222]
    ]
  },
  { k: "pad", a: [92, 184], b: [134, 184], w: 8 },
  { k: "pad", a: [98, 178], b: [66, 134], w: 9 }
];

const LAT_MACHINE: Prop[] = [
  {
    k: "frame",
    pts: [
      [118, 222],
      [118, 18],
      [175, 18]
    ]
  },
  {
    k: "frame",
    pts: [
      [150, 176],
      [150, 222]
    ]
  },
  {
    k: "frame",
    pts: [
      [130, 222],
      [170, 222]
    ]
  }
];

export const ANIMS: Record<string, AnimSpec> = {
  // ───────────── Peito ─────────────
  "supino-reto": {
    anchor: "hip",
    at: [178, 150],
    floor: 206,
    back: [{ k: "plate", at: "handN", r: 22 }, ...flatBench(92, 206, 160, 206)],
    keys: [
      { pose: { torso: 180, head: 182, ...SUPINE_LEGS, ik: { hN: [131, 96] } }, dur: 0.9 },
      { pose: { torso: 180, head: 182, ...SUPINE_LEGS, ik: { hN: [140, 133] } }, dur: 1.4 }
    ]
  },
  "supino-inclinado-halteres": {
    anchor: "hip",
    at: [175, 165],
    floor: 218,
    back: [
      {
        k: "frame",
        pts: [
          [175, 186],
          [175, 218]
        ]
      },
      {
        k: "frame",
        pts: [
          [120, 142],
          [120, 218]
        ]
      },
      {
        k: "frame",
        pts: [
          [160, 218],
          [190, 218]
        ]
      },
      {
        k: "frame",
        pts: [
          [108, 218],
          [132, 218]
        ]
      },
      { k: "pad", a: [167, 176], b: [110, 136], w: 8 },
      { k: "pad", a: [150, 182], b: [196, 182], w: 8 }
    ],
    front: [{ k: "dumbbell", at: "handN" }],
    keys: [
      { pose: { torso: -145, head: -140, thN: 12, shN: 100, ftN: -10, thF: 18, shF: 96, ik: { hN: [138, 82] } }, dur: 0.9 },
      { pose: { torso: -145, head: -140, thN: 12, shN: 100, ftN: -10, thF: 18, shF: 96, ik: { hN: [143, 120] } }, dur: 1.4 }
    ]
  },
  "supino-reto-halteres": {
    anchor: "hip",
    at: [178, 150],
    floor: 206,
    back: flatBench(92, 206, 160, 206),
    front: [{ k: "dumbbell", at: "handN" }],
    keys: [
      { pose: { torso: 180, head: 182, ...SUPINE_LEGS, ik: { hN: [131, 96] } }, dur: 0.9 },
      { pose: { torso: 180, head: 182, ...SUPINE_LEGS, ik: { hN: [137, 134] } }, dur: 1.4 }
    ]
  },
  "crucifixo-halteres": {
    anchor: "hip",
    at: [160, 150],
    view: "front",
    torsoScale: 0.2,
    hideLegs: true,
    floor: 218,
    back: benchEnd(160, 160, 218),
    front: [
      { k: "dumbbell", at: "handN" },
      { k: "dumbbell", at: "handF" }
    ],
    keys: [
      { pose: { torso: -90, uaN: -84, faN: -92 }, dur: 1.0 },
      { pose: { torso: -90, uaN: -6, faN: -24 }, dur: 1.5 }
    ]
  },
  crossover: {
    anchor: "hip",
    at: [160, 132],
    view: "front",
    back: [
      {
        k: "frame",
        pts: [
          [270, 22],
          [270, 222]
        ],
        w: 4
      },
      {
        k: "frame",
        pts: [
          [50, 22],
          [50, 222]
        ],
        w: 4
      }
    ],
    front: [
      { k: "cable", from: [266, 30], to: "handN", grip: "handle" },
      { k: "cable", from: [54, 30], to: "handF", grip: "handle" }
    ],
    keys: [
      { pose: { torso: -90, thN: 84, shN: 88, ik: { hN: [212, 70], hF: [108, 70] } }, dur: 1.3 },
      { pose: { torso: -90, thN: 84, shN: 88, ik: { hN: [156, 124], hF: [164, 124] } }, dur: 1.0 }
    ]
  },
  voador: {
    anchor: "hip",
    at: [160, 160],
    view: "front",
    hideLegs: true,
    back: seatFront(160, 172, 222),
    front: [
      { k: "roller", at: "elbowN", r: 6 },
      { k: "roller", at: "elbowF", r: 6 }
    ],
    keys: [
      { pose: { torso: -90, uaN: 2, faN: -90, yawN: 0 }, dur: 1.3 },
      { pose: { torso: -90, uaN: 2, faN: -90, yawN: 118 }, dur: 1.0 }
    ]
  },
  paralelas: {
    anchor: "wristN",
    at: [176, 120],
    back: [
      {
        k: "frame",
        pts: [
          [130, 124],
          [214, 124]
        ],
        w: 4
      },
      {
        k: "frame",
        pts: [
          [208, 124],
          [208, 222]
        ]
      },
      {
        k: "frame",
        pts: [
          [100, 222],
          [220, 222]
        ]
      }
    ],
    front: [{ k: "platform", at: "kneeN", angle: 180, len: 30 }],
    keys: [
      { pose: { torso: -86, head: -88, uaN: 92, faN: 88, thN: 100, shN: 172, ftN: 100 }, dur: 1.2 },
      { pose: { torso: -70, head: -78, uaN: 165, faN: 62, thN: 104, shN: 176, ftN: 100 }, dur: 1.5 }
    ]
  },
  "flexao-de-braco": {
    anchor: "toeN",
    at: [70, 218],
    keys: [
      { pose: { torso: -21, head: -17, thN: 159, shN: 159, ftN: 74, ik: { hN: [194, 209] } }, dur: 1.0 },
      { pose: { torso: -6, head: -4, thN: 174, shN: 174, ftN: 84, ik: { hN: [194, 209] } }, dur: 1.4 }
    ]
  },

  // ───────────── Costas ─────────────
  "remada-curvada": {
    anchor: "ankleN",
    at: [150, 218],
    back: [{ k: "plate", at: "handN", r: 21 }],
    keys: [
      { pose: { torso: -22, head: -10, thN: 72, shN: 100, thF: 74, shF: 100, uaN: 92, faN: 90 }, dur: 1.3 },
      { pose: { torso: -24, head: -12, thN: 72, shN: 100, thF: 74, shF: 100, uaN: 172, faN: 88 }, dur: 0.9 }
    ]
  },
  "remada-baixa": {
    anchor: "hip",
    at: [120, 182],
    back: [
      {
        k: "frame",
        pts: [
          [244, 160],
          [244, 222]
        ],
        w: 4
      },
      {
        k: "frame",
        pts: [
          [214, 168],
          [214, 222]
        ]
      },
      {
        k: "frame",
        pts: [
          [100, 196],
          [100, 222]
        ]
      },
      {
        k: "frame",
        pts: [
          [86, 222],
          [256, 222]
        ]
      },
      { k: "pad", a: [90, 194], b: [150, 194], w: 8 },
      { k: "pad", a: [210, 172], b: [214, 210], w: 6 }
    ],
    front: [{ k: "cable", from: [240, 170], to: "handN", grip: "handle" }],
    keys: [
      { pose: { torso: -62, head: -50, ik: { hN: [214, 172], fN: [205, 196] } }, dur: 1.3 },
      { pose: { torso: -96, head: -90, ik: { hN: [148, 168], fN: [205, 196] } }, dur: 1.0 }
    ]
  },
  "puxada-frontal": {
    anchor: "hip",
    at: [150, 168],
    back: LAT_MACHINE,
    front: [
      { k: "pad", a: [134, 176], b: [168, 176], w: 8 },
      { k: "roller", at: "kneeN", dx: 2, dy: -9, r: 6.5 },
      { k: "cable", from: [175, 18], to: "handN", grip: "bar" }
    ],
    keys: [
      { pose: { torso: -98, head: -88, uaN: -78, faN: -84, thN: 2, shN: 88, ftN: 0 }, dur: 1.4 },
      { pose: { torso: -104, head: -86, uaN: 112, faN: -62, thN: 2, shN: 88, ftN: 0 }, dur: 1.0 }
    ]
  },
  "puxada-supinada": {
    anchor: "hip",
    at: [150, 168],
    back: LAT_MACHINE,
    front: [
      { k: "pad", a: [134, 176], b: [168, 176], w: 8 },
      { k: "roller", at: "kneeN", dx: 2, dy: -9, r: 6.5 },
      { k: "cable", from: [175, 18], to: "handN", grip: "bar" }
    ],
    keys: [
      { pose: { torso: -96, head: -88, uaN: -80, faN: -86, thN: 2, shN: 88, ftN: 0 }, dur: 1.4 },
      { pose: { torso: -100, head: -86, uaN: 96, faN: -70, thN: 2, shN: 88, ftN: 0 }, dur: 1.0 }
    ]
  },
  "barra-fixa": {
    anchor: "wristN",
    at: [165, 40],
    floor: null,
    back: [
      {
        k: "frame",
        pts: [
          [100, 38],
          [100, 30],
          [230, 30],
          [230, 38]
        ],
        w: 3
      }
    ],
    front: [{ k: "pullbar", at: [165, 38] }],
    keys: [
      { pose: { torso: -90, head: -90, uaN: -86, faN: -89, thN: 96, shN: 128, thF: 100, shF: 132, ftN: 60 }, dur: 1.5 },
      { pose: { torso: -96, head: -84, uaN: 66, faN: -82, thN: 100, shN: 134, thF: 104, shF: 138, ftN: 60 }, dur: 1.1 }
    ]
  },
  "remada-invertida": {
    anchor: "ankleN",
    at: [80, 212],
    back: [
      {
        k: "frame",
        pts: [
          [222, 111],
          [222, 222]
        ],
        w: 4
      },
      {
        k: "frame",
        pts: [
          [206, 222],
          [238, 222]
        ]
      }
    ],
    front: [{ k: "pullbar", at: [212, 111] }],
    keys: [
      { pose: { torso: -20, head: -18, thN: 160, shN: 160, ftN: -70, ik: { hN: [212, 113] } }, dur: 1.4 },
      { pose: { torso: -37, head: -35, thN: 143, shN: 143, ftN: -87, ik: { hN: [212, 113] } }, dur: 1.0 }
    ]
  },

  // ───────────── Posteriores / lombar ─────────────
  "levantamento-terra": {
    anchor: "ankleN",
    at: [150, 218],
    back: [{ k: "plate", at: "handN", r: 22 }],
    keys: [
      { pose: { torso: -34, head: -22, thN: 24, shN: 106, thF: 26, shF: 106, ik: { hN: [165, 197] } }, dur: 1.4 },
      { pose: st({ torso: -88, head: -90, ik: { hN: [152, 140] } }), dur: 1.2 }
    ]
  },
  "hiperextensao-lombar": {
    anchor: "ankleN",
    at: [100, 205],
    floor: 222,
    back: [
      {
        k: "frame",
        pts: [
          [160, 166],
          [150, 222]
        ],
        w: 4
      },
      {
        k: "frame",
        pts: [
          [92, 210],
          [104, 222]
        ],
        w: 4
      },
      {
        k: "frame",
        pts: [
          [86, 222],
          [176, 222]
        ]
      },
      { k: "pad", a: [176, 147], b: [160, 163], w: 10 }
    ],
    front: [{ k: "roller", at: "ankleN", dx: -5, dy: -6, r: 5.5 }],
    keys: [
      { pose: { torso: -45, head: -40, thN: 135, shN: 135, ftN: 45, uaN: 115, faN: -60 }, dur: 1.3 },
      { pose: { torso: 58, head: 64, thN: 135, shN: 135, ftN: 45, uaN: -132, faN: 48 }, dur: 1.5 }
    ]
  },
  stiff: {
    anchor: "ankleN",
    at: [150, 218],
    back: [{ k: "plate", at: "handN", r: 20 }],
    keys: [
      { pose: st({ torso: -88, head: -90, uaN: 90, faN: 90 }), dur: 1.2 },
      { pose: { torso: -10, head: 0, thN: 80, shN: 96, thF: 82, shF: 96, uaN: 90, faN: 90 }, dur: 1.6 }
    ]
  },

  // ───────────── Pernas ─────────────
  "agachamento-livre": {
    anchor: "ankleN",
    at: [150, 218],
    back: [{ k: "plate", at: "upperBack", r: 22 }],
    keys: [
      { pose: { torso: -88, head: -90, uaN: 140, faN: -95, thN: 88, shN: 92, ftN: 2, thF: 86, shF: 92, ftF: 2 }, dur: 1.0 },
      { pose: { torso: -52, head: -78, uaN: 175, faN: -70, thN: 12, shN: 118, ftN: 2, thF: 10, shF: 118, ftF: 2 }, dur: 1.5 }
    ]
  },
  "leg-press": {
    anchor: "hip",
    at: [110, 172],
    back: LEG_PRESS,
    front: [{ k: "platform", at: "ankleN", angle: 45, len: 40 }],
    keys: [
      { pose: { torso: -126, head: -110, uaN: 60, faN: 10, ftN: -135, ik: { fN: [148, 146] } }, dur: 1.5 },
      { pose: { torso: -126, head: -110, uaN: 60, faN: 10, ftN: -135, ik: { fN: [172, 122] } }, dur: 1.0 }
    ]
  },
  "agachamento-smith": {
    anchor: "ankleN",
    at: [160, 218],
    back: [
      { k: "rail", x: 146, y1: 24, y2: 222 },
      { k: "plate", at: "upperBack", r: 20, fixX: 146 }
    ],
    keys: [
      { pose: { torso: -92, head: -90, uaN: 145, faN: -95, thN: 96, shN: 92, ftN: 2, thF: 94, shF: 92, ftF: 2 }, dur: 1.0 },
      { pose: { torso: -68, head: -82, uaN: 178, faN: -78, thN: 12, shN: 118, ftN: 2, thF: 10, shF: 118, ftF: 2 }, dur: 1.5 }
    ]
  },
  "cadeira-extensora": {
    anchor: "hip",
    at: [140, 162],
    back: [
      {
        k: "frame",
        pts: [
          [150, 178],
          [150, 222]
        ],
        w: 4
      },
      {
        k: "frame",
        pts: [
          [124, 222],
          [190, 222]
        ]
      },
      { k: "pad", a: [120, 174], b: [180, 174], w: 9 },
      { k: "pad", a: [116, 170], b: [108, 108], w: 9 }
    ],
    front: [{ k: "roller", at: "ankleN", dx: 3, dy: 3, r: 6.5 }],
    keys: [
      { pose: { torso: -98, head: -92, uaN: 82, faN: 20, thN: 0, shN: 96, ftN: 6 }, dur: 1.4 },
      { pose: { torso: -98, head: -92, uaN: 82, faN: 20, thN: -4, shN: -6, ftN: -80 }, dur: 1.0 }
    ]
  },
  "mesa-flexora": {
    anchor: "hip",
    at: [150, 150],
    floor: 222,
    back: [
      {
        k: "frame",
        pts: [
          [100, 168],
          [100, 222]
        ],
        w: 4
      },
      {
        k: "frame",
        pts: [
          [200, 168],
          [200, 222]
        ],
        w: 4
      },
      {
        k: "frame",
        pts: [
          [84, 222],
          [216, 222]
        ]
      },
      { k: "pad", a: [70, 164], b: [226, 164], w: 9 }
    ],
    front: [{ k: "roller", at: "ankleN", dx: -1, dy: -8, r: 6 }],
    keys: [
      { pose: { torso: -6, head: -16, uaN: 100, faN: -2, thN: 180, shN: 180, ftN: 175 }, dur: 1.4 },
      { pose: { torso: -6, head: -16, uaN: 100, faN: -2, thN: 182, shN: 302, ftN: 220 }, dur: 1.0 }
    ]
  },
  "cadeira-flexora": {
    anchor: "hip",
    at: [140, 162],
    back: [
      {
        k: "frame",
        pts: [
          [150, 178],
          [150, 222]
        ],
        w: 4
      },
      {
        k: "frame",
        pts: [
          [124, 222],
          [190, 222]
        ]
      },
      { k: "pad", a: [120, 174], b: [180, 174], w: 9 },
      { k: "pad", a: [116, 170], b: [100, 112], w: 9 }
    ],
    front: [
      { k: "roller", at: "kneeN", dx: -6, dy: -11, r: 6 },
      { k: "roller", at: "ankleN", dx: -2, dy: 6, r: 6 }
    ],
    keys: [
      { pose: { torso: -106, head: -96, uaN: 82, faN: 20, thN: 0, shN: 2, ftN: -70 }, dur: 1.4 },
      { pose: { torso: -106, head: -96, uaN: 82, faN: 20, thN: 0, shN: 112, ftN: 20 }, dur: 1.0 }
    ]
  },
  "afundo-halteres": {
    anchor: "hip",
    at: [140, 138],
    front: [{ k: "dumbbell", at: "handN", angle: 0 }],
    keys: [
      { pose: { torso: -90, head: -90, ftN: 0, ftF: 30, ik: { fN: [182, 217], fF: [96, 209] } }, dur: 1.2 },
      { pose: { torso: -88, head: -90, ftN: 0, ftF: 30, ik: { fN: [182, 217], fF: [96, 209] } }, at: [138, 168], dur: 1.4 }
    ]
  },
  "avanco-caminhando": {
    anchor: "hip",
    at: [150, 134],
    front: [{ k: "dumbbell", at: "handN", angle: 0 }],
    keys: [
      { pose: { torso: -90, ftN: 0, ftF: 0, ik: { fN: [151, 217], fF: [149, 217] } }, dur: 1.0, hold: 0.25 },
      { pose: { torso: -88, ftN: 0, ftF: 30, ik: { fN: [206, 217], fF: [146, 209] } }, at: [176, 168], dur: 1.1 },
      { pose: { torso: -90, ftN: 0, ftF: 0, ik: { fN: [151, 217], fF: [149, 217] } }, dur: 1.0, hold: 0.25 },
      { pose: { torso: -88, ftN: 30, ftF: 0, ik: { fN: [146, 209], fF: [206, 217] } }, at: [176, 168], dur: 1.1 }
    ]
  },
  "cadeira-abdutora": {
    anchor: "hip",
    at: [160, 160],
    view: "front",
    thighScale: 0.35,
    back: seatFront(160, 170, 222),
    front: [
      { k: "roller", at: "kneeN", dx: 8, r: 6 },
      { k: "roller", at: "kneeF", dx: -8, r: 6 }
    ],
    keys: [
      { pose: { torso: -90, uaN: 100, faN: 80, thN: 86, shN: 92 }, dur: 1.3 },
      { pose: { torso: -90, uaN: 100, faN: 80, thN: 12, shN: 74 }, dur: 1.0 }
    ]
  },
  "cadeira-adutora": {
    anchor: "hip",
    at: [160, 160],
    view: "front",
    thighScale: 0.35,
    back: seatFront(160, 170, 222),
    front: [
      { k: "roller", at: "kneeN", dx: -8, r: 6 },
      { k: "roller", at: "kneeF", dx: 8, r: 6 }
    ],
    keys: [
      { pose: { torso: -90, uaN: 100, faN: 80, thN: 6, shN: 70 }, dur: 1.3 },
      { pose: { torso: -90, uaN: 100, faN: 80, thN: 88, shN: 94 }, dur: 1.0 }
    ]
  },
  "ponte-de-gluteo": {
    anchor: "shoulder",
    at: [100, 206],
    keys: [
      { pose: { torso: 180, head: 182, uaN: 6, faN: 0, ftN: 0, ik: { fN: [204, 214] } }, dur: 1.2 },
      { pose: { torso: 152, head: 176, uaN: 6, faN: 0, ftN: 0, ik: { fN: [204, 214] } }, dur: 1.0, hold: 0.6 }
    ]
  },
  "panturrilha-sentada": {
    anchor: "hip",
    at: [140, 160],
    back: [
      {
        k: "frame",
        pts: [
          [130, 176],
          [130, 222]
        ],
        w: 4
      },
      {
        k: "frame",
        pts: [
          [110, 222],
          [230, 222]
        ]
      },
      { k: "pad", a: [106, 172], b: [160, 172], w: 9 },
      { k: "plate", at: "kneeN", dy: -14, r: 18 }
    ],
    front: [
      {
        k: "frame",
        pts: [
          [188, 205],
          [210, 205]
        ],
        w: 8
      },
      {
        k: "frame",
        pts: [
          [199, 209],
          [199, 222]
        ],
        w: 4
      }
    ],
    keys: [
      { pose: { torso: -90, thN: 0, shN: 90, ftN: -18, ik: { hN: [180, 146] } }, dur: 1.2 },
      { pose: { torso: -90, thN: -14, shN: 90, ftN: 34, ik: { hN: [180, 136] } }, dur: 0.9, hold: 0.5 }
    ]
  },
  "panturrilha-leg-press": {
    anchor: "hip",
    at: [110, 172],
    back: LEG_PRESS,
    front: [{ k: "platform", at: "toeN", angle: 45, len: 40 }],
    keys: [
      { pose: { torso: -126, head: -110, uaN: 60, faN: 10, thN: -38, shN: -42, ftN: -150 }, dur: 1.1 },
      { pose: { torso: -126, head: -110, uaN: 60, faN: 10, thN: -38, shN: -42, ftN: -96 }, dur: 0.8, hold: 0.5 }
    ]
  },

  // ───────────── Ombros ─────────────
  "desenvolvimento-halteres": {
    anchor: "hip",
    at: [160, 160],
    view: "front",
    thighScale: 0.35,
    back: seatFront(160, 170, 222),
    front: [
      { k: "dumbbell", at: "handN", angle: 0 },
      { k: "dumbbell", at: "handF", angle: 0 }
    ],
    keys: [
      { pose: { torso: -90, thN: 74, shN: 92, ik: { hN: [200, 94], hF: [120, 94] } }, dur: 1.4 },
      { pose: { torso: -90, thN: 74, shN: 92, ik: { hN: [182, 56], hF: [138, 56] } }, dur: 1.0 }
    ]
  },
  "desenvolvimento-militar": {
    anchor: "hip",
    at: [160, 160],
    view: "front",
    thighScale: 0.35,
    back: seatFront(160, 170, 222),
    front: [{ k: "bar", a: "handF", b: "handN" }],
    keys: [
      { pose: { torso: -90, thN: 74, shN: 92, ik: { hN: [196, 100], hF: [124, 100] } }, dur: 1.4 },
      { pose: { torso: -90, thN: 74, shN: 92, ik: { hN: [190, 54], hF: [130, 54] } }, dur: 1.0 }
    ]
  },
  "elevacao-lateral": {
    anchor: "hip",
    at: [160, 134],
    view: "front",
    front: [
      { k: "dumbbell", at: "handN" },
      { k: "dumbbell", at: "handF" }
    ],
    keys: [
      { pose: { torso: -90, thN: 86, shN: 90, uaN: 80, faN: 84 }, dur: 1.4 },
      { pose: { torso: -90, thN: 86, shN: 90, uaN: -4, faN: -2 }, dur: 1.0 }
    ]
  },
  "elevacao-frontal": {
    anchor: "ankleN",
    at: [150, 218],
    front: [{ k: "dumbbell", at: "handN" }],
    back: [{ k: "dumbbell", at: "handF", far: true }],
    keys: [
      { pose: st({ uaN: 86, faN: 86 }), dur: 1.4 },
      { pose: st({ uaN: -6, faN: -6 }), dur: 1.0 }
    ]
  },
  "desenvolvimento-arnold": {
    anchor: "hip",
    at: [160, 160],
    view: "front",
    thighScale: 0.35,
    back: seatFront(160, 170, 222),
    front: [
      { k: "dumbbell", at: "handN", angle: 90 },
      { k: "dumbbell", at: "handF", angle: 90 }
    ],
    keys: [
      { pose: { torso: -90, thN: 74, shN: 92, uaN: 112, faN: -84 }, dur: 1.0 },
      { pose: { torso: -90, thN: 74, shN: 92, uaN: 18, faN: -84 }, dur: 0.8, hold: 0 },
      { pose: { torso: -90, thN: 74, shN: 92, uaN: -64, faN: -84 }, dur: 0.7 },
      { pose: { torso: -90, thN: 74, shN: 92, uaN: 18, faN: -84 }, dur: 0.8, hold: 0 }
    ]
  },
  "remada-alta": {
    anchor: "hip",
    at: [160, 134],
    view: "front",
    bend: { armN: -1 },
    front: [{ k: "bar", a: "handF", b: "handN" }],
    keys: [
      { pose: { torso: -90, thN: 86, shN: 90, ik: { hN: [170, 138], hF: [150, 138] } }, dur: 1.3 },
      { pose: { torso: -90, thN: 86, shN: 90, ik: { hN: [169, 92], hF: [151, 92] } }, dur: 1.0 }
    ]
  },
  "encolhimento-barra": {
    anchor: "hip",
    at: [160, 134],
    view: "front",
    front: [{ k: "bar", a: "handF", b: "handN" }],
    keys: [
      { pose: { torso: -90, thN: 86, shN: 90, uaN: 94, faN: 92, shrug: -2 }, dur: 1.0 },
      { pose: { torso: -90, thN: 86, shN: 90, uaN: 94, faN: 92, shrug: 8 }, dur: 0.8, hold: 0.6 }
    ]
  },
  "crucifixo-inverso": {
    anchor: "hip",
    at: [160, 150],
    view: "front",
    torsoScale: 0.62,
    hideLegs: true,
    back: [
      { k: "pad", a: [160, 104], b: [160, 168], w: 30 },
      {
        k: "frame",
        pts: [
          [160, 170],
          [160, 222]
        ],
        w: 4
      },
      {
        k: "frame",
        pts: [
          [138, 222],
          [182, 222]
        ]
      }
    ],
    front: [
      { k: "dumbbell", at: "handN" },
      { k: "dumbbell", at: "handF" }
    ],
    keys: [
      { pose: { torso: -90, uaN: 96, faN: 94 }, dur: 1.4 },
      { pose: { torso: -90, uaN: 2, faN: 6 }, dur: 1.0 }
    ]
  },

  // ───────────── Braços ─────────────
  "rosca-direta": {
    anchor: "ankleN",
    at: [150, 218],
    back: [{ k: "plate", at: "handN", r: 20 }],
    keys: [
      { pose: st({ uaN: 94, faN: 86 }), dur: 1.4 },
      { pose: st({ torso: -92, uaN: 90, faN: -72 }), dur: 0.9 }
    ]
  },
  "rosca-martelo": {
    anchor: "ankleN",
    at: [150, 218],
    front: [{ k: "dumbbell", at: "handN", align: "perpN" }],
    keys: [
      { pose: st({ uaN: 94, faN: 88 }), dur: 1.4 },
      { pose: st({ torso: -92, uaN: 88, faN: -70 }), dur: 0.9 }
    ]
  },
  "rosca-alternada": {
    anchor: "ankleN",
    at: [150, 218],
    back: [{ k: "dumbbell", at: "handF", far: true }],
    front: [{ k: "dumbbell", at: "handN" }],
    keys: [
      { pose: st({ uaN: 92, faN: 88, uaF: 92, faF: 88 }), dur: 1.2, hold: 0.1 },
      { pose: st({ uaN: 88, faN: -70, uaF: 92, faF: 88 }), dur: 0.9 },
      { pose: st({ uaN: 92, faN: 88, uaF: 92, faF: 88 }), dur: 1.2, hold: 0.1 },
      { pose: st({ uaN: 92, faN: 88, uaF: 88, faF: -70 }), dur: 0.9 }
    ]
  },
  "rosca-scott": {
    anchor: "hip",
    at: [130, 165],
    back: [
      { k: "plate", at: "handN", r: 19 },
      {
        k: "frame",
        pts: [
          [152, 152],
          [152, 222]
        ],
        w: 4
      },
      {
        k: "frame",
        pts: [
          [120, 182],
          [120, 222]
        ],
        w: 4
      },
      {
        k: "frame",
        pts: [
          [100, 222],
          [176, 222]
        ]
      },
      { k: "pad", a: [104, 178], b: [148, 178], w: 9 },
      { k: "pad", a: [136, 132], b: [160, 154], w: 9 }
    ],
    keys: [
      { pose: { torso: -80, head: -76, uaN: 48, faN: 52, thN: 4, shN: 92 }, dur: 1.5 },
      { pose: { torso: -80, head: -76, uaN: 48, faN: -98, thN: 4, shN: 92 }, dur: 0.9 }
    ]
  },
  "triceps-polia": {
    anchor: "ankleN",
    at: [146, 218],
    back: [
      {
        k: "frame",
        pts: [
          [212, 18],
          [212, 222]
        ],
        w: 4
      }
    ],
    front: [{ k: "cable", from: [204, 24], to: "handN", grip: "bar" }],
    keys: [
      { pose: st({ torso: -82, head: -86, uaN: 96, faN: -32, thN: 92, shN: 90 }), dur: 1.3 },
      { pose: st({ torso: -82, head: -86, uaN: 98, faN: 90, thN: 92, shN: 90 }), dur: 0.9 }
    ]
  },
  "triceps-corda": {
    anchor: "ankleN",
    at: [146, 218],
    back: [
      {
        k: "frame",
        pts: [
          [212, 18],
          [212, 222]
        ],
        w: 4
      }
    ],
    front: [{ k: "cable", from: [204, 24], to: "handN", grip: "rope" }],
    keys: [
      { pose: st({ torso: -82, head: -86, uaN: 96, faN: -36, thN: 92, shN: 90 }), dur: 1.3 },
      { pose: st({ torso: -82, head: -86, uaN: 100, faN: 98, thN: 92, shN: 90 }), dur: 0.9 }
    ]
  },
  "triceps-testa": {
    anchor: "hip",
    at: [178, 150],
    floor: 206,
    back: [{ k: "plate", at: "handN", r: 19 }, ...flatBench(92, 206, 160, 206)],
    keys: [
      { pose: { torso: 180, head: 182, ...SUPINE_LEGS, uaN: -98, faN: -94 }, dur: 1.4 },
      { pose: { torso: 180, head: 182, ...SUPINE_LEGS, uaN: -104, faN: 128 }, dur: 0.9 }
    ]
  },
  "triceps-frances": {
    anchor: "hip",
    at: [150, 166],
    back: [
      {
        k: "frame",
        pts: [
          [150, 182],
          [150, 222]
        ],
        w: 4
      },
      {
        k: "frame",
        pts: [
          [128, 222],
          [172, 222]
        ]
      },
      { k: "pad", a: [124, 178], b: [176, 178], w: 9 }
    ],
    front: [{ k: "dumbbell", at: "handN", align: "alongN" }],
    keys: [
      { pose: { torso: -90, head: -88, uaN: -96, faN: -92, thN: 0, shN: 90 }, dur: 1.0 },
      { pose: { torso: -90, head: -84, uaN: -100, faN: 112, thN: 0, shN: 90 }, dur: 1.5 }
    ]
  },

  // ───────────── Abdômen ─────────────
  prancha: {
    anchor: "elbowN",
    at: [215, 213],
    keys: [
      { pose: { torso: -8, head: -4, uaN: 90, faN: 0, thN: 172, shN: 172, ftN: 80 }, dur: 1.8, hold: 0.2 },
      { pose: { torso: -9, head: -6, uaN: 90, faN: 0, thN: 171, shN: 171, ftN: 81 }, dur: 1.8, hold: 0.2 }
    ]
  },
  "abdominal-supra": {
    anchor: "hip",
    at: [160, 206],
    floor: 218,
    back: flatBench(178, 238, 172, 218),
    keys: [
      { pose: { torso: 180, head: 180, uaN: -60, faN: 143, thN: -88, shN: 0, ftN: -90 }, dur: 1.2 },
      { pose: { torso: 206, head: 222, uaN: -34, faN: 170, thN: -88, shN: 0, ftN: -90 }, dur: 0.9, hold: 0.5 }
    ]
  },
  "abdominal-polia": {
    anchor: "kneeN",
    at: [150, 214],
    back: [
      {
        k: "frame",
        pts: [
          [226, 18],
          [226, 222]
        ],
        w: 4
      }
    ],
    front: [{ k: "cable", from: [220, 24], to: "handN", grip: "rope" }],
    keys: [
      { pose: { torso: -72, head: -66, uaN: 48, faN: -100, thN: 88, shN: 180, ftN: 176 }, dur: 1.3 },
      { pose: { torso: -8, head: 14, uaN: 112, faN: -38, thN: 80, shN: 180, ftN: 176 }, dur: 1.0, hold: 0.5 }
    ]
  },
  "elevacao-de-pernas": {
    anchor: "hip",
    at: [165, 210],
    keys: [
      { pose: { torso: 180, head: 180, uaN: 2, faN: 0, thN: -4, shN: -4, ftN: -70 }, dur: 1.5 },
      { pose: { torso: 180, head: 180, uaN: 2, faN: 0, thN: -86, shN: -84, ftN: -10 }, dur: 1.0 }
    ]
  }
};
