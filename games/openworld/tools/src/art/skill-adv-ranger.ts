// The ranger's advancements (docs/advancement.md, 2026-11-12): the three paths and each one's own third — the Hunter in
// trap iron and rope, hound grey and forest green, and Greenwood Dawn in the dawn's pink and gold over the forest; the
// Sniper in gold and white with steel, and Hawkeye in a hawk's gold and brown; the Skirmisher in teal wind and white
// feathers, and Skywing in sky blue and white wings —, the four new skills of the first tree, and the entrances (a
// medallion for each path, an emblem for each third). 64x64, by code, in the look of skill-actives.ts: one bold emblem on
// a clear ground, a dark outline round it, three or four tones a colour, a few bright accents; a mastery's picture is its
// skill's with a gold badge in the lower right.
//
//   npx tsx games/openworld/tools/src/art/skill-adv-ranger.ts

import { Raster, writeAtlas, type Palette } from './raster.ts'

const PAL: Palette = {
  k: [40, 18, 14, 255],
  // steel and iron
  s1: [78, 84, 100, 255], s2: [138, 146, 162, 255], s3: [198, 205, 216, 255], s4: [246, 248, 252, 255],
  b1: [28, 28, 38, 255], b2: [58, 58, 74, 255], b3: [100, 100, 122, 255],
  // wood, leather, rope
  w1: [86, 46, 26, 255], w2: [136, 80, 42, 255], w3: [188, 124, 68, 255],
  e1: [78, 52, 38, 255], e2: [120, 84, 54, 255], e3: [166, 120, 80, 255],
  o1: [122, 92, 52, 255], o2: [176, 138, 82, 255], o3: [222, 190, 132, 255],
  // gold and ivory: the Sharpshooter
  g1: [146, 92, 28, 255], g2: [212, 150, 50, 255], g3: [250, 208, 98, 255],
  y2: [250, 218, 60, 255], y3: [255, 250, 182, 255],
  c1: [196, 186, 160, 255], c2: [232, 224, 202, 255], c3: [252, 248, 236, 255],
  // red, fire
  r1: [116, 28, 30, 255], r2: [188, 50, 44, 255], r3: [234, 98, 72, 255],
  f1: [196, 64, 28, 255], f2: [240, 126, 38, 255], f3: [255, 196, 76, 255], f4: [255, 242, 172, 255],
  // greens: the ranger's, the forest's
  p1: [36, 104, 48, 255], p2: [76, 176, 66, 255], p3: [146, 228, 106, 255],
  q1: [30, 66, 40, 255], q2: [52, 104, 60, 255], q3: [92, 148, 88, 255],
  // fur
  m1: [86, 86, 94, 255], m2: [136, 136, 146, 255], m3: [188, 188, 198, 255], m4: [230, 230, 236, 255],
  // the Master Archer's wind
  t1: [36, 116, 116, 255], t2: [78, 178, 168, 255], t3: [160, 232, 214, 255],
  // water
  i1: [46, 96, 158, 255], i2: [98, 168, 220, 255],
  // the hawk's plumage, mud
  h1: [92, 58, 34, 255], h2: [150, 102, 62, 255], h3: [222, 196, 152, 255],
  d1: [70, 50, 32, 255], d2: [104, 76, 48, 255], d3: [140, 108, 72, 255],
  // the Skywing's sky, the Skirmisher's lightest wind
  a1: [52, 108, 176, 255], a2: [96, 160, 226, 255], a3: [160, 208, 250, 255], a4: [228, 244, 255, 255],
  t4: [220, 252, 240, 255],
  // the Greenwood Dawn's pinks
  n1: [170, 70, 100, 255], n2: [226, 120, 140, 255], n3: [252, 182, 176, 255], n4: [255, 228, 208, 255],
}

const S = 64
type P = [number, number]
type Ramp = [string, string, string, string?]

const thick = (r: Raster, a: P, b: P, c: string, w: number) => r.line(a[0], a[1], b[0], b[1], c, w)

function ball(r: Raster, cx: number, cy: number, rad: number, ramp: Ramp): void {
  r.ellipse(cx, cy, rad, rad, ramp[0])
  r.ellipse(cx - rad * 0.12, cy - rad * 0.12, rad * 0.82, rad * 0.82, ramp[1])
  r.ellipse(cx - rad * 0.3, cy - rad * 0.3, rad * 0.5, rad * 0.5, ramp[2])
  if (ramp[3]) r.ellipse(cx - rad * 0.42, cy - rad * 0.42, Math.max(1, rad * 0.18), Math.max(1, rad * 0.18), ramp[3])
}

function arc(r: Raster, cx: number, cy: number, rad: number, a0: number, a1: number, c: string, w = 1): void {
  const steps = Math.max(8, Math.ceil(Math.abs(a1 - a0) * rad * 0.05))
  let prev: P | undefined
  for (let i = 0; i <= steps; i++) {
    const a = ((a0 + ((a1 - a0) * i) / steps) * Math.PI) / 180
    const p: P = [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]
    if (prev) thick(r, prev, p, c, w)
    prev = p
  }
}

/** An arrow from its nock to its point: a shaft, a head, fletching in two colours. */
function arrow(r: Raster, nock: P, point: P, head = 4, fletch = ['r2', 'r3'], shaft = ['w3', 'w2'], tip = ['s2', 's4']): void {
  const len = Math.hypot(point[0] - nock[0], point[1] - nock[1])
  const d: P = [(point[0] - nock[0]) / len, (point[1] - nock[1]) / len]
  const n: P = [-d[1], d[0]]
  const base: P = [point[0] - d[0] * head * 1.6, point[1] - d[1] * head * 1.6]
  thick(r, nock, base, shaft[0], 2)
  r.line(nock[0], nock[1], base[0], base[1], shaft[1])
  r.poly([[base[0] + n[0] * head, base[1] + n[1] * head], point, [base[0] - n[0] * head, base[1] - n[1] * head]], tip[0])
  r.line(base[0], base[1], point[0], point[1], tip[1])
  for (const s of [1, -1]) {
    for (let t = 0; t < 6; t++) {
      const x = nock[0] + d[0] * t
      const y = nock[1] + d[1] * t
      r.line(x, y, x + n[0] * s * 3 - d[0] * 2, y + n[1] * s * 3 - d[1] * 2, t % 2 ? fletch[0] : fletch[1])
    }
  }
}

function sparkle(r: Raster, x: number, y: number, s: number, c: string, core = c): void {
  r.line(x - s, y, x + s, y, c)
  r.line(x, y - s, x, y + s, c)
  r.set(x, y, core)
}

function streaks(r: Raster, lines: [number, number, number][], ramp: string[]): void {
  lines.forEach(([x, y, len], i) => {
    r.line(x, y, x + len, y, ramp[i % ramp.length])
    r.line(x + len, y, x + len + 2, y - 1, ramp[i % ramp.length])
  })
}

function star(r: Raster, cx: number, cy: number, rad: number, c: string, core?: string): void {
  const pts: P[] = []
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const rr = i % 2 ? rad * 0.45 : rad
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr])
  }
  r.poly(pts, c)
  if (core) r.set(cx, cy, core)
}

/** A paw print: a pad and four toes. */
function paw(r: Raster, cx: number, cy: number, s: number, ramp: [string, string]): void {
  r.ellipse(cx, cy + s * 0.5, s * 1.1, s * 0.85, ramp[0])
  r.ellipse(cx - s * 0.15, cy + s * 0.35, s * 0.6, s * 0.45, ramp[1])
  for (const [dx, dy] of [[-1.3, -0.7], [-0.45, -1.35], [0.45, -1.35], [1.3, -0.7]] as const) {
    r.ellipse(cx + dx * s, cy + dy * s, s * 0.42, s * 0.5, ramp[0])
    r.set(cx + dx * s - 1, cy + dy * s - 1, ramp[1])
  }
}

/** A wolf's head in profile facing right, jaws open (`open`), its neck going off to the lower left. */
function wolfSide(r: Raster, x: number, y: number, s: number, open: number, fur: Ramp = ['m1', 'm2', 'm3']): void {
  const at = (u: number, v: number): P => [x + u * s, y + v * s]
  // the neck and back of the head
  r.poly([at(-14, 12), at(-12, -4), at(-4, -10), at(4, -9), at(6, 6), at(-6, 16)], fur[1])
  r.poly([at(-12, 10), at(-10, -2), at(-4, -7), at(0, -6), at(-2, 8)], fur[2])
  // ear
  r.poly([at(-6, -8), at(-3, -18), at(2, -9)], fur[0])
  r.poly([at(-4, -9), at(-3, -15), at(0, -9)], fur[1])
  // upper jaw
  r.poly([at(2, -9), at(16, -5), at(20, -2), at(18, 0), at(4, 0)], fur[1])
  r.line(x + 4 * s, y - 7 * s, x + 18 * s, y - 3 * s, fur[2])
  r.ellipse(x + 19.5 * s, y - 2.6 * s, 1.4 * s, 1.2 * s, 'b1')
  // lower jaw, dropped by `open`
  r.poly([at(4, 2 + open * 0.2), at(15, 2 + open), at(14, 5 + open), at(4, 7)], fur[0])
  // mouth and teeth
  r.poly([at(4, 0), at(18, 0), at(15, 2 + open), at(4, 2 + open * 0.2)], 'r1')
  for (const u of [8, 12, 16]) {
    r.poly([at(u, 0), at(u + 1.5, 0), at(u + 0.7, 2)], 'm4')
    r.poly([at(u - 1, 2 + open * 0.9), at(u + 0.5, 2 + open * 0.9), at(u - 0.3, 0.5 + open * 0.9)], 'm4')
  }
  // the eye
  r.poly([at(4, -6), at(8, -6), at(7, -4)], 'p2')
  r.set(x + 6 * s, y - 5.4 * s, 'p3')
}

const out: Record<string, Raster> = {}
const icon = (id: string, draw: (r: Raster) => void) => {
  const r = new Raster(S, S)
  draw(r)
  out[id] = r
}

const GOLD = ['g2', 'g3']
const IVORY = ['c2', 'c3']
const TEAL = ['t2', 't3']

/** Another icon's picture under this one (a mastery's badge goes over its skill's). */
const copy = (r: Raster, from: string) => out[from].px.forEach((c, i) => (r.px[i] = c))

/** A path's medallion: a round plate in the path's colours, a gold rim with four studs (as the mage's). */
function medallion(r: Raster, ramp: Ramp): void {
  r.ellipse(32, 32, 25, 25, 'g1')
  r.ellipse(32, 32, 23, 23, 'g2')
  arc(r, 32, 32, 23, 190, 260, 'g3', 2)
  r.ellipse(32, 32, 19, 19, ramp[0])
  r.ellipse(31, 31, 17, 17, ramp[1])
  r.ellipse(29, 29, 10, 10, ramp[2])
  for (const a of [45, 135, 225, 315]) r.ellipse(32 + Math.cos((a * Math.PI) / 180) * 23, 32 + Math.sin((a * Math.PI) / 180) * 23, 1.6, 1.6, 'g3')
}

/** A gold badge in the corner: a skill's mastery (as the other trees' enhancements), on a layer of its own. */
function badge(r: Raster): void {
  const b = new Raster(S, S)
  ball(b, 50, 50, 9, ['g1', 'g2', 'g3'])
  b.outline('k')
  b.rect(48, 44, 4, 12, 'f4')
  b.rect(44, 48, 12, 4, 'f4')
  b.px.forEach((c, i) => c && (r.px[i] = c))
}

/** A critical's star: four long points round a white heart. */
function star4(r: Raster, x: number, y: number, s: number, c = 'y2', core = 'c3'): void {
  const pts = (k: number): P[] => [[x, y - s * k], [x + s * k * 0.26, y - s * k * 0.26], [x + s * k, y], [x + s * k * 0.26, y + s * k * 0.26], [x, y + s * k], [x - s * k * 0.26, y + s * k * 0.26], [x - s * k, y], [x - s * k * 0.26, y - s * k * 0.26]]
  r.poly(pts(1), c)
  r.poly(pts(0.5), core)
}

/** A feather from its quill to its tip: a vane `w` wide at its fullest, a lit half, the quill down its middle, a few barbs. */
function feather(r: Raster, base: P, tip: P, w: number, ramp: [string, string, string] = ['m3', 'm4', 'a4'], quill = 'a2'): void {
  const len = Math.hypot(tip[0] - base[0], tip[1] - base[1])
  const d: P = [(tip[0] - base[0]) / len, (tip[1] - base[1]) / len]
  const n: P = [-d[1], d[0]]
  const side = (k: number, from = 0.12): P[] => {
    const pts: P[] = []
    for (let i = 0; i <= 8; i++) {
      const t = from + ((1 - from) * i) / 8
      const half = w * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.08)), 0.7) * 0.5
      pts.push([base[0] + d[0] * len * t + n[0] * half * k, base[1] + d[1] * len * t + n[1] * half * k])
    }
    return pts
  }
  const left = side(1)
  const right = side(-1)
  r.poly([...left, ...right.reverse()], ramp[0])
  r.poly([...side(1, 0.18).map(([x, y]): P => [x - n[0] * 0.6, y - n[1] * 0.6]), ...Array.from({ length: 9 }, (_, i): P => { const t = 0.18 + (0.82 * (8 - i)) / 8; return [base[0] + d[0] * len * t, base[1] + d[1] * len * t] })], ramp[1])
  for (const t of [0.35, 0.55, 0.75]) {
    const [x, y] = [base[0] + d[0] * len * t, base[1] + d[1] * len * t]
    r.line(x, y, x - n[0] * w * 0.4 - d[0] * 3, y - n[1] * w * 0.4 - d[1] * 3, ramp[0])
  }
  r.line(base[0], base[1], tip[0] - d[0] * 2, tip[1] - d[1] * 2, quill)
  r.set(tip[0] - d[0] * 3, tip[1] - d[1] * 3, ramp[2])
}

/** A bird's wing spread from its shoulder at (x, y) out to `side` (1 right, −1 left): its long flight feathers fanned down
 * and out from the wrist, the shorter ones hanging from the arm, the coverts along its leading edge. */
function wing(r: Raster, x: number, y: number, s: number, side: 1 | -1, ramp: [string, string, string] = ['m3', 'm4', 'a4'], tipped = 'a2'): void {
  const at = (u: number, v: number): P => [x + side * u * s, y + v * s]
  const wrist = at(17, -9)
  // the secondaries from the arm, then the primaries from the wrist, outermost last
  for (const [u, v] of [[3, -3], [7, -5], [11, -7]] as const) feather(r, at(u, v), at(u + 2, v + 15), 6 * s, ramp, tipped)
  for (const [i, a] of [[0, 78], [1, 56], [2, 34], [3, 12]] as const) {
    const rad = (a * Math.PI) / 180
    const len = (15 + i * 2) * s
    feather(r, wrist, [wrist[0] + side * Math.cos(rad) * len, wrist[1] + Math.sin(rad) * len], 6.5 * s, ramp, tipped)
  }
  // the coverts: a band along the leading edge, lit along its top
  r.poly([at(-1, -2), at(8, -8), at(17, -12), at(22, -10), at(16, -4), at(6, 2)], ramp[1])
  r.poly([at(0, -3), at(8, -9), at(17, -12), at(12, -7), at(4, -1)], ramp[2])
}

/** A cloud of puffs, dark below and light above. */
function cloud(r: Raster, puffs: [number, number, number][], ramp: [string, string, string]): void {
  for (const [x, y, s] of puffs) r.ellipse(x, y, s, s * 0.85, ramp[0])
  for (const [x, y, s] of puffs) r.ellipse(x - s * 0.1, y - s * 0.18, s * 0.8, s * 0.62, ramp[1])
  for (const [x, y, s] of puffs) r.ellipse(x - s * 0.3, y - s * 0.38, s * 0.38, s * 0.28, ramp[2])
}

/** A pine's silhouette: three tiers of boughs on a short trunk. */
function pine(r: Raster, x: number, base: number, h: number, ramp: [string, string]): void {
  r.rect(x - 1, base - h * 0.18, 2, h * 0.18, 'w1')
  for (let i = 0; i < 3; i++) {
    const top = base - h + i * h * 0.24
    const half = h * (0.2 + i * 0.1)
    r.poly([[x, top], [x + half, top + h * 0.38], [x - half, top + h * 0.38]], ramp[0])
    r.poly([[x, top + 1], [x - half * 0.15, top + h * 0.38], [x - half + 2, top + h * 0.38]], ramp[1])
  }
}

/** A bird in flight, a gull's M: two wings rising from a small body and bending down at the wrist; lit beneath by `lit`. */
function bird(r: Raster, x: number, y: number, s: number, c: string, lit?: string): void {
  for (const sx of [-1, 1]) {
    r.poly([[x, y], [x + sx * 3 * s, y - 3 * s], [x + sx * 5 * s, y - 2.6 * s], [x + sx * 8 * s, y + 0.6 * s], [x + sx * 4.6 * s, y - 1 * s], [x + sx * 2.6 * s, y - 0.8 * s], [x + sx * 0.6 * s, y + 1.2 * s]], c)
    if (lit) r.line(x + sx * 1 * s, y + 0.6 * s, x + sx * 2.8 * s, y - 0.6 * s, lit)
  }
  r.ellipse(x, y, 1 * s, 1.4 * s, c)
}

/** A crosshair: a ring, four ticks reaching in, a dot. */
function crosshair(r: Raster, cx: number, cy: number, rad: number, c: string, w = 2, dot = c): void {
  arc(r, cx, cy, rad, 0, 360, c, w)
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) thick(r, [cx + dx * (rad + 5), cy + dy * (rad + 5)], [cx + dx * (rad * 0.45), cy + dy * (rad * 0.45)], c, w)
  r.ellipse(cx, cy, 1.4, 1.4, dot)
}

// ================================================================== the Sniper (once the Sharpshooter): gold and white

// Sure Eye (eagle-eye): an almond eye, white with a gold iris, a feather for its lash
icon('eagle-eye', (r) => {
  r.poly([[6, 32], [18, 20], [32, 16], [46, 20], [58, 32], [46, 44], [32, 48], [18, 44]], 'c1')
  r.poly([[10, 32], [20, 22], [32, 19], [44, 22], [54, 32], [44, 41], [32, 44], [20, 41]], 'c3')
  ball(r, 32, 32, 11, ['g1', 'g2', 'g3'])
  r.ellipse(32, 32, 5, 5, 'b1')
  r.ellipse(29, 29, 2, 2, 'c3')
  r.outline('k')
  // the lash: a gold feather sweeping off the top
  r.poly([[30, 16], [44, 4], [58, 2], [48, 10], [36, 18]], 'g2')
  r.poly([[34, 16], [46, 6], [56, 3], [44, 12]], 'g3')
  r.line(32, 17, 56, 3, 'g1')
  r.outline('k')
  for (const [x, y] of [[8, 50], [56, 50]] as const) sparkle(r, x, y, 2, 'y3', 'c3')
})

// Deadeye: a white bow drawn to the full, a glowing gold arrow on the string
icon('deadeye', (r) => {
  // the bow, bent hard to the right
  arc(r, 14, 32, 28, -62, 62, 'c1', 4)
  arc(r, 14, 32, 28, -55, 0, 'c3', 1)
  r.rect(37, 29, 4, 6, 'g1')
  // the string, pulled back into a deep V
  r.line(27, 7, 6, 32, 'c3')
  r.line(27, 57, 6, 32, 'c3')
  r.outline('k', ['c3'])
  arrow(r, [6, 32], [60, 32], 5, GOLD, ['g2', 'g1'], ['y2', 'y3'])
  r.outline('k')
  // the glint running down the shaft
  for (let x = 14; x < 50; x += 6) r.set(x, 31, 'y3')
  sparkle(r, 58, 22, 3, 'y3', 'c3')
  sparkle(r, 58, 42, 2, 'g3')
})

// Ricochet (now the Skirmisher's): an arrow's zigzag path, three bright knocks where it turned, the arrow at its end
icon('ricochet', (r) => {
  const pts: P[] = [[6, 54], [20, 20], [34, 46], [48, 14]]
  for (let i = 0; i + 1 < pts.length; i++) {
    const [a, b] = [pts[i], pts[i + 1]]
    for (let t = 0; t < 1; t += 0.12) r.ellipse(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, 1.5, 1.5, i % 2 ? 'g2' : 'c2')
  }
  for (const p of pts.slice(1, 3)) {
    star(r, p[0], p[1], 6, 'g3', 'c3')
  }
  r.outline('k', ['g2', 'c2'])
  arrow(r, [40, 30], [58, 4], 4.5, IVORY, ['g2', 'g1'], ['s2', 's4'])
  r.outline('k')
  sparkle(r, 8, 54, 2, 'c3')
})

// Weak Point: a white breastplate cracked, a gold arrowhead driving into the crack
icon('weak-point', (r) => {
  r.poly([[12, 14], [26, 10], [38, 10], [52, 14], [50, 34], [44, 48], [32, 56], [20, 48], [14, 34]], 'c1')
  r.poly([[16, 16], [28, 13], [36, 13], [48, 16], [46, 32], [40, 44], [32, 50], [24, 44], [18, 32]], 'c2')
  r.line(32, 13, 32, 50, 'c1')
  r.line(20, 18, 26, 30, 'c3')
  // the crack
  r.line(36, 20, 30, 28, 'b1')
  r.line(30, 28, 38, 34, 'b1')
  r.line(38, 34, 32, 42, 'b1')
  r.line(30, 28, 24, 30, 'b1')
  r.outline('k')
  // the arrowhead, gold, at the crack from the upper right
  r.poly([[34, 30], [56, 12], [48, 26]], 'g2')
  r.poly([[34, 30], [56, 12], [44, 18]], 'g3')
  thick(r, [56, 12], [62, 6], 'w2', 2)
  r.outline('k')
  sparkle(r, 34, 30, 3, 'y3', 'c3')
})

// Patience: a gold hourglass, white sand running, an arrow laid across its foot
icon('patience', (r) => {
  r.rect(16, 6, 32, 5, 'g2')
  r.rect(16, 53, 32, 5, 'g2')
  r.rect(16, 6, 32, 2, 'g3')
  r.rect(16, 53, 32, 2, 'g3')
  for (const x of [19, 44]) r.rect(x, 11, 2, 42, 'g1')
  r.poly([[22, 11], [42, 11], [34, 30], [34, 34], [42, 53], [22, 53], [30, 34], [30, 30]], 'c1')
  r.poly([[24, 12], [40, 12], [33, 29], [31, 29]], 'c3')
  // the sand: the top half spent, a heap below
  r.poly([[27, 20], [37, 20], [33, 28], [31, 28]], 'g3')
  r.line(32, 29, 32, 46, 'g3')
  r.poly([[24, 52], [32, 42], [40, 52]], 'g3')
  r.outline('k')
  arrow(r, [4, 58], [60, 46], 4, IVORY, ['w3', 'w2'], ['s2', 's4'])
  r.outline('k')
})

// Heartseeker: a white heart, a gold arrow through it and out the far side
icon('heartseeker', (r) => {
  const heart = (cx: number, cy: number, s: number, c: string) => {
    r.ellipse(cx - 7 * s, cy - 4 * s, 8 * s, 8 * s, c)
    r.ellipse(cx + 7 * s, cy - 4 * s, 8 * s, 8 * s, c)
    r.poly([[cx - 14.6 * s, cy - 1 * s], [cx + 14.6 * s, cy - 1 * s], [cx, cy + 16 * s]], c)
  }
  heart(32, 30, 1.35, 'c1')
  heart(31, 29, 1.1, 'c2')
  r.ellipse(22, 22, 4, 4, 'c3')
  r.outline('k')
  arrow(r, [6, 56], [58, 8], 5, GOLD, ['g2', 'g1'], ['y2', 'y3'])
  r.outline('k')
  for (const [x, y] of [[54, 24], [10, 30], [44, 54]] as const) sparkle(r, x, y, 3, 'y3', 'c3')
})

// ================================================================== the Hunter: the traps' iron and rope (once the Trapper's)

// Lay of the Land (now the Skirmisher's): a folded map, a dashed trail across it, an iron pin at its end
icon('lay-of-the-land', (r) => {
  r.poly([[6, 14], [22, 10], [42, 14], [58, 10], [58, 50], [42, 54], [22, 50], [6, 54]], 'o2')
  r.poly([[22, 10], [42, 14], [42, 54], [22, 50]], 'o3')
  r.line(22, 10, 22, 50, 'o1')
  r.line(42, 14, 42, 54, 'o1')
  // hills, a river
  r.poly([[10, 40], [16, 30], [22, 40]], 'q2')
  r.poly([[44, 30], [50, 22], [56, 30]], 'q2')
  r.line(26, 52, 34, 40, 'i2')
  r.outline('k')
  // the trail, dashed, and the pin
  const trail: P[] = [[10, 46], [18, 36], [28, 34], [34, 26], [46, 24]]
  for (let i = 0; i + 1 < trail.length; i++) {
    const [a, b] = [trail[i], trail[i + 1]]
    for (let t = 0; t < 1; t += 0.34) r.ellipse(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, 1, 1, 'r2')
  }
  thick(r, [48, 22], [48, 10], 's2', 2)
  ball(r, 48, 8, 4, ['r1', 'r2', 'r3'])
  r.outline('k', ['r2'])
})

// Snare Trap: a sapling bent down to a peg, a rope noose laid open on the ground under it
icon('snare-trap', (r) => {
  // the sapling, bent over in a bow from the left
  arc(r, 30, 48, 24, 180, 300, 'w2', 4)
  arc(r, 30, 48, 24, 190, 260, 'w3', 1)
  r.poly([[4, 50], [8, 50], [8, 58], [4, 58]], 'w1')
  // its leaves at the tip
  for (const [x, y] of [[40, 24], [44, 20], [46, 26]] as const) r.ellipse(x, y, 3, 2, 'q2')
  r.outline('k')
  // the line down from the tip to the noose
  r.line(42, 27, 42, 40, 'o1')
  r.line(43, 27, 43, 40, 'o2')
  // the noose: an open loop of rope on the ground, its knot
  arc(r, 36, 50, 14, 0, 360, 'o2', 3)
  arc(r, 36, 49, 14, 190, 340, 'o3', 1)
  r.ellipse(42, 40, 3, 2.5, 'o1')
  r.ellipse(41, 39, 1.5, 1, 'o3')
  r.outline('k')
  r.rect(4, 60, 56, 2, 'd2')
  r.outline('k')
})

// Spike Trap: three iron spikes up through a board, a drop of blood on one point
icon('spike-trap', (r) => {
  r.rect(6, 46, 52, 10, 'w2')
  r.rect(6, 46, 52, 3, 'w3')
  for (const x of [14, 30, 46]) r.rect(x - 1, 50, 2, 2, 'w1')
  r.outline('k')
  for (const [x, h] of [[16, 30], [32, 40], [48, 30]] as const) {
    r.poly([[x - 5, 46], [x, 46 - h], [x + 5, 46]], 's2')
    r.poly([[x - 3, 46], [x, 46 - h], [x, 46]], 's3')
    r.line(x, 46 - h + 2, x, 44, 's4')
  }
  r.outline('k')
  r.ellipse(32, 9, 1.6, 2.2, 'r2')
  for (const [x, y] of [[52, 10], [10, 14]] as const) sparkle(r, x, y, 2, 's4')
})

// Ambusher: two eyes in the leaves, an arrowhead poking out of the cover
icon('ambusher', (r) => {
  for (const [x, y, rad, c] of [[20, 30, 14, 'q1'], [40, 28, 15, 'q2'], [30, 44, 16, 'q1'], [48, 44, 11, 'q2'], [14, 46, 10, 'q2']] as const) r.ellipse(x, y, rad, rad * 0.85, c)
  for (const [x, y] of [[16, 24], [36, 20], [26, 40], [46, 40], [12, 44], [38, 50]] as const) r.poly([[x, y], [x + 4, y - 3], [x + 6, y + 1]], 'q3')
  r.outline('k')
  // the eyes, low and narrow
  for (const x of [24, 36]) {
    r.poly([[x - 4, 32], [x + 4, 31], [x + 3, 34], [x - 3, 34]], 'y2')
    r.rect(x - 1, 32, 2, 2, 'b1')
  }
  // the arrowhead, out of the right side of the bush
  r.poly([[50, 30], [62, 34], [50, 38]], 's2')
  r.line(51, 34, 61, 34, 's4')
  r.outline('k')
})

// Tripwire: a taut wire between two pegs, a bell on it struck and sparking
icon('tripwire', (r) => {
  for (const x of [8, 56]) {
    r.poly([[x - 3, 30], [x + 3, 30], [x + 1, 50], [x - 1, 50]], 'w2')
    r.rect(x - 3, 28, 6, 3, 'w3')
  }
  r.line(8, 32, 56, 36, 'm4')
  r.line(8, 33, 56, 37, 's2')
  r.outline('k', ['m4', 's2'])
  // the bell
  r.poly([[26, 36], [26, 30], [32, 26], [38, 30], [38, 36], [40, 40], [24, 40]], 'g2')
  r.poly([[28, 36], [28, 31], [32, 28], [34, 30], [33, 38]], 'g3')
  r.ellipse(32, 42, 2, 2, 'g1')
  r.outline('k')
  for (const [x, y] of [[20, 20], [44, 18], [32, 12]] as const) star(r, x, y, 4, 'y2', 'y3')
  r.outline('k', ['m4', 's2'])
})

// Killing Field: a ring of iron trap-plates round a burst of fire
icon('killing-field', (r) => {
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6
    const len = i % 2 ? 14 : 22
    r.poly([[32 + Math.cos(a + 0.22) * 6, 32 + Math.sin(a + 0.22) * 6], [32 + Math.cos(a) * len, 32 + Math.sin(a) * len], [32 + Math.cos(a - 0.22) * 6, 32 + Math.sin(a - 0.22) * 6]], i % 2 ? 'f3' : 'f2')
  }
  ball(r, 32, 32, 8, ['f1', 'f2', 'f3', 'f4'])
  r.outline('k')
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 + Math.PI / 6
    const [x, y] = [32 + Math.cos(a) * 25, 32 + Math.sin(a) * 25]
    r.ellipse(x, y, 6, 5, 's1')
    r.ellipse(x - 0.5, y - 0.5, 4.5, 3.5, 's2')
    r.rect(x - 1, y - 1, 2, 2, 'r2')
  }
  r.outline('k')
})

// ================================================================== the Hunter: the hound's fur grey and forest green (once the Beastmaster's)

// Pack Bond: a grey paw print within a braided green cord
icon('pack-bond', (r) => {
  arc(r, 32, 32, 26, 0, 360, 'q1', 4)
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8
    r.ellipse(32 + Math.cos(a) * 26, 32 + Math.sin(a) * 26, 2.4, 2.4, i % 2 ? 'q2' : 'q3')
  }
  r.outline('k')
  paw(r, 32, 34, 7, ['m2', 'm3'])
  r.outline('k')
  sparkle(r, 32, 6, 2, 'm4')
})

// Call the Hound: a bone whistle, its call going out in green rings, a paw print beside
icon('call-the-hound', (r) => {
  for (const [rad, c] of [[10, 'q3'], [16, 'q2'], [22, 'q1']] as const) arc(r, 30, 30, rad, -60, 40, c, 2)
  r.outline('k', ['q1', 'q2', 'q3'])
  // the whistle, from the lower left up to the mouth of the rings
  r.poly([[6, 52], [24, 32], [30, 36], [12, 56]], 'h3')
  r.poly([[8, 52], [24, 34], [26, 36], [10, 54]], 'c3')
  r.rect(20, 38, 3, 3, 'h1')
  r.rect(15, 44, 3, 3, 'h1')
  r.ellipse(26, 34, 3, 3, 'h2')
  r.outline('k')
  paw(r, 48, 50, 4, ['m2', 'm3'])
  r.outline('k')
})

// Sic: a wolf in profile lunging, jaws wide, three red bite marks before it
icon('sic', (r) => {
  wolfSide(r, 26, 34, 1.5, 7)
  r.outline('k')
  for (const [x, y] of [[54, 14], [58, 24], [54, 34]] as const) {
    r.line(x - 4, y - 3, x + 4, y + 3, 'r2', 2)
  }
  streaks(r, [[2, 50, 8], [4, 56, 6]], ['m3', 'm2'])
  r.outline('k', ['m3', 'm2'])
})

// Feral Instinct: a wolf's green eye, glowing, three claw marks raked across
icon('feral-instinct', (r) => {
  r.poly([[6, 34], [20, 22], [34, 18], [50, 22], [60, 32], [48, 42], [32, 46], [16, 44]], 'm2')
  r.poly([[12, 34], [22, 26], [34, 23], [48, 26], [54, 32], [46, 38], [32, 41], [18, 40]], 'p2')
  r.ellipse(34, 32, 4, 9, 'b1')
  r.ellipse(30, 28, 2, 2, 'p3')
  r.outline('k')
  for (const dx of [-12, 0, 12]) thick(r, [20 + dx, 6], [40 + dx, 58], 'm4', 2)
  for (const dx of [-12, 0, 12]) r.line(21 + dx, 6, 41 + dx, 58, 'r3')
  r.outline('k', ['m4', 'r3'])
})

// Pack Hunter: two wolves running side by side, one before the other
icon('pack-hunter', (r) => {
  const runner = (x: number, y: number, ramp: Ramp) => {
    r.poly([[x - 16, y + 1], [x - 6, y - 6], [x + 8, y - 6], [x + 13, y - 11], [x + 22, y - 9], [x + 21, y - 4], [x + 15, y + 2], [x + 7, y + 7], [x - 10, y + 7]], ramp[1])
    r.poly([[x - 12, y], [x - 4, y - 4], [x + 8, y - 4], [x + 4, y + 2], [x - 8, y + 3]], ramp[2])
    r.poly([[x + 13, y - 11], [x + 14, y - 16], [x + 17, y - 11]], ramp[0])
    // legs in stride
    r.line(x - 10, y + 6, x - 18, y + 12, ramp[0], 3)
    r.line(x - 5, y + 6, x - 1, y + 13, ramp[0], 3)
    r.line(x + 8, y + 4, x + 16, y + 10, ramp[0], 3)
    r.line(x + 3, y + 5, x + 1, y + 13, ramp[0], 3)
    // the tail
    r.line(x - 16, y + 1, x - 24, y - 3, ramp[1], 4)
    r.set(x + 18, y - 8, 'p3')
  }
  runner(30, 22, ['m1', 'm2', 'm3'])
  r.outline('k')
  runner(36, 44, ['m1', 'm3', 'm4'])
  r.outline('k')
  streaks(r, [[2, 30, 6], [2, 52, 8]], ['q3', 'q2'])
})

// The Pack: three wolves' heads raised, howling up at a white moon
icon('the-pack', (r) => {
  ball(r, 18, 13, 9, ['c1', 'c2', 'c3'])
  r.outline('k')
  // a wolf's head in profile, muzzle raised to the upper right
  const howler = (x: number, y: number, s: number, ramp: Ramp) => {
    const at = (u: number, v: number): P => [x + u * s, y + v * s]
    r.poly([at(-7, 16), at(-7, 2), at(-5, -6), at(-4, -14), at(-1, -8), at(3, -10), at(9, -18), at(12, -16), at(8, -8), at(6, 0), at(7, 16)], ramp[1])
    r.poly([at(-4, 14), at(-4, 2), at(-1, -5), at(4, -8), at(5, -2), at(3, 14)], ramp[2])
    r.poly([at(-7, -4), at(-6, -17), at(0, -8)], ramp[0])
    r.poly([at(-5, -6), at(-5, -13), at(-2, -8)], ramp[1])
    // the open mouth, howling, and the nose at the tip
    r.poly([at(6, -6), at(11, -13), at(10, -10), at(7, -4)], 'r1')
    r.ellipse(x + 10.5 * s, y - 17 * s, 1.4 * s, 1.2 * s, 'b1')
    r.set(x + 1 * s, y - 6 * s, 'b1')
  }
  // each outlined before the next, so they stand apart
  howler(12, 44, 1.0, ['m1', 'm2', 'm3'])
  r.outline('k')
  howler(52, 44, 1.0, ['m1', 'm2', 'm3'])
  r.outline('k')
  howler(32, 38, 1.35, ['m1', 'm3', 'm4'])
  r.outline('k')
  r.rect(2, 58, 60, 4, 'q1')
  r.rect(2, 58, 60, 1, 'q2')
  r.outline('k')
  for (const [x, y] of [[40, 8], [54, 14], [6, 28]] as const) sparkle(r, x, y, 1, 'c3')
})

// ================================================================== the Hunter, new: the mark, the trap's mastery, the ground

// the path: a green medallion, a hound's paw within a noose of rope
icon('path-hunter', (r) => {
  medallion(r, ['q1', 'q1', 'q2'])
  r.outline('k')
  arc(r, 32, 33, 15, 0, 360, 'o2', 4)
  arc(r, 32, 33, 15, 200, 320, 'o3', 2)
  r.ellipse(43, 22, 4, 3, 'o1')
  r.ellipse(42, 21, 2, 1.5, 'o3')
  r.outline('k', ['q1', 'q2', 'g1', 'g2', 'g3'])
  paw(r, 32, 32, 6.5, ['m3', 'm4'])
  r.outline('k', ['q1', 'q2', 'g1', 'g2', 'g3', 'o2', 'o3', 'o1'])
})

// Mark Prey: a stag's head, face on, a red hunter's mark burning on its brow
icon('mark-prey', (r) => {
  // antlers, each a beam with three tines
  for (const sx of [-1, 1]) {
    const at = (x: number, y: number): P => [32 + sx * x, y]
    thick(r, at(6, 30), at(16, 16), 'h2', 3)
    thick(r, at(16, 16), at(22, 4), 'h2', 3)
    thick(r, at(12, 22), at(6, 10), 'h2', 2)
    thick(r, at(18, 12), at(26, 10), 'h2', 2)
    thick(r, at(16, 16), at(26, 20), 'h2', 2)
    r.line(...at(7, 29), ...at(21, 5), 'h3')
  }
  r.outline('k')
  // the head: long, narrowing to the muzzle, ears out to the sides
  for (const sx of [-1, 1]) r.poly([[32 + sx * 8, 30], [32 + sx * 20, 26], [32 + sx * 14, 34]], 'e2')
  r.poly([[22, 30], [42, 30], [40, 44], [36, 56], [28, 56], [24, 44]], 'e2')
  r.poly([[25, 31], [33, 31], [32, 54], [28, 54], [26, 44]], 'e3')
  r.ellipse(32, 54, 5, 3, 'b1')
  for (const sx of [-1, 1]) r.ellipse(32 + sx * 6, 38, 1.6, 1.6, 'b1')
  r.outline('k')
  // the mark: a red rune, a ring and a cross under a chevron
  arc(r, 32, 36, 6, 0, 360, 'r2', 2)
  thick(r, [32, 30], [32, 42], 'r3', 1)
  thick(r, [26, 36], [38, 36], 'r3', 1)
  r.outline('k', ['e2', 'e3', 'b1'])
  sparkle(r, 32, 36, 2, 'r3', 'f4')
  for (const [x, y] of [[10, 44], [54, 46]] as const) sparkle(r, x, y, 2, 'r3', 'f4')
})

// Spike Trap: Mastery — the spikes, a gold badge
icon('spike-trap-plus', (r) => {
  copy(r, 'spike-trap')
  badge(r)
})

// Hunting Ground: a steel trap's jaws snapped shut, a red critical bursting out of the bite
icon('hunting-ground', (r) => {
  r.rect(4, 54, 56, 6, 'd2')
  r.rect(4, 54, 56, 2, 'd3')
  for (const x of [8, 50]) r.poly([[x, 54], [x + 2, 47], [x + 4, 54]], 'q2')
  r.outline('k')
  // the shut jaws: two half-rings meeting, their teeth locked, the bed dark between them
  r.ellipse(32, 40, 17, 17, 'b2')
  r.ellipse(32, 46, 13, 8, 'b1')
  arc(r, 32, 40, 18, 180, 360, 's1', 5)
  arc(r, 32, 40, 18, 200, 280, 's3', 1)
  arc(r, 32, 40, 18, 0, 180, 's1', 5)
  for (let i = 0; i < 7; i++) {
    const x = 18 + i * 4.5
    r.poly([[x - 2, 37], [x, 41], [x + 2, 37]], 's3')
    r.poly([[x, 44], [x + 2, 40], [x + 4, 44]], 's2')
  }
  r.rect(14, 39, 36, 2, 'b1')
  r.rect(24, 56, 16, 4, 's1')
  r.outline('k')
  star4(r, 32, 18, 14, 'r2', 'f3')
  r.outline('k', ['d2', 'd3', 'q2'])
  sparkle(r, 32, 18, 2, 'f4')
  for (const [x, y] of [[12, 12], [52, 10]] as const) sparkle(r, x, y, 2, 'f3', 'f4')
})

// ================================================================== Greenwood Dawn (the Hunter's third): forest green under the dawn's pink and gold

// the third's entrance: a forest of pines dark against a dawn sun, birds rising out of it
icon('mastery-hunter', (r) => {
  r.ellipse(32, 32, 23, 23, 'n1')
  r.ellipse(32, 32, 19, 19, 'n2')
  r.ellipse(32, 35, 11, 11, 'n3')
  ball(r, 32, 37, 7, ['g2', 'g3', 'n4'])
  for (let i = 0; i < 9; i++) {
    const a = Math.PI + (i * Math.PI) / 8
    thick(r, [32 + Math.cos(a) * 12, 37 + Math.sin(a) * 12], [32 + Math.cos(a) * 20, 37 + Math.sin(a) * 20], i % 2 ? 'n3' : 'g3', 1)
  }
  r.outline('k')
  for (const [x, h] of [[14, 16], [22, 22], [32, 19], [42, 24], [50, 16]] as const) pine(r, x, 56, h, ['q1', 'q2'])
  r.rect(10, 52, 44, 5, 'q1')
  r.outline('k')
  for (const [x, y, s] of [[22, 18, 1.1], [30, 13, 0.9], [40, 16, 1.2], [46, 11, 0.8]] as const) bird(r, x, y, s, 'b1')
})

// Heart of the Greenwood: a heart of green leaves in a ring of dawn light
icon('greenwood-heart', (r) => {
  arc(r, 32, 32, 26, 0, 360, 'n2', 2)
  arc(r, 32, 32, 22, 200, 340, 'n3', 1)
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 + Math.PI / 8
    sparkle(r, 32 + Math.cos(a) * 26, 32 + Math.sin(a) * 26, 1, 'g3', 'n4')
  }
  // the heart
  r.ellipse(23, 26, 10, 10, 'q1')
  r.ellipse(41, 26, 10, 10, 'q1')
  r.poly([[13, 29], [51, 29], [32, 52]], 'q1')
  r.ellipse(23, 25, 8, 8, 'q2')
  r.ellipse(41, 25, 8, 8, 'q2')
  r.poly([[15, 28], [49, 28], [32, 48]], 'q2')
  // its leaves, a vein each
  for (const [x, y, a] of [[22, 22, -0.6], [38, 22, 0.5], [30, 34, 0.1], [42, 32, 0.9], [20, 32, -0.9]] as const) {
    const [dx, dy] = [Math.cos(a - Math.PI / 2) * 6, Math.sin(a - Math.PI / 2) * 6]
    r.poly([[x - dx, y - dy], [x + dy * 0.5, y - dx * 0.5], [x + dx, y + dy], [x - dy * 0.5, y + dx * 0.5]], 'p2')
    r.line(x - dx, y - dy, x + dx, y + dy, 'p3')
  }
  r.outline('k', ['n2', 'n3', 'g3', 'n4'])
  sparkle(r, 24, 20, 2, 'p3', 'n4')
})

// Hunting Net: a net flung wide, its mesh of rope, a lead weight at each corner
icon('hunting-net', (r) => {
  const c: P[] = [[8, 14], [56, 8], [58, 52], [6, 56]]
  const lerp = (a: P, b: P, t: number): P => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
  // the mesh: lines across each way, a little sagging
  for (let i = 0; i <= 5; i++) {
    const t = i / 5
    const [a, b] = [lerp(c[0], c[3], t), lerp(c[1], c[2], t)]
    const mid = lerp(a, b, 0.5)
    thick(r, a, [mid[0], mid[1] + 3], 'o2', 2)
    thick(r, [mid[0], mid[1] + 3], b, 'o2', 2)
    const [u, v] = [lerp(c[0], c[1], t), lerp(c[3], c[2], t)]
    const mid2 = lerp(u, v, 0.5)
    thick(r, u, [mid2[0] + 3, mid2[1]], 'o2', 2)
    thick(r, [mid2[0] + 3, mid2[1]], v, 'o2', 2)
  }
  r.outline('k')
  // the knots, lit
  for (let i = 0; i <= 5; i++) for (let j = 0; j <= 5; j++) {
    const p = lerp(lerp(c[0], c[3], i / 5), lerp(c[1], c[2], i / 5), j / 5)
    r.set(p[0], p[1], 'o3')
  }
  for (const p of c) ball(r, p[0], p[1], 4, ['s1', 's2', 's3'])
  r.outline('k', ['o2', 'o3'])
})

// Hunting Net: Mastery — the net, a gold badge
icon('hunting-net-plus', (r) => {
  copy(r, 'hunting-net')
  badge(r)
})

// Dawn Flight: a flock bursting up out of the forest at dawn, each bird lit pink beneath, the sun's rays behind them
icon('dawn-flight', (r) => {
  // (the rays short of the corners: the icon keeps its clear ground)
  for (let i = 0; i < 7; i++) {
    const a = Math.PI + 0.25 + (i * (Math.PI - 0.5)) / 6
    r.poly([[32, 60], [32 + Math.cos(a - 0.12) * 34, 60 + Math.sin(a - 0.12) * 34], [32 + Math.cos(a + 0.12) * 34, 60 + Math.sin(a + 0.12) * 34]], i % 2 ? 'n2' : 'n3')
  }
  ball(r, 32, 60, 8, ['g2', 'g3', 'n4'])
  r.outline('k')
  // the flock, fanned up and out from the trees
  // (on a layer of their own, outlined, so each stands out against the rays)
  const flock = new Raster(S, S)
  for (const [x, y, s] of [[32, 38, 2.4], [15, 28, 1.8], [49, 27, 1.9], [26, 15, 1.4], [42, 11, 1.3], [8, 12, 1.1], [57, 13, 1.1]] as const) bird(flock, x, y, s, 'c3', 'n2')
  flock.outline('k', ['n2'])
  flock.px.forEach((c, i) => c && (r.px[i] = c))
  r.rect(6, 58, 52, 5, 'q1')
  for (const x of [10, 20, 44, 54]) pine(r, x, 62, 12, ['q1', 'q2'])
  r.outline('k', ['n2', 'n3', 'b1'])
})

// Lord of the Hunt: a crown of antlers, gold-tipped, over a red mark
icon('lord-of-the-hunt', (r) => {
  // the band
  r.poly([[12, 40], [52, 40], [50, 50], [14, 50]], 'g1')
  r.poly([[13, 41], [51, 41], [50, 45], [14, 45]], 'g2')
  r.line(14, 42, 50, 42, 'g3')
  for (const x of [20, 32, 44]) r.ellipse(x, 46, 2, 2, x === 32 ? 'r2' : 'q3')
  // the antlers rising from it
  for (const sx of [-1, 1]) {
    const at = (x: number, y: number): P => [32 + sx * x, y]
    thick(r, at(8, 40), at(18, 20), 'h2', 3)
    thick(r, at(18, 20), at(20, 6), 'h2', 3)
    thick(r, at(13, 30), at(6, 18), 'h2', 2)
    thick(r, at(18, 20), at(28, 14), 'h2', 2)
    r.line(...at(9, 39), ...at(19, 8), 'h3')
    for (const [x, y] of [[20, 6], [6, 18], [28, 14]] as const) r.ellipse(...at(x, y), 1.8, 1.8, 'g3')
  }
  r.outline('k')
  // the mark under it, burning
  arc(r, 32, 56, 4, 0, 360, 'r2', 2)
  r.outline('k', ['g1', 'g2', 'g3', 'h2', 'h3'])
  sparkle(r, 32, 56, 2, 'r3', 'f4')
  for (const [x, y] of [[32, 26], [8, 54], [56, 54]] as const) sparkle(r, x, y, 2, 'g3', 'n4')
})

// ================================================================== the Sniper, new: steel and gold, the pin, the held breath, the far mark

// the path: a steel medallion, a crosshair over it, a gold arrow laid across
icon('path-sharpshooter', (r) => {
  medallion(r, ['s1', 's2', 's3'])
  r.outline('k')
  crosshair(r, 32, 32, 11, 'b2', 2, 'r2')
  arrow(r, [8, 50], [54, 14], 4.5, GOLD, ['g2', 'g1'], ['y2', 'y3'])
  r.outline('k', ['s1', 's2', 's3', 'g1', 'g2', 'g3'])
  sparkle(r, 54, 14, 2, 'y3', 'c3')
})

// Pinning Shot: an arrow driven slant into the ground through a cloak's hem, cracks round it
icon('pinning-shot', (r) => {
  r.rect(2, 46, 60, 14, 'd1')
  r.rect(2, 46, 60, 3, 'd2')
  r.outline('k')
  // the cloak's hem on the ground, pinned
  r.poly([[6, 30], [30, 34], [40, 48], [22, 52], [4, 46]], 'r1')
  r.poly([[8, 32], [28, 36], [34, 46], [20, 48], [6, 44]], 'r2')
  r.line(10, 40, 30, 44, 'r3')
  r.outline('k')
  arrow(r, [52, 6], [28, 50], 5, GOLD, ['g2', 'g1'], ['s2', 's4'])
  r.outline('k')
  // the cracks and the dust round the point
  for (const [x, y] of [[18, 54], [38, 56], [30, 58]] as const) r.line(28, 52, x, y, 'b1')
  for (const [x, y] of [[16, 50], [40, 50]] as const) r.ellipse(x, y, 2, 1.4, 'd3')
  sparkle(r, 28, 50, 3, 'y3', 'c3')
})

// Pinning Shot: Mastery — the pinning arrow, a gold badge
icon('pinning-shot-plus', (r) => {
  copy(r, 'pinning-shot')
  badge(r)
})

// Hold Breath: a white feather balanced, quite still, on the point of an upturned arrowhead
icon('hold-breath', (r) => {
  // the arrowhead, point up, on its shaft
  thick(r, [32, 62], [32, 40], 'w2', 3)
  r.line(32, 62, 32, 40, 'w3')
  r.poly([[24, 42], [32, 24], [40, 42]], 's2')
  r.poly([[28, 42], [32, 24], [32, 42]], 's3')
  r.line(32, 26, 32, 40, 's4')
  r.outline('k')
  // the feather lying flat across the point
  feather(r, [10, 22], [56, 20], 9, ['c1', 'c2', 'c3'], 'g1')
  r.outline('k')
  // the quiet round it: two faint arcs, a gold glint at the touch
  arc(r, 32, 22, 24, 200, 250, 'g2', 1)
  arc(r, 32, 22, 24, 290, 340, 'g2', 1)
  sparkle(r, 32, 23, 2, 'y3', 'c3')
})

// Hold Breath: Mastery — the balanced feather, a gold badge
icon('hold-breath-plus', (r) => {
  copy(r, 'hold-breath')
  badge(r)
})

// Long Shot: a gold arrow's long flight, a dotted arc, to a small target far off in the corner
icon('long-shot', (r) => {
  // the far target
  for (const [rad, c] of [[8, 'r2'], [6, 'c3'], [4, 'r2'], [2, 'c3']] as const) r.ellipse(52, 12, rad, rad, c)
  r.outline('k')
  // the flight: a dotted arc rising from the lower left
  for (let i = 0; i < 12; i++) {
    const t = i / 12
    const x = 6 + t * 40
    const y = 58 - t * 44 - Math.sin(t * Math.PI) * 10
    r.ellipse(x, y, 1, 1, i % 2 ? 'g2' : 'c2')
  }
  arrow(r, [26, 40], [46, 18], 4.5, IVORY, ['g2', 'g1'], ['y2', 'y3'])
  r.outline('k', ['g2', 'c2'])
  // the cells counted under it
  for (let x = 6; x <= 58; x += 8) r.rect(x, 60, 2, 3, x > 30 ? 'g3' : 's2')
})

// Killshot: a white skull, a gold arrow through its eye
icon('killshot', (r) => {
  r.ellipse(30, 28, 18, 17, 'c1')
  r.ellipse(29, 26, 15, 14, 'c2')
  r.ellipse(24, 20, 5, 4, 'c3')
  r.poly([[18, 38], [42, 38], [40, 50], [20, 50]], 'c1')
  for (const x of [23, 28, 33, 38]) r.rect(x - 1, 44, 2, 6, 'b2')
  r.line(20, 44, 40, 44, 'b2')
  r.ellipse(22, 30, 5, 5, 'b1')
  r.ellipse(37, 30, 5, 5, 'b1')
  r.poly([[28, 36], [32, 36], [30, 40]], 'b1')
  r.outline('k')
  arrow(r, [4, 58], [37, 30], 4.5, GOLD, ['g2', 'g1'], ['y2', 'y3'])
  thick(r, [40, 28], [52, 20], 'w2', 2)
  r.outline('k')
  star4(r, 52, 14, 8, 'r2', 'f3')
  r.outline('k', ['r2', 'f3'])
})

// Deadeye: Mastery — the bow at full draw, a gold badge
icon('deadeye-plus', (r) => {
  copy(r, 'deadeye')
  badge(r)
})

// ================================================================== Hawkeye (the Sniper's third): a hawk's gold and brown

/** A hawk's head in profile facing left, within a 64 square: dark crown, buff cheek, a gold eye under a dark brow, a hooked beak. */
function hawk(r: Raster): void {
  // the head and neck
  r.poly([[18, 18], [26, 10], [40, 8], [52, 14], [56, 26], [58, 44], [60, 60], [24, 60], [22, 46], [18, 34], [16, 26]], 'h2')
  r.poly([[20, 18], [28, 11], [40, 9], [50, 14], [44, 18], [30, 18]], 'h1')
  // the throat and breast, streaked
  r.poly([[18, 32], [30, 30], [38, 40], [40, 60], [24, 60], [22, 46]], 'h3')
  for (const [x, y] of [[26, 44], [32, 50], [28, 54], [36, 46]] as const) r.line(x, y, x + 1, y + 3, 'h2')
  // the moustache stripe and the eyestripe behind the eye
  r.poly([[22, 26], [30, 26], [30, 38], [24, 36]], 'h1')
  r.poly([[30, 20], [48, 22], [46, 26], [30, 24]], 'h1')
  // the beak: a gold cere, the dark grey hook
  r.poly([[18, 18], [24, 18], [24, 26], [18, 26]], 'g2')
  r.poly([[18, 18], [8, 22], [4, 30], [8, 34], [10, 28], [18, 26]], 'm1')
  r.poly([[17, 19], [9, 23], [7, 28], [10, 26], [17, 24]], 'm2')
  r.poly([[10, 28], [18, 27], [18, 30], [12, 31]], 'm2')
  // the eye, under its dark brow
  r.ellipse(28, 21, 4.5, 4.5, 'g3')
  r.ellipse(28, 21, 2.2, 2.2, 'b1')
  r.set(27, 20, 'c3')
  r.poly([[22, 15], [36, 15], [34, 18], [24, 18]], 'b1')
}

// the third's entrance: a hawk's head in profile, its gold eye, a far crosshair caught before it
icon('mastery-sharpshooter', (r) => {
  hawk(r)
  r.outline('k')
  crosshair(r, 8, 52, 5, 'g3', 1, 'r2')
  r.outline('k', ['g3', 'r2'])
  for (const [x, y] of [[8, 8], [56, 6]] as const) sparkle(r, x, y, 2, 'g3', 'c3')
})

// Hawk's Sight: a hawk wheeling high, wings spread, over a range ring that reaches the edges of everything below
icon('hawks-sight', (r) => {
  for (let i = 0; i < 24; i++) {
    const a = (i * Math.PI) / 12
    r.ellipse(32 + Math.cos(a) * 29, 36 + Math.sin(a) * 24, 1.3, 1.3, i % 2 ? 'g2' : 'g3')
  }
  arc(r, 32, 36, 16, 0, 360, 'g1', 1)
  for (const [x, y] of [[8, 54], [54, 50], [46, 14]] as const) r.ellipse(x, y, 2, 2, 'r2')
  r.outline('k', ['g1', 'g2', 'g3', 'r2'])
  // the hawk from below: broad wings, fanned tail, its head
  const fan = (sx: 1 | -1) => {
    r.poly([[32, 30], [32 + sx * 10, 24], [32 + sx * 22, 26], [32 + sx * 30, 32], [32 + sx * 24, 34], [32 + sx * 26, 38], [32 + sx * 18, 38], [32 + sx * 8, 36]], 'h1')
    r.poly([[32, 31], [32 + sx * 10, 26], [32 + sx * 20, 28], [32 + sx * 14, 33], [32 + sx * 6, 34]], 'h2')
    for (const u of [20, 24, 28]) r.line(32 + sx * u, 32, 32 + sx * (u - 2), 37, 'h3')
  }
  fan(-1)
  fan(1)
  r.poly([[28, 36], [36, 36], [40, 48], [24, 48]], 'h2')
  for (const x of [28, 32, 36]) r.line(x, 40, x, 47, 'h1')
  r.ellipse(32, 32, 5, 7, 'h2')
  r.ellipse(32, 25, 3.5, 3.5, 'h2')
  r.ellipse(31, 32, 2.5, 4, 'h3')
  r.poly([[31, 21], [33, 21], [32, 19]], 'g2')
  r.outline('k', ['g1', 'g2', 'g3', 'r2'])
  sparkle(r, 32, 6, 3, 'g3', 'c3')
})

// Sunpiercer: a gold arrow through the heart of a blazing sun and out the far side
icon('sunpiercer', (r) => {
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8
    const len = i % 2 ? 22 : 28
    r.poly([[32 + Math.cos(a + 0.16) * 12, 32 + Math.sin(a + 0.16) * 12], [32 + Math.cos(a) * len, 32 + Math.sin(a) * len], [32 + Math.cos(a - 0.16) * 12, 32 + Math.sin(a - 0.16) * 12]], i % 2 ? 'f3' : 'g2')
  }
  ball(r, 32, 32, 14, ['f2', 'f3', 'f4'])
  r.outline('k')
  arrow(r, [2, 62], [62, 2], 5, IVORY, ['s3', 's2'], ['s3', 's4'])
  r.outline('k', ['f3', 'g2'])
  sparkle(r, 32, 32, 4, 'f4', 'c3')
})

// Sighted: red brackets closing in four corners on a dark figure far off, a red dot on it
icon('sight-lock', (r) => {
  // the figure, far
  r.ellipse(32, 24, 4, 4, 'b2')
  r.poly([[26, 30], [38, 30], [40, 46], [24, 46]], 'b2')
  r.poly([[27, 31], [32, 31], [31, 44], [25, 44]], 'b3')
  r.outline('k')
  // the brackets
  for (const [x, y, sx, sy] of [[10, 8, 1, 1], [54, 8, -1, 1], [10, 56, 1, -1], [54, 56, -1, -1]] as const) {
    thick(r, [x, y], [x + sx * 10, y], 'r2', 3)
    thick(r, [x, y], [x, y + sy * 10], 'r2', 3)
    r.line(x, y, x + sx * 9, y, 'r3')
  }
  r.outline('k', ['b2', 'b3'])
  r.ellipse(32, 36, 2.4, 2.4, 'r3')
  sparkle(r, 32, 36, 3, 'r3', 'f4')
  for (const y of [32, 40]) r.line(14, y, 22, y, 'r1')
  for (const y of [32, 40]) r.line(42, y, 50, y, 'r1')
})

// Sighted: Mastery — the brackets, a gold badge
icon('sight-lock-plus', (r) => {
  copy(r, 'sight-lock')
  badge(r)
})

// Still as Stone: a grey peak, unmoved, a gold arrow standing in its summit
icon('still-as-stone', (r) => {
  r.poly([[2, 60], [22, 20], [30, 28], [38, 14], [62, 60]], 'm1')
  r.poly([[22, 20], [30, 28], [38, 14], [44, 34], [34, 40], [26, 34]], 'm2')
  r.poly([[38, 14], [44, 26], [40, 24], [36, 28], [34, 20]], 'm4')
  r.poly([[22, 20], [26, 26], [20, 28]], 'm3')
  r.line(10, 56, 54, 56, 'b2')
  r.outline('k')
  arrow(r, [38, 30], [38, 0], 4, GOLD, ['g2', 'g1'], ['y2', 'y3'])
  r.outline('k', ['m1', 'm2', 'm3', 'm4'])
  for (const [x, y] of [[10, 18], [54, 20]] as const) {
    r.line(x - 4, y, x + 4, y, 'c2')
    r.line(x - 2, y + 3, x + 2, y + 3, 'c1')
  }
})

// One Shot, One Kill: a lone gold arrow dead in a target's heart, a red critical behind it
icon('one-shot', (r) => {
  star4(r, 34, 30, 28, 'r1', 'r2')
  r.outline('k')
  for (const [rad, c] of [[16, 'c2'], [12, 'r2'], [8, 'c3'], [4, 'r3']] as const) r.ellipse(34, 30, rad, rad, c)
  r.outline('k', ['r1', 'r2'])
  arrow(r, [4, 60], [34, 30], 5, GOLD, ['g2', 'g1'], ['y2', 'y3'])
  r.outline('k', ['r1', 'r2'])
  sparkle(r, 34, 30, 3, 'f4', 'c3')
})

// Unblinking: a steel eye held wide open, no lid to close, a gold star its pupil
icon('unblinking', (r) => {
  r.poly([[2, 32], [14, 16], [32, 10], [50, 16], [62, 32], [50, 48], [32, 54], [14, 48]], 's1')
  r.poly([[6, 32], [16, 19], [32, 14], [48, 19], [58, 32], [48, 45], [32, 50], [16, 45]], 'c3')
  ball(r, 32, 32, 14, ['s1', 's2', 's3'])
  r.outline('k')
  star4(r, 32, 32, 10, 'g2', 'y3')
  // its lids pinned back: a rivet at each corner
  for (const [x, y] of [[4, 32], [60, 32]] as const) r.ellipse(x, y, 2.4, 2.4, 'g2')
  r.outline('k', ['s1', 's2', 's3', 'c3'])
  for (const [x, y] of [[32, 4], [32, 60], [10, 8], [54, 8]] as const) sparkle(r, x, y, 2, 'y3', 'c3')
})

// ================================================================== the Skirmisher: teal wind and white feathers

// the path: a teal medallion, a white feather in a swirl of wind
icon('path-skirmisher', (r) => {
  medallion(r, ['t1', 't1', 't2'])
  r.outline('k')
  arc(r, 32, 32, 13, 120, 420, 't3', 2)
  arc(r, 32, 32, 7, 300, 560, 't4', 1)
  feather(r, [18, 48], [46, 14], 10, ['m3', 'm4', 'a4'], 'b2')
  r.outline('k', ['t1', 't2', 'g1', 'g2', 'g3', 't3', 't4'])
})

// Wind Step: a boot with teal wings at its heel, wind streaming off behind
icon('wind-step', (r) => {
  r.poly([[22, 10], [38, 10], [38, 40], [54, 46], [56, 54], [20, 54], [20, 40]], 'e2')
  r.poly([[24, 12], [34, 12], [34, 40], [24, 42]], 'e3')
  r.rect(20, 52, 37, 5, 'e1')
  r.rect(22, 18, 16, 3, 'w1')
  r.outline('k')
  // the wing at the heel
  for (let i = 0; i < 3; i++) feather(r, [20, 30 + i * 4], [4, 18 + i * 8], 7, ['t2', 't3', 't4'], 't1')
  r.outline('k')
  streaks(r, [[2, 50, 10], [4, 58, 12], [40, 6, 14]], ['t3', 't2', 't3'])
})

// Flit: a figure dashing right, two fading afterimages of it behind in teal
icon('flit', (r) => {
  const runner = (x: number, ramp: [string, string]) => {
    r.ellipse(x + 3, 14, 4, 4, ramp[0])
    // the body leaning into the run, the cloak out behind
    r.poly([[x - 2, 19], [x + 6, 19], [x + 4, 34], [x - 4, 34]], ramp[0])
    r.poly([[x - 2, 20], [x - 12, 24], [x - 4, 30]], ramp[1])
    // the legs in stride, the arm swung forward
    thick(r, [x - 2, 33], [x - 10, 44], ramp[0], 3)
    thick(r, [x - 10, 44], [x - 14, 42], ramp[0], 2)
    thick(r, [x + 2, 33], [x + 8, 42], ramp[0], 3)
    thick(r, [x + 8, 42], [x + 10, 48], ramp[0], 2)
    thick(r, [x + 4, 22], [x + 12, 28], ramp[0], 2)
  }
  runner(16, ['t2', 't2'])
  r.outline('k', ['t2'])
  runner(30, ['t3', 't3'])
  r.outline('k', ['t2', 't3'])
  runner(46, ['b2', 't2'])
  r.outline('k')
  streaks(r, [[0, 54, 14], [16, 58, 16], [30, 52, 10]], ['t3', 't2', 't4'])
  sparkle(r, 60, 16, 2, 't4')
})

// Flit: Mastery — the dash, a gold badge
icon('flit-plus', (r) => {
  copy(r, 'flit')
  badge(r)
})

// Arrow Flurry: four arrows one after another in a quick row, teal-fletched, speed streaks behind
icon('arrow-flurry', (r) => {
  for (const [y, dx] of [[12, 6], [26, 0], [40, 6], [54, 0]] as const) arrow(r, [4 + dx, y], [52 + dx, y], 4, TEAL, ['w3', 'w2'], ['s2', 's4'])
  r.outline('k')
  for (const [y, dx] of [[12, 6], [26, 0], [40, 6], [54, 0]] as const) r.line(dx - 2 < 0 ? 0 : dx - 2, y + 2, dx + 2, y + 2, 't3')
  sparkle(r, 60, 26, 2, 't4')
  sparkle(r, 62, 54, 1, 't4')
})

// Arrow Flurry: Mastery — the row of arrows, a gold badge
icon('arrow-flurry-plus', (r) => {
  copy(r, 'arrow-flurry')
  badge(r)
})

// Crosswind: a gust curling round from a bow, leaves caught in it, mud splashed at its foot
icon('crosswind', (r) => {
  r.ellipse(32, 56, 24, 5, 'd1')
  r.ellipse(30, 55, 18, 3, 'd2')
  for (const [x, y] of [[12, 50], [52, 48], [40, 52]] as const) r.ellipse(x, y, 2, 1.6, 'd3')
  r.outline('k')
  for (const [rad, c, w] of [[22, 't1', 4], [16, 't2', 3], [10, 't3', 2]] as const) arc(r, 32, 30, rad, 160, 470, c, w)
  r.outline('k', ['t1', 't2', 't3'])
  for (const [rad, c] of [[22, 't3'], [16, 't4']] as const) arc(r, 32, 30, rad, 200, 260, c, 1)
  for (const [x, y] of [[12, 14], [52, 26], [24, 40], [44, 10]] as const) {
    r.poly([[x - 3, y], [x, y - 3], [x + 3, y], [x, y + 3]], 'p2')
    r.set(x, y, 'p3')
  }
  r.outline('k', ['t1', 't2', 't3', 't4'])
})

// Crosswind: Mastery — the gust, a gold badge
icon('crosswind-plus', (r) => {
  copy(r, 'crosswind')
  badge(r)
})

// Rapid Fire: a bow, its string a blur of loosing, an arrow just away with three more ghosts of it behind
icon('rapid-fire', (r) => {
  arc(r, 4, 32, 26, -62, 62, 'w2', 4)
  arc(r, 4, 32, 26, -55, 0, 'w3', 1)
  r.outline('k')
  for (const dx of [0, 3, 6]) {
    r.line(16 + dx, 9, 10 + dx, 32, dx ? 't2' : 'c3')
    r.line(16 + dx, 55, 10 + dx, 32, dx ? 't2' : 'c3')
  }
  for (const [x, c] of [[16, 't1'], [26, 't2'], [36, 't3']] as const) {
    r.line(x, 32, x + 14, 32, c)
    r.poly([[x + 14, 29], [x + 18, 32], [x + 14, 35]], c)
  }
  arrow(r, [36, 32], [62, 32], 4, TEAL, ['w3', 'w2'], ['s2', 's4'])
  r.outline('k', ['t1', 't2', 't3', 'c3'])
  for (const [x, y] of [[46, 14], [50, 50]] as const) sparkle(r, x, y, 2, 't4')
})

// Running Fight: a bow drawn sideways over a swoosh of dust and wind, the archer on the move
icon('running-fight', (r) => {
  // the ground rushing past
  for (const [x, y, w] of [[4, 52, 22], [20, 58, 30], [36, 50, 24]] as const) {
    thick(r, [x, y], [x + w, y], 'd2', 3)
    r.line(x + 2, y - 1, x + w - 2, y - 1, 'd3')
  }
  r.outline('k')
  // the bow, drawn, tilted forward
  arc(r, 46, 24, 22, 130, 230, 'w2', 4)
  arc(r, 46, 24, 22, 140, 180, 'w3', 1)
  r.line(32, 7, 44, 30, 'c3')
  r.line(32, 41, 44, 30, 'c3')
  r.outline('k', ['c3'])
  arrow(r, [44, 30], [6, 20], 4, TEAL, ['w3', 'w2'], ['s2', 's4'])
  r.outline('k')
  streaks(r, [[46, 40, 12], [50, 46, 10], [44, 10, 14]], ['t3', 't2', 't3'])
})

// Gale Dance: five teal arrowheads in a wheel, all turned in on the middle, the wind wheeling round them
icon('gale-dance', (r) => {
  arc(r, 32, 32, 26, 0, 360, 't1', 3)
  for (let i = 0; i < 5; i++) {
    const a = (i * 2 * Math.PI) / 5 - Math.PI / 2
    arc(r, 32, 32, 20, (a * 180) / Math.PI + 10, (a * 180) / Math.PI + 60, 't3', 2)
  }
  r.outline('k', ['t1'])
  for (let i = 0; i < 5; i++) {
    const a = (i * 2 * Math.PI) / 5 - Math.PI / 2
    arrow(r, [32 + Math.cos(a) * 28, 32 + Math.sin(a) * 28], [32 + Math.cos(a) * 9, 32 + Math.sin(a) * 9], 3.5, TEAL, ['w3', 'w2'], ['s2', 's4'])
  }
  r.outline('k', ['t1', 't3'])
  ball(r, 32, 32, 4, ['t2', 't3', 't4'])
  r.outline('k', ['t1', 't3', 'w3', 'w2', 's2', 's4', 't2'])
})

// ================================================================== Skywing (the Skirmisher's third): sky blue and white wings

// the third's entrance: great white wings spread over a sky-blue disc, an arrow upright between them
icon('mastery-skirmisher', (r) => {
  r.ellipse(32, 32, 20, 20, 'a1')
  r.ellipse(31, 31, 17, 17, 'a2')
  r.ellipse(28, 27, 9, 9, 'a3')
  r.outline('k')
  wing(r, 30, 30, 1.1, -1)
  wing(r, 34, 30, 1.1, 1)
  r.outline('k', ['a1', 'a2', 'a3'])
  arrow(r, [32, 60], [32, 6], 4.5, ['a2', 'a4'], ['s3', 's2'], ['s3', 's4'])
  r.outline('k', ['a1', 'a2', 'a3', 'm3', 'm4', 'a4'])
  sparkle(r, 32, 6, 3, 'a4', 'c3')
})

// Heart of the Sky: a sky-blue heart borne on two small white wings
icon('sky-heart', (r) => {
  wing(r, 22, 26, 0.85, -1)
  wing(r, 42, 26, 0.85, 1)
  r.outline('k')
  r.ellipse(26, 28, 9, 9, 'a1')
  r.ellipse(38, 28, 9, 9, 'a1')
  r.poly([[17, 31], [47, 31], [32, 52]], 'a1')
  r.ellipse(25, 27, 7, 7, 'a2')
  r.ellipse(37, 27, 7, 7, 'a2')
  r.poly([[19, 30], [45, 30], [32, 48]], 'a2')
  r.ellipse(24, 24, 3, 3, 'a3')
  r.set(23, 23, 'a4')
  r.outline('k', ['m3', 'm4', 'a4', 'a2'])
  sparkle(r, 32, 8, 2, 'a4', 'c3')
})

// Wingbeat: a pair of wings brought down hard, the arcs of their beat round them, a gust off their tips
icon('wingbeat', (r) => {
  for (const [rad, c] of [[28, 'a2'], [22, 'a3']] as const) arc(r, 32, 40, rad, 200, 340, c, 2)
  r.outline('k', ['a2', 'a3'])
  // the wings, tips swept down
  for (const sx of [-1, 1] as const) for (let i = 0; i < 5; i++) {
    const a = ((20 + i * 18) * Math.PI) / 180
    feather(r, [32 + sx * 4, 30 + i], [32 + sx * Math.cos(a) * (26 - i * 2), 30 + Math.sin(a) * (24 - i * 2)], 6, ['m3', 'm4', 'a4'], 'a2')
  }
  r.ellipse(32, 28, 6, 7, 'm4')
  r.ellipse(31, 26, 3, 3, 'a4')
  r.outline('k', ['a2', 'a3'])
  for (const [x, y, len] of [[2, 58, 10], [52, 58, 10]] as const) r.line(x, y, x + len, y, 'a3')
  for (const [x, y] of [[8, 14], [56, 14]] as const) sparkle(r, x, y, 2, 'a4')
})

// Flying Feathers: five white feathers flying side by side to the right, each its own dart
icon('flying-feathers', (r) => {
  for (const [y, dx] of [[8, 4], [20, 0], [32, 6], [44, 0], [56, 4]] as const) feather(r, [4 + dx, y + 3], [44 + dx + (y === 32 ? 8 : 0), y], 7, ['m3', 'm4', 'a4'], 'a1')
  r.outline('k')
  for (const [y, dx] of [[8, 4], [32, 6], [56, 4]] as const) r.line(50 + dx, y, 60, y, 'a3')
  sparkle(r, 60, 20, 2, 'a4')
})

// Flying Feathers: Mastery — the feathers, a gold badge
icon('flying-feathers-plus', (r) => {
  copy(r, 'flying-feathers')
  badge(r)
})

// Ride the Wind: a white feather riding the crest of a long teal current
icon('ride-the-wind', (r) => {
  for (const [dy, c, w] of [[0, 't1', 4], [8, 't2', 3], [16, 't3', 2]] as const) {
    let prev: P | undefined
    for (let x = 2; x <= 62; x += 3) {
      const p: P = [x, 40 + dy + Math.sin((x + dy * 2) / 9) * 6]
      if (prev) thick(r, prev, p, c, w)
      prev = p
    }
  }
  r.outline('k', ['t1', 't2', 't3'])
  feather(r, [12, 34], [52, 18], 10, ['m3', 'm4', 'a4'], 'a1')
  r.outline('k', ['t1', 't2', 't3'])
  for (const [x, y] of [[54, 8], [8, 18], [30, 10]] as const) sparkle(r, x, y, 2, 't4', 'a4')
})

// Ten Thousand Feathers: a sky-blue cloud, white feathers falling from it thick as arrows
icon('falling-feathers', (r) => {
  cloud(r, [[16, 12, 10], [32, 9, 12], [48, 12, 10], [24, 16, 9], [40, 16, 9]], ['a1', 'a2', 'a3'])
  r.outline('k')
  for (const [x, y, lean] of [[10, 30, 2], [22, 38, -2], [34, 28, 2], [46, 36, -2], [56, 26, 2], [16, 52, -2], [30, 56, 2], [44, 54, -2], [54, 48, 2]] as const) feather(r, [x - lean, y - 10], [x + lean, y + 2], 5, ['m3', 'm4', 'a4'], 'a1')
  r.outline('k', ['a1', 'a2', 'a3'])
  for (const [x, y] of [[4, 44], [60, 60]] as const) sparkle(r, x, y, 2, 'a4')
})

// Sky Walker: a boot's prints climbing white clouds like steps, each print glowing, a star at the top
icon('sky-walker', (r) => {
  for (const [x, y, s] of [[14, 52, 9], [30, 40, 9], [46, 28, 9]] as const) {
    cloud(r, [[x - 6, y, s * 0.7], [x + 2, y - 2, s], [x + 10, y, s * 0.7]], ['a2', 'a3', 'a4'])
  }
  r.outline('k')
  for (const [x, y] of [[16, 47], [32, 35], [48, 23]] as const) {
    r.ellipse(x, y, 4, 2, 'g3')
    r.ellipse(x - 5, y + 1, 1.8, 1.2, 'g3')
  }
  r.outline('k', ['a2', 'a3', 'a4'])
  star4(r, 54, 10, 7, 'y2', 'c3')
  r.outline('k', ['a2', 'a3', 'a4', 'g3'])
})

// ================================================================== the first tree, deeper: the ranger's green and wood

// Volley: three arrows arcing up and over together, green fletched
icon('volley', (r) => {
  for (const [dy, c] of [[0, 'p1'], [8, 'p1'], [16, 'p1']] as const) arc(r, 34, 56 + dy, 28, 200, 300, c, 1)
  r.outline('k', ['p1'])
  for (const [nock, point] of [[[8, 40], [46, 14]], [[12, 48], [52, 22]], [[16, 56], [58, 30]]] as [P, P][]) arrow(r, nock, point, 4, ['p2', 'p3'])
  r.outline('k', ['p1'])
  for (const [x, y] of [[50, 10], [58, 20]] as const) sparkle(r, x, y, 2, 'p3', 's4')
})

// Disengage: a green arc of a leap going back, an arrow flying forward, a splash of mud below
icon('disengage', (r) => {
  // the mud
  r.ellipse(40, 54, 18, 6, 'd1')
  r.ellipse(40, 53, 14, 4, 'd2')
  for (const [x, y] of [[28, 46], [52, 44], [44, 42]] as const) r.ellipse(x, y, 2, 2, 'd3')
  r.outline('k')
  // the leap back: a curved arrow over to the left
  arc(r, 32, 40, 22, 200, 340, 'p2', 4)
  arc(r, 32, 40, 22, 210, 300, 'p3', 1)
  r.poly([[6, 44], [14, 34], [2, 32]], 'p2')
  r.outline('k')
  arrow(r, [26, 30], [60, 30], 4, ['p2', 'p3'])
  r.outline('k')
})

// Keen Arrows: an arrowhead drawn along a whetstone, sparks flying
icon('keen-arrows', (r) => {
  r.poly([[6, 46], [42, 38], [46, 46], [10, 56]], 'm2')
  r.poly([[8, 46], [42, 39], [43, 42], [9, 50]], 'm3')
  r.outline('k')
  r.poly([[30, 34], [56, 12], [46, 30]], 's2')
  r.poly([[30, 34], [56, 12], [40, 22]], 's3')
  r.line(31, 33, 55, 13, 's4')
  thick(r, [30, 34], [22, 40], 'w2', 2)
  r.outline('k')
  for (const [x, y] of [[24, 30], [18, 26], [28, 22]] as const) star(r, x, y, 3, 'f3', 'f4')
  r.outline('k', ['m2'])
})

// Fleet Foot: footprints in the dust running off to the right, wind streaking past them
icon('fleet-foot', (r) => {
  const foot = (x: number, y: number) => {
    // the sole, the heel, five toes in an arc
    r.poly([[x - 4, y - 6], [x + 4, y - 7], [x + 5, y + 2], [x + 2, y + 6], [x - 3, y + 6], [x - 5, y]], 'd2')
    r.ellipse(x - 0.5, y + 10, 3.5, 3, 'd2')
    r.poly([[x - 3, y - 4], [x + 2, y - 5], [x + 3, y + 1], [x - 2, y + 3]], 'd3')
    for (const [dx, dy, rad] of [[-4, -11, 1.7], [-1, -13, 1.9], [2, -12.5, 1.6], [4.5, -11, 1.4], [6, -8.5, 1.2]] as const) r.ellipse(x + dx, y + dy, rad, rad, 'd2')
  }
  foot(14, 46)
  foot(32, 30)
  foot(50, 44)
  r.outline('k')
  streaks(r, [[2, 18, 12], [18, 8, 14], [24, 58, 14], [44, 22, 10]], ['t3', 't2', 't3', 't2'])
  for (const [x, y] of [[58, 30], [6, 34]] as const) sparkle(r, x, y, 2, 'p3', 's4')
})

// ----------------------------------------------------------------

const DIR = 'skills'
for (const [id, r] of Object.entries(out)) writeAtlas(`${DIR}/${id}.png`, [[r]], PAL)
console.log(`${Object.keys(out).length} ranger advancement icons → public/assets/lsw/${DIR}`)
