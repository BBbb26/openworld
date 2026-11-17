// The cleric's icons (2026-11-12, docs/advancement.md): the profession's own tree in gold and ivory over the cross's iron,
// the Paladin in holy white-gold and pale blue and its third the Evangelist, the Avenger in black, violet and crimson and
// its third the Sentence of Suffering (the Five Sufferings of docs/lore.md §4), the Inquisitor in iron, fire and blood and
// its third Doomsday; the paths' and thirds' entrances, and the profession's. 64x64, by code, in the look of
// skill-adv-ranger.ts and skill-adv-mage.ts: one bold emblem on a clear ground, a dark outline round it, three or four tones
// a colour, a few bright accents; a skill's mastery is its picture with a gold badge.
//
//   npx tsx games/openworld/tools/src/art/skill-adv-cleric.ts

import { Raster, writeAtlas, type Palette } from './raster.ts'

const PAL: Palette = {
  k: [30, 16, 18, 255],
  // iron and steel
  s1: [78, 84, 100, 255], s2: [138, 146, 162, 255], s3: [198, 205, 216, 255], s4: [246, 248, 252, 255],
  b1: [26, 24, 34, 255], b2: [52, 50, 66, 255], b3: [92, 90, 112, 255],
  // gold and ivory: the profession's own
  g1: [146, 92, 28, 255], g2: [212, 150, 50, 255], g3: [250, 208, 98, 255],
  y2: [250, 218, 60, 255], y3: [255, 250, 182, 255],
  c1: [196, 186, 160, 255], c2: [232, 224, 202, 255], c3: [252, 248, 236, 255],
  // the Paladin's holy light and pale blue
  h1: [236, 214, 140, 255], h2: [255, 236, 170, 255], h3: [255, 248, 214, 255], h4: [255, 255, 246, 255],
  l1: [92, 138, 198, 255], l2: [146, 186, 236, 255], l3: [200, 224, 252, 255], l4: [236, 246, 255, 255],
  // the mending's green
  p1: [44, 122, 64, 255], p2: [92, 190, 92, 255], p3: [170, 236, 140, 255],
  // the Avenger's dark: black-violet, violet, crimson
  v0: [22, 10, 26, 255], v1: [52, 22, 62, 255], v2: [98, 44, 120, 255], v3: [156, 96, 186, 255],
  x1: [96, 14, 30, 255], x2: [168, 28, 48, 255], x3: [230, 70, 84, 255], x4: [255, 150, 150, 255],
  // fire: the Inquisitor's
  f1: [176, 52, 22, 255], f2: [234, 110, 34, 255], f3: [255, 186, 66, 255], f4: [255, 240, 168, 255],
  r1: [104, 20, 20, 255], r2: [176, 36, 34, 255], r3: [226, 84, 64, 255],
  // wood, leather, rope, flesh
  w1: [80, 44, 26, 255], w2: [128, 78, 42, 255], w3: [178, 120, 70, 255],
  e1: [74, 50, 36, 255], e2: [116, 82, 54, 255], e3: [160, 118, 80, 255],
  o1: [112, 84, 50, 255], o2: [168, 132, 82, 255], o3: [214, 182, 128, 255],
  n1: [170, 112, 84, 255], n2: [216, 160, 124, 255], n3: [242, 202, 168, 255],
  // thorns
  t1: [52, 64, 30, 255], t2: [88, 106, 48, 255], t3: [132, 150, 76, 255],
  // night and stone
  q1: [34, 38, 66, 255], q2: [58, 66, 104, 255], q3: [96, 106, 150, 255],
  m1: [86, 86, 94, 255], m2: [136, 136, 146, 255], m3: [188, 188, 198, 255], m4: [230, 230, 236, 255],
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

function sparkle(r: Raster, x: number, y: number, s: number, c: string, core = c): void {
  r.line(x - s, y, x + s, y, c)
  r.line(x, y - s, x, y + s, c)
  r.set(x, y, core)
}

/** A critical's star: four long points round a white heart. */
function star4(r: Raster, x: number, y: number, s: number, c = 'y2', core = 'c3'): void {
  const pts = (k: number): P[] => [[x, y - s * k], [x + s * k * 0.26, y - s * k * 0.26], [x + s * k, y], [x + s * k * 0.26, y + s * k * 0.26], [x, y + s * k], [x - s * k * 0.26, y + s * k * 0.26], [x - s * k, y], [x - s * k * 0.26, y - s * k * 0.26]]
  r.poly(pts(1), c)
  r.poly(pts(0.5), core)
}

/** Rays round a point, from one radius out to another, every other one shorter. */
function rays(r: Raster, cx: number, cy: number, r0: number, r1: number, n: number, ramp: [string, string], a0 = 0, w = 1): void {
  for (let i = 0; i < n; i++) {
    const a = ((a0 + (i * 360) / n) * Math.PI) / 180
    const len = i % 2 ? r0 + (r1 - r0) * 0.6 : r1
    thick(r, [cx + Math.cos(a) * r0, cy + Math.sin(a) * r0], [cx + Math.cos(a) * len, cy + Math.sin(a) * len], ramp[i % 2], w)
  }
}

/** A Latin cross: its shaft from `top` down `h`, `t` thick, the arms a third of the way down; lit down its left edge. */
function cross(r: Raster, cx: number, top: number, h: number, t: number, ramp: [string, string, string?]): void {
  const arm = Math.round(h * 0.62)
  const ay = top + Math.round(h * 0.28)
  r.rect(cx - Math.floor(t / 2), top, t, h, ramp[0])
  r.rect(cx - Math.floor(arm / 2), ay, arm, t, ramp[0])
  r.rect(cx - Math.floor(t / 2), top, Math.max(1, Math.floor(t / 3)), h, ramp[1])
  r.rect(cx - Math.floor(arm / 2), ay, arm, Math.max(1, Math.floor(t / 3)), ramp[1])
  if (ramp[2]) r.set(cx - Math.floor(t / 2), ay, ramp[2])
}

/** A flame rising from its foot: outer, middle, core, each a tongue inside the last. */
function flame(r: Raster, x: number, base: number, h: number, w: number, ramp: [string, string, string]): void {
  const tongue = (k: number, c: string) => {
    const hw = w * k
    const hh = h * k
    r.poly([[x - hw, base - hh * 0.25], [x - hw * 0.8, base - hh * 0.62], [x - hw * 0.2, base - hh * 0.8], [x + hw * 0.15, base - hh], [x + hw * 0.35, base - hh * 0.72], [x + hw * 0.9, base - hh * 0.55], [x + hw, base - hh * 0.22], [x + hw * 0.6, base], [x - hw * 0.6, base]], c)
  }
  tongue(1, ramp[0])
  tongue(0.66, ramp[1])
  tongue(0.36, ramp[2])
}

/** A drop: a round foot drawn to a point above, lit at the left. */
function drop(r: Raster, x: number, y: number, s: number, c: string, lit?: string): void {
  r.ellipse(x, y, s, s, c)
  r.poly([[x - s * 0.9, y - s * 0.4], [x, y - s * 2.4], [x + s * 0.9, y - s * 0.4]], c)
  if (lit) r.set(x - s * 0.4, y - s * 0.3, lit)
}

/** A heart: two lobes and a point. */
function heart(r: Raster, cx: number, cy: number, s: number, ramp: [string, string, string?]): void {
  r.ellipse(cx - s * 0.5, cy - s * 0.2, s * 0.55, s * 0.55, ramp[0])
  r.ellipse(cx + s * 0.5, cy - s * 0.2, s * 0.55, s * 0.55, ramp[0])
  r.poly([[cx - s * 1.04, cy - s * 0.05], [cx + s * 1.04, cy - s * 0.05], [cx, cy + s * 1.05]], ramp[0])
  r.ellipse(cx - s * 0.55, cy - s * 0.3, s * 0.3, s * 0.3, ramp[1])
  if (ramp[2]) r.set(cx - s * 0.65, cy - s * 0.45, ramp[2])
}

/** A chain of links along a line, each an upright ring and a flat one in turn. */
function chain(r: Raster, a: P, b: P, ramp: [string, string], link = 4): void {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1])
  const n = Math.max(1, Math.floor(len / (link * 1.4)))
  for (let i = 0; i <= n; i++) {
    const x = a[0] + ((b[0] - a[0]) * i) / n
    const y = a[1] + ((b[1] - a[1]) * i) / n
    if (i % 2) r.ellipse(x, y, link * 0.55, link * 0.9, ramp[0])
    else r.ellipse(x, y, link * 0.9, link * 0.55, ramp[0])
    r.set(x - 1, y - 1, ramp[1])
  }
}

/** A robed figure: a head, a hood and a robe flaring to the ground. */
function figure(r: Raster, x: number, base: number, h: number, robe: [string, string], skin = 'n2'): void {
  const head = h * 0.16
  r.poly([[x - h * 0.28, base], [x - h * 0.16, base - h * 0.62], [x, base - h * 0.74], [x + h * 0.16, base - h * 0.62], [x + h * 0.28, base]], robe[0])
  r.poly([[x - h * 0.2, base], [x - h * 0.1, base - h * 0.6], [x, base - h * 0.7], [x - h * 0.02, base]], robe[1])
  r.ellipse(x, base - h * 0.78, head, head, robe[0])
  r.ellipse(x, base - h * 0.76, head * 0.6, head * 0.62, skin)
}

/** A dove in flight, its wings raised: a white body, a lit edge to each wing. */
function dove(r: Raster, x: number, y: number, s: number, ramp: [string, string, string] = ['m4', 'c3', 'h4']): void {
  for (const sx of [-1, 1]) {
    r.poly([[x, y], [x + sx * 2 * s, y - 5 * s], [x + sx * 6 * s, y - 7 * s], [x + sx * 8 * s, y - 4 * s], [x + sx * 4 * s, y - 1 * s], [x + sx * 1 * s, y + 1 * s]], ramp[0])
    r.line(x + sx * 2 * s, y - 4.6 * s, x + sx * 6 * s, y - 6.6 * s, ramp[2])
  }
  r.ellipse(x, y + 0.5 * s, 1.6 * s, 2.4 * s, ramp[1])
  r.poly([[x - 1.2 * s, y + 2.5 * s], [x + 1.2 * s, y + 2.5 * s], [x, y + 5 * s]], ramp[0])
  r.set(x, y - 1.8 * s, 'b1')
}

/** An open book: two pages leaning from the spine, lines of text on each. */
function book(r: Raster, cx: number, cy: number, w: number, h: number, cover: string, page: [string, string], text: string): void {
  r.poly([[cx - w - 2, cy - h * 0.4], [cx, cy - h * 0.25], [cx + w + 2, cy - h * 0.4], [cx + w + 2, cy + h * 0.6 + 2], [cx, cy + h * 0.75 + 2], [cx - w - 2, cy + h * 0.6 + 2]], cover)
  r.poly([[cx - w, cy - h * 0.5], [cx, cy - h * 0.35], [cx, cy + h * 0.7], [cx - w, cy + h * 0.55]], page[1])
  r.poly([[cx + w, cy - h * 0.5], [cx, cy - h * 0.35], [cx, cy + h * 0.7], [cx + w, cy + h * 0.55]], page[0])
  for (let i = 0; i < 4; i++) {
    const y = cy - h * 0.25 + i * h * 0.22
    r.line(cx - w + 3, y, cx - 3, y + h * 0.1, text)
    r.line(cx + 3, y + h * 0.1, cx + w - 3, y, text)
  }
}

/** A sword point down: its blade from the hilt to the point, a cross-guard, a grip and a pommel. */
function sword(r: Raster, hilt: P, point: P, w: number, blade: [string, string], guard: [string, string]): void {
  const len = Math.hypot(point[0] - hilt[0], point[1] - hilt[1])
  const d: P = [(point[0] - hilt[0]) / len, (point[1] - hilt[1]) / len]
  const n: P = [-d[1], d[0]]
  const near: P = [point[0] - d[0] * w * 2, point[1] - d[1] * w * 2]
  r.poly([[hilt[0] + n[0] * w, hilt[1] + n[1] * w], [near[0] + n[0] * w, near[1] + n[1] * w], point, [near[0] - n[0] * w, near[1] - n[1] * w], [hilt[0] - n[0] * w, hilt[1] - n[1] * w]], blade[0])
  r.line(hilt[0], hilt[1], point[0], point[1], blade[1])
  const g = w * 2.6
  thick(r, [hilt[0] + n[0] * g, hilt[1] + n[1] * g], [hilt[0] - n[0] * g, hilt[1] - n[1] * g], guard[0], 3)
  thick(r, hilt, [hilt[0] - d[0] * 7, hilt[1] - d[1] * 7], 'w2', 3)
  r.ellipse(hilt[0] - d[0] * 9, hilt[1] - d[1] * 9, 2.2, 2.2, guard[1])
}

/** A skull: the dome, the eyes and the nose, the teeth. */
function skull(r: Raster, cx: number, cy: number, s: number, ramp: [string, string, string] = ['c1', 'c2', 'c3'], eye = 'b1'): void {
  r.ellipse(cx, cy, s, s * 0.92, ramp[0])
  r.ellipse(cx - s * 0.1, cy - s * 0.12, s * 0.82, s * 0.74, ramp[1])
  r.ellipse(cx - s * 0.35, cy - s * 0.38, s * 0.3, s * 0.24, ramp[2])
  r.rect(cx - s * 0.55, cy + s * 0.55, s * 1.1, s * 0.5, ramp[0])
  r.ellipse(cx - s * 0.38, cy + s * 0.08, s * 0.24, s * 0.26, eye)
  r.ellipse(cx + s * 0.38, cy + s * 0.08, s * 0.24, s * 0.26, eye)
  r.poly([[cx, cy + s * 0.3], [cx - s * 0.12, cy + s * 0.5], [cx + s * 0.12, cy + s * 0.5]], eye)
  for (let i = -2; i <= 2; i++) r.line(cx + i * s * 0.22, cy + s * 0.62, cx + i * s * 0.22, cy + s * 1, eye)
}

/** An hourglass: two frames, the glass, the sand above and below. */
function hourglass(r: Raster, cx: number, cy: number, h: number, frame: [string, string], glass: string, sand: string, left = 0.4): void {
  const w = h * 0.38
  r.poly([[cx - w, cy - h * 0.42], [cx + w, cy - h * 0.42], [cx + 1, cy], [cx + w, cy + h * 0.42], [cx - w, cy + h * 0.42], [cx - 1, cy]], glass)
  const top = cy - h * 0.42 * left
  r.poly([[cx - w * left, top], [cx + w * left, top], [cx + 1, cy - 1], [cx - 1, cy - 1]], sand)
  r.poly([[cx - w * 0.8, cy + h * 0.42], [cx + w * 0.8, cy + h * 0.42], [cx, cy + h * 0.42 * (1 - left) * 0.6]], sand)
  r.line(cx, cy, cx, cy + h * 0.3, sand)
  for (const y of [cy - h * 0.5, cy + h * 0.42]) {
    r.rect(cx - w - 3, y, w * 2 + 6, h * 0.08, frame[0])
    r.rect(cx - w - 3, y, w * 2 + 6, 1, frame[1])
  }
  r.rect(cx - w - 3, cy - h * 0.5, 2, h * 1, frame[0])
  r.rect(cx + w + 1, cy - h * 0.5, 2, h * 1, frame[0])
}

/** A halo: a ring seen a little from above. */
function halo(r: Raster, cx: number, cy: number, rx: number, ry: number, c: string, lit: string): void {
  r.ellipse(cx, cy, rx, ry, c)
  r.ellipse(cx, cy, rx - 2.5, ry - 1.6, '_')
  r.px.forEach((v, i) => v === '_' && (r.px[i] = null))
  arc(r, cx, cy, rx - 0.5, 200, 260, lit, 1)
}

/** A cloud of puffs, dark below and light above. */
function cloud(r: Raster, puffs: [number, number, number][], ramp: [string, string, string]): void {
  for (const [x, y, s] of puffs) r.ellipse(x, y, s, s * 0.85, ramp[0])
  for (const [x, y, s] of puffs) r.ellipse(x - s * 0.1, y - s * 0.18, s * 0.8, s * 0.62, ramp[1])
  for (const [x, y, s] of puffs) r.ellipse(x - s * 0.3, y - s * 0.38, s * 0.38, s * 0.28, ramp[2])
}

/** A ring of thorns: a twisted band of briar, thorns standing out of it. */
function thornRing(r: Raster, cx: number, cy: number, rx: number, ry: number, ramp: [string, string, string]): void {
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2
    const x = cx + Math.cos(a) * rx
    const y = cy + Math.sin(a) * ry
    r.ellipse(x, y, 2.2, 1.6, i % 3 ? ramp[0] : ramp[1])
  }
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + 0.2
    const x = cx + Math.cos(a) * rx
    const y = cy + Math.sin(a) * ry
    const ox = Math.cos(a + 0.9) * 5
    const oy = Math.sin(a + 0.9) * 4
    r.poly([[x - 1, y], [x + ox, y + oy], [x + 1, y + 1]], ramp[2])
  }
}

/** A nail, its head and its square shank, point down. */
function nail(r: Raster, head: P, point: P, ramp: [string, string, string]): void {
  thick(r, head, point, ramp[0], 3)
  r.line(head[0] - 1, head[1], point[0] - 1, point[1] - 1, ramp[1])
  const d: P = [point[0] - head[0], point[1] - head[1]]
  const len = Math.hypot(d[0], d[1])
  const n: P = [-d[1] / len, d[0] / len]
  thick(r, [head[0] + n[0] * 4, head[1] + n[1] * 4], [head[0] - n[0] * 4, head[1] - n[1] * 4], ramp[2], 3)
}

/** A sun eclipsed: its corona of rays, the dark disc over it, a rim of light. */
function eclipse(r: Raster, cx: number, cy: number, rad: number, corona: [string, string], disc: string, rim: string): void {
  rays(r, cx, cy, rad + 1, rad + 9, 16, corona, 0, 2)
  r.ellipse(cx, cy, rad + 2, rad + 2, corona[0])
  r.ellipse(cx, cy, rad + 0.5, rad + 0.5, rim)
  r.ellipse(cx + 1, cy - 1, rad - 1, rad - 1, disc)
}

const out: Record<string, Raster> = {}
const icon = (id: string, draw: (r: Raster) => void) => {
  const r = new Raster(S, S)
  draw(r)
  out[id] = r
}

/** Another icon's picture under this one (a mastery's badge goes over its skill's). */
const copy = (r: Raster, from: string) => out[from].px.forEach((c, i) => (r.px[i] = c))

/** A path's medallion: a round plate in the path's colours, a gold rim with four studs (as the mage's and the ranger's). */
function medallion(r: Raster, ramp: Ramp, rim: [string, string, string] = ['g1', 'g2', 'g3']): void {
  r.ellipse(32, 32, 25, 25, rim[0])
  r.ellipse(32, 32, 23, 23, rim[1])
  arc(r, 32, 32, 23, 190, 260, rim[2], 2)
  r.ellipse(32, 32, 19, 19, ramp[0])
  r.ellipse(31, 31, 17, 17, ramp[1])
  r.ellipse(29, 29, 10, 10, ramp[2])
  for (const a of [45, 135, 225, 315]) r.ellipse(32 + Math.cos((a * Math.PI) / 180) * 23, 32 + Math.sin((a * Math.PI) / 180) * 23, 1.6, 1.6, rim[2])
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
/** A layer drawn and outlined on its own, then laid over (so it stands out against what is under it). */
function layer(r: Raster, draw: (l: Raster) => void, skip: string[] = []): void {
  const l = new Raster(S, S)
  draw(l)
  l.outline('k', skip)
  l.px.forEach((c, i) => c && (r.px[i] = c))
}

const IRON: [string, string, string] = ['s1', 's3', 's4']
const GILT: [string, string, string] = ['g2', 'g3', 'y3']

// ================================================================== the profession and its own tree: gold and ivory over iron

// the profession: a cross of iron and gold on a gold-white medallion, a rosary looped round it
icon('cleric', (r) => {
  medallion(r, ['h1', 'h2', 'h3'])
  rays(r, 32, 28, 10, 18, 12, ['h4', 'h3'])
  cross(r, 32, 10, 40, 6, ['g2', 'g3', 'y3'])
  r.outline('k', ['h4', 'h3'])
  // the rosary: beads on a loop round the foot of the cross
  for (let i = 0; i < 14; i++) {
    const a = Math.PI * 0.15 + (i / 13) * Math.PI * 0.7
    r.ellipse(32 + Math.cos(a) * 16, 34 + Math.sin(a) * 14, 1.8, 1.8, i % 2 ? 'w3' : 'w2')
  }
  r.outline('k', ['h4', 'h3', 'h2', 'h1'])
})

// Faith: an iron cross against a gold halo, a drop of blood rising to it
icon('faith', (r) => {
  halo(r, 32, 18, 14, 5, 'g2', 'y3')
  cross(r, 32, 12, 44, 7, IRON)
  r.outline('k')
  drop(r, 48, 46, 3, 'x2', 'x4')
  r.outline('k', ['g2', 'y3'])
  for (const [x, y] of [[14, 30], [50, 24]] as const) sparkle(r, x, y, 2, 'g3', 'y3')
})

// Blessed Arms: the cross's light striking a skull
icon('blessed-arms', (r) => {
  skull(r, 40, 42, 12)
  r.outline('k')
  layer(r, (l) => {
    cross(l, 20, 6, 36, 6, GILT)
  })
  rays(r, 20, 17, 7, 14, 8, ['y3', 'g3'])
  for (const [x, y] of [[34, 22], [52, 30], [28, 56]] as const) sparkle(r, x, y, 2, 'y3', 'c3')
})

// Zeal: the cross swung, streaks of its speed behind it, a critical's star
icon('zeal', (r) => {
  for (const [y, len, c] of [[16, 16, 'g3'], [26, 22, 'g2'], [36, 14, 'g3']] as const) thick(r, [6, y], [6 + len, y], c, 2)
  layer(r, (l) => {
    cross(l, 38, 8, 42, 7, IRON)
  })
  star4(r, 50, 50, 8, 'y2', 'c3')
  r.outline('k', ['g2', 'g3'])
})

// Devotion: a heart, a small cross on it, light round it
icon('devotion', (r) => {
  rays(r, 32, 32, 22, 28, 16, ['g3', 'y3'])
  heart(r, 32, 31, 16, ['x2', 'x3', 'x4'])
  r.outline('k', ['g3', 'y3'])
  cross(r, 32, 20, 18, 4, ['g3', 'y3'])
  r.outline('k', ['g3', 'y3', 'x2', 'x3', 'x4'])
})

// Steadfast: a cross planted in rock, unmoved
icon('steadfast', (r) => {
  r.poly([[6, 58], [12, 44], [24, 40], [40, 40], [54, 46], [58, 58]], 'm2')
  r.poly([[10, 54], [14, 46], [26, 43], [36, 43], [30, 52]], 'm3')
  r.outline('k')
  layer(r, (l) => cross(l, 32, 6, 38, 7, IRON))
  for (const x of [16, 46]) r.line(x, 50, x + 4, 56, 'm1')
})

// Holy Vessel: a gold chalice brimming with light
icon('holy-vessel', (r) => {
  rays(r, 32, 18, 8, 16, 10, ['y3', 'g3'], -90)
  r.poly([[16, 14], [48, 14], [44, 28], [36, 34], [28, 34], [20, 28]], 'g2')
  r.poly([[18, 15], [30, 15], [28, 30], [22, 27]], 'g3')
  r.ellipse(32, 14, 16, 3, 'h4')
  r.rect(30, 34, 4, 14, 'g2')
  r.rect(30, 34, 1, 14, 'g3')
  r.poly([[20, 56], [44, 56], [38, 48], [26, 48]], 'g1')
  r.poly([[22, 55], [30, 55], [30, 49], [27, 49]], 'g2')
  for (const x of [26, 32, 38]) r.ellipse(x, 22, 1.5, 1.5, x === 32 ? 'x3' : 'l2')
  r.outline('k', ['y3', 'g3'])
})

// Smite: the cross's head brought down, a burst where it lands
icon('smite', (r) => {
  layer(r, (l) => {
    // the cross, leaning into the blow
    thick(l, [12, 52], [40, 22], 's1', 6)
    thick(l, [12, 51], [39, 22], 's3', 2)
    thick(l, [26, 24], [42, 40], 's1', 6)
    thick(l, [26, 24], [41, 39], 's3', 2)
  })
  star4(r, 48, 16, 12, 'y2', 'c3')
  for (const [x, y] of [[56, 30], [38, 8], [58, 6]] as const) sparkle(r, x, y, 2, 'g3', 'y3')
  r.outline('k', ['g3', 'y3'])
})

// Prayer: hands pressed together, light and a green mending round them
icon('prayer', (r) => {
  rays(r, 32, 28, 18, 28, 14, ['h3', 'h2'], -90)
  layer(r, (l) => {
    for (const sx of [-1, 1]) {
      // a hand: the palm pressed to its fellow, the fingers rounded at the top, the thumb before it
      l.poly([[32, 8], [32 + sx * 5, 9], [32 + sx * 9, 14], [32 + sx * 11, 34], [32 + sx * 10, 46], [32, 48]], sx < 0 ? 'n3' : 'n2')
      for (const y of [16, 22, 28]) l.line(32 + sx * 4, y, 32 + sx * 9, y + 1, 'n1')
      l.ellipse(32 + sx * 6, 38, 3.5, 6, sx < 0 ? 'n2' : 'n1')
      l.poly([[32 + sx * 10, 44], [32 + sx * 14, 60], [32, 60], [32, 47]], sx < 0 ? 'l2' : 'l1')
    }
    l.line(32, 8, 32, 47, 'n1')
  }, ['h3', 'h2'])
  for (const [x, y] of [[12, 22], [52, 18], [50, 44], [14, 46]] as const) sparkle(r, x, y, 2, 'p3', 'c3')
})

// Consecrate: the ground hallowed, a cross of light on a gold square of it
icon('consecrate', (r) => {
  r.poly([[32, 30], [60, 44], [32, 58], [4, 44]], 'h1')
  r.poly([[32, 33], [55, 44], [32, 55], [9, 44]], 'h2')
  r.poly([[32, 38], [44, 44], [32, 50], [20, 44]], 'h3')
  r.outline('k')
  for (const x of [14, 50, 32]) for (let y = 44 - (x === 32 ? 30 : 18); y < 44; y += 2) r.set(x, y, 'h4')
  layer(r, (l) => cross(l, 32, 10, 24, 5, GILT))
  for (const [x, y] of [[10, 26], [54, 24], [22, 14]] as const) sparkle(r, x, y, 2, 'p3', 'h4')
})

// Rebuke: a wave of light from a raised cross, the foes round it brought to their knees
icon('rebuke', (r) => {
  arc(r, 32, 30, 22, 200, 340, 'h2', 2)
  arc(r, 32, 30, 16, 205, 335, 'h3', 2)
  layer(r, (l) => cross(l, 32, 12, 30, 5, GILT))
  for (const x of [10, 54]) {
    r.ellipse(x, 48, 4, 4, 'v2')
    r.poly([[x - 6, 60], [x - 4, 52], [x + 4, 52], [x + 6, 60]], 'v1')
  }
  r.outline('k', ['h2', 'h3'])
  for (const [x, y] of [[18, 40], [46, 40]] as const) sparkle(r, x, y, 2, 'y3', 'c3')
})

// Holy Light: a bolt of light flying right, the cross at its head
icon('holy-light', (r) => {
  r.poly([[4, 30], [44, 24], [56, 32], [44, 40], [4, 34]], 'h2')
  r.poly([[8, 31], [46, 27], [54, 32], [46, 37], [8, 33]], 'h3')
  r.line(10, 32, 52, 32, 'h4')
  ball(r, 50, 32, 7, ['g2', 'y3', 'c3'])
  r.outline('k')
  for (const [x, y] of [[14, 20], [26, 44], [36, 16]] as const) sparkle(r, x, y, 2, 'y3', 'c3')
})

// Blessing: light falling on two heads from above, motes of gold
icon('blessing', (r) => {
  r.poly([[22, 4], [42, 4], [56, 52], [8, 52]], 'h1')
  r.poly([[26, 4], [38, 4], [48, 52], [16, 52]], 'h2')
  for (const x of [20, 44]) figure(r, x, 60, 26, ['l1', 'l2'])
  r.outline('k', ['h1', 'h2'])
  for (const [x, y] of [[32, 14], [26, 26], [38, 30], [32, 40]] as const) sparkle(r, x, y, 2, 'g3', 'h4')
})

// Divine Wrath: a pillar of light out of a torn sky, striking the ground into a burst
icon('divine-wrath', (r) => {
  cloud(r, [[12, 10, 8], [26, 8, 9], [40, 9, 9], [52, 11, 7]], ['q1', 'q2', 'q3'])
  r.outline('k')
  r.poly([[26, 14], [38, 14], [42, 50], [22, 50]], 'h2')
  r.poly([[29, 14], [35, 14], [37, 50], [27, 50]], 'h4')
  ball(r, 32, 52, 9, ['g2', 'y3', 'c3'])
  rays(r, 32, 52, 9, 18, 10, ['y3', 'g3'], 180)
  r.outline('k', ['y3', 'g3'])
})

icon('smite-plus', (r) => (copy(r, 'smite'), badge(r)))
icon('prayer-plus', (r) => (copy(r, 'prayer'), badge(r)))
icon('consecrate-plus', (r) => (copy(r, 'consecrate'), badge(r)))
icon('rebuke-plus', (r) => (copy(r, 'rebuke'), badge(r)))
icon('holy-light-plus', (r) => (copy(r, 'holy-light'), badge(r)))

// Hymn: an open hymnal, notes rising off it
icon('hymn', (r) => {
  book(r, 32, 46, 20, 16, 'x1', ['c3', 'c2'], 'c1')
  r.outline('k')
  for (const [x, y, s] of [[16, 26, 1], [30, 16, 1.2], [46, 22, 1]] as const) {
    r.ellipse(x, y, 3.2 * s, 2.4 * s, 'g2')
    r.rect(x + 2 * s, y - 12 * s, 2, 12 * s, 'g2')
    r.rect(x + 2 * s, y - 12 * s, 5 * s, 2, 'g2')
  }
  r.outline('k', ['c1'])
  sparkle(r, 54, 10, 2, 'y3', 'c3')
})

// Penitence: a figure kneeling, head bowed, a small cross over them
icon('penitence', (r) => {
  r.poly([[14, 58], [18, 40], [28, 32], [38, 36], [42, 46], [52, 50], [54, 58]], 'm2')
  r.poly([[18, 56], [21, 42], [28, 36], [32, 40], [30, 56]], 'm3')
  r.ellipse(36, 30, 6, 6, 'm2')
  r.ellipse(34, 30, 3.5, 4, 'n2')
  r.outline('k')
  layer(r, (l) => cross(l, 40, 4, 18, 4, GILT))
  for (const [x, y] of [[24, 18], [54, 22]] as const) sparkle(r, x, y, 2, 'y3', 'c3')
})

// Vigil: a candle burning under a crescent moon
icon('vigil', (r) => {
  r.ellipse(48, 14, 9, 9, 'h3')
  r.ellipse(52, 11, 8, 8, '_')
  r.px.forEach((v, i) => v === '_' && (r.px[i] = null))
  r.outline('k')
  r.rect(24, 30, 14, 26, 'c2')
  r.rect(24, 30, 4, 26, 'c3')
  r.poly([[20, 58], [42, 58], [38, 54], [24, 54]], 'g1')
  r.line(31, 30, 31, 26, 'b1')
  r.outline('k')
  flame(r, 31, 26, 16, 6, ['f2', 'f3', 'f4'])
  r.outline('k')
  for (const [x, y] of [[12, 16], [56, 36]] as const) sparkle(r, x, y, 2, 'l3', 'c3')
})

// Sainthood: a halo over a crowned cross, wings of light
icon('sainthood', (r) => {
  for (const sx of [-1, 1]) {
    r.poly([[32, 34], [32 + sx * 26, 18], [32 + sx * 28, 28], [32 + sx * 20, 38], [32 + sx * 24, 44], [32 + sx * 10, 46]], 'h2')
    r.poly([[32, 36], [32 + sx * 22, 24], [32 + sx * 20, 34], [32 + sx * 8, 42]], 'h3')
  }
  r.outline('k')
  halo(r, 32, 12, 12, 4, 'g2', 'y3')
  layer(r, (l) => cross(l, 32, 16, 42, 7, GILT))
  for (const [x, y] of [[8, 50], [56, 50], [32, 4]] as const) sparkle(r, x, y, 2, 'y3', 'c3')
})

// Hammer of Heaven: a hammer of light falling out of the clouds onto the ground
icon('hammer-of-heaven', (r) => {
  cloud(r, [[16, 8, 6], [28, 6, 7], [40, 7, 7], [50, 9, 5]], ['m3', 'm4', 'c3'])
  r.outline('k')
  rays(r, 32, 56, 4, 12, 8, ['y3', 'g3'], 180)
  layer(r, (l) => {
    // the haft out of the cloud, the head of gold and light
    l.rect(30, 12, 5, 20, 'w2')
    l.rect(30, 12, 2, 20, 'w3')
    l.rect(14, 30, 36, 16, 'g1')
    l.rect(15, 31, 34, 14, 'g2')
    l.rect(15, 31, 34, 4, 'g3')
    l.rect(15, 31, 4, 14, 'y3')
    cross(l, 32, 34, 10, 2, ['y3', 'c3'])
  }, ['y3', 'g3'])
  r.poly([[10, 60], [54, 60], [46, 54], [18, 54]], 'g1')
  r.outline('k', ['y3', 'g3'])
  for (const [x, y] of [[8, 40], [56, 40]] as const) sparkle(r, x, y, 2, 'y3', 'c3')
})

// Ward of Light: a bubble of pale gold round a small cross
icon('ward-of-light', (r) => {
  r.ellipse(32, 32, 26, 26, 'h1')
  r.ellipse(32, 32, 23, 23, '_')
  r.px.forEach((v, i) => v === '_' && (r.px[i] = null))
  arc(r, 32, 32, 22, 200, 250, 'h4', 2)
  arc(r, 32, 32, 18, 210, 240, 'h3', 1)
  r.outline('k')
  layer(r, (l) => cross(l, 32, 18, 28, 5, GILT))
  for (const [x, y] of [[20, 44], [46, 22]] as const) sparkle(r, x, y, 2, 'y3', 'c3')
})

// Anointed: oil poured from a flask onto the cross, a drop falling
icon('anointed', (r) => {
  layer(r, (l) => cross(l, 20, 22, 38, 6, IRON))
  // the flask, tipped: a round body of ivory banded in gold, its neck pouring
  layer(r, (l) => {
    l.ellipse(46, 14, 10, 8, 'c1')
    l.ellipse(44, 12, 7, 5, 'c2')
    l.ellipse(42, 10, 3, 2, 'c3')
    l.line(38, 20, 54, 8, 'g2', 2)
    l.poly([[36, 16], [30, 22], [34, 24], [40, 20]], 'c1')
  })
  for (const [x, y, s2] of [[28, 26, 2.2], [24, 18, 1.8]] as const) drop(r, x, y, s2, 'y2', 'y3')
  r.outline('k', ['y2', 'y3'])
  star4(r, 46, 46, 9, 'y2', 'c3')
  r.outline('k', ['y2', 'c3', 's1', 's3', 's4', 'c1', 'c2', 'c3', 'g2'])
})

// Pious: a rosary of wood looped round, its small cross hanging, an hourglass's sand in the middle
icon('pious', (r) => {
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2
    r.ellipse(32 + Math.cos(a) * 20, 26 + Math.sin(a) * 18, 2.4, 2.4, i % 4 ? 'w2' : 'g2')
  }
  r.outline('k')
  hourglass(r, 32, 26, 20, ['w1', 'w3'], 'l4', 'g3', 0.3)
  r.outline('k', ['l4'])
  layer(r, (l) => {
    l.rect(31, 44, 2, 6, 'w2')
    cross(l, 32, 50, 12, 3, ['g2', 'g3'])
  })
})

// ================================================================== the Paladin: holy white-gold and pale blue

// the path's entrance: a cross shining on a shield of light, a healing glow round it
icon('path-paladin', (r) => {
  medallion(r, ['l1', 'l2', 'l3'])
  r.poly([[18, 16], [46, 16], [46, 34], [32, 50], [18, 34]], 'h2')
  r.poly([[20, 18], [32, 18], [32, 47], [20, 33]], 'h3')
  r.outline('k', ['l1', 'l2', 'l3'])
  cross(r, 32, 20, 24, 5, ['g2', 'g3', 'y3'])
  r.outline('k', ['l1', 'l2', 'l3', 'h2', 'h3'])
  for (const [x, y] of [[14, 44], [50, 44], [32, 10]] as const) sparkle(r, x, y, 2, 'p3', 'c3')
})

// Oath of Light: a hand raised in oath before a rising sun
icon('oath-of-light', (r) => {
  r.ellipse(32, 30, 22, 22, 'h1')
  r.ellipse(32, 30, 18, 18, 'h2')
  rays(r, 32, 30, 22, 29, 16, ['h3', 'h2'])
  r.outline('k', ['h3', 'h2'])
  layer(r, (l) => {
    // the palm out, four fingers up, the thumb aside, the sleeve below
    l.poly([[22, 40], [22, 22], [26, 20], [28, 22], [28, 18], [32, 16], [34, 18], [34, 20], [38, 18], [40, 22], [40, 26], [44, 30], [42, 34], [40, 42]], 'n2')
    for (const x of [25, 31, 37]) l.line(x, 22, x, 30, 'n1')
    l.poly([[22, 38], [40, 38], [44, 60], [18, 60]], 'l1')
    l.poly([[22, 40], [28, 40], [26, 60], [20, 60]], 'l2')
  })
})

// Healing Light: a cross of green-gold light (the mending's), rays and motes
icon('healing-light', (r) => {
  rays(r, 32, 32, 14, 28, 12, ['h3', 'p3'])
  r.rect(26, 10, 12, 44, 'p1')
  r.rect(10, 26, 44, 12, 'p1')
  r.rect(28, 12, 8, 40, 'p2')
  r.rect(12, 28, 40, 8, 'p2')
  r.rect(30, 14, 3, 36, 'p3')
  r.rect(14, 30, 36, 3, 'p3')
  r.outline('k', ['h3', 'p3'])
  for (const [x, y] of [[14, 14], [50, 50], [50, 14]] as const) sparkle(r, x, y, 2, 'h4', 'c3')
})

// Guardian Light: a beacon of light, red marks of the foes drawn in to it
icon('guardian-light', (r) => {
  r.ellipse(32, 30, 13, 13, 'h1')
  r.ellipse(32, 30, 10, 10, 'h3')
  r.ellipse(30, 28, 5, 5, 'h4')
  r.outline('k')
  layer(r, (l) => cross(l, 32, 20, 20, 4, GILT))
  for (const [x, y, dx, dy] of [[6, 30, 1, 0], [58, 30, -1, 0], [32, 58, 0, -1], [10, 52, 0.7, -0.7], [54, 52, -0.7, -0.7]] as const) {
    const tip: P = [x + dx * 8, y + dy * 8]
    r.poly([[x - dy * 4, y + dx * 4], tip, [x + dy * 4, y - dx * 4], [x + dx * 3, y + dy * 3]], 'x2')
  }
  r.outline('k', ['h1'])
})

// Renew (the Paladin's; its own picture, not Second Wind's): a sprig growing out of a ring of turning light
icon('cleric-renew', (r) => {
  arc(r, 32, 34, 22, 140, 400, 'h2', 3)
  r.poly([[52, 26], [58, 34], [50, 36]], 'h2')
  arc(r, 32, 34, 18, 150, 380, 'h3', 1)
  r.outline('k')
  layer(r, (l) => {
    l.line(32, 52, 32, 26, 'p1', 3)
    l.poly([[32, 34], [20, 26], [18, 18], [28, 22]], 'p2')
    l.poly([[32, 28], [44, 18], [48, 10], [38, 14]], 'p2')
    l.line(32, 33, 22, 24, 'p3')
    l.line(32, 27, 42, 16, 'p3')
  })
  for (const [x, y] of [[14, 50], [50, 50]] as const) sparkle(r, x, y, 2, 'h4', 'c3')
})

// Blessed Hands: two open hands, palms up, light lying in them
icon('blessed-hands', (r) => {
  rays(r, 32, 26, 6, 18, 10, ['h4', 'h3'], -90)
  ball(r, 32, 28, 6, ['h2', 'h3', 'h4'])
  for (const sx of [-1, 1]) {
    r.poly([[32 + sx * 2, 42], [32 + sx * 24, 34], [32 + sx * 28, 38], [32 + sx * 22, 46], [32 + sx * 6, 50]], 'n2')
    r.poly([[32 + sx * 6, 50], [32 + sx * 22, 46], [32 + sx * 24, 60], [32 + sx * 8, 60]], 'l1')
    r.line(32 + sx * 6, 43, 32 + sx * 22, 37, 'n3')
  }
  r.outline('k', ['h4', 'h3'])
})

// Radiant Blow: the cross's head ablaze with light, the blow landing
icon('radiant-blow', (r) => {
  rays(r, 40, 24, 10, 22, 12, ['h4', 'h3'])
  layer(r, (l) => {
    thick(l, [10, 56], [38, 28], 's1', 6)
    thick(l, [10, 55], [37, 28], 's3', 2)
    thick(l, [26, 22], [46, 40], 'g2', 7)
    thick(l, [27, 22], [45, 39], 'g3', 2)
  }, ['h4', 'h3'])
  ball(r, 40, 26, 5, ['h3', 'h4', 'c3'])
  for (const [x, y] of [[56, 12], [58, 44]] as const) sparkle(r, x, y, 2, 'y3', 'c3')
})

// Iron Faith: an iron heart, riveted, a gold cross set in it
icon('iron-faith', (r) => {
  heart(r, 32, 30, 20, ['s1', 's3', 's4'])
  for (const [x, y] of [[18, 22], [46, 22], [32, 50], [24, 40], [40, 40]] as const) r.ellipse(x, y, 1.4, 1.4, 's2')
  r.outline('k')
  cross(r, 32, 16, 24, 5, ['g2', 'g3', 'y3'])
  r.outline('k', ['s1', 's3', 's4', 's2'])
})

icon('healing-light-plus', (r) => (copy(r, 'healing-light'), badge(r)))

// Merciful: a hand cradling a small heart, a tear falling by it
icon('merciful', (r) => {
  heart(r, 30, 24, 10, ['x2', 'x3', 'x4'])
  r.outline('k')
  layer(r, (l) => {
    l.poly([[6, 40], [16, 36], [44, 38], [56, 30], [60, 34], [50, 46], [28, 52], [8, 50]], 'n2')
    l.line(12, 40, 44, 41, 'n3')
    l.poly([[4, 46], [10, 46], [12, 60], [2, 60]], 'l1')
  })
  drop(r, 50, 16, 3, 'l2', 'l4')
  r.outline('k', ['l2', 'l4'])
})

icon('radiant-blow-plus', (r) => (copy(r, 'radiant-blow'), badge(r)))

// Shining Armour: a breastplate shining, light rising off it
icon('shining-armour', (r) => {
  rays(r, 32, 32, 20, 29, 14, ['h3', 'h4'])
  r.poly([[14, 14], [24, 12], [32, 16], [40, 12], [50, 14], [52, 30], [46, 52], [32, 58], [18, 52], [12, 30]], 's2')
  r.poly([[16, 16], [24, 14], [30, 18], [30, 56], [20, 50], [14, 30]], 's3')
  r.line(32, 18, 32, 56, 's1')
  r.outline('k', ['h3', 'h4'])
  cross(r, 32, 24, 22, 4, ['g2', 'g3', 'y3'])
  r.outline('k', ['h3', 'h4', 's2', 's3', 's1'])
})

// Divine Intervention: two great wings of light folded round a white glow
icon('divine-intervention', (r) => {
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const a = (-80 + i * 22) * (Math.PI / 180)
      const x0 = 32 + sx * 6
      r.poly([[x0, 44], [x0 + sx * Math.cos(a) * 28, 36 + Math.sin(a) * 26], [x0 + sx * Math.cos(a + 0.3) * 24, 38 + Math.sin(a + 0.3) * 22]], i % 2 ? 'h2' : 'h3')
    }
  }
  r.outline('k')
  ball(r, 32, 38, 9, ['h2', 'h4', 'c3'])
  r.outline('k')
  halo(r, 32, 22, 9, 3, 'g2', 'y3')
  for (const [x, y] of [[10, 54], [54, 54], [32, 58]] as const) sparkle(r, x, y, 2, 'p3', 'h4')
})

// ================================================================== the Evangelist (the Paladin's third)

// the third's entrance: an open gospel giving out light, two doves rising
icon('mastery-paladin', (r) => {
  rays(r, 32, 36, 12, 28, 14, ['h3', 'h2'], 180)
  book(r, 32, 44, 18, 14, 'x1', ['c3', 'c2'], 'g2')
  r.outline('k', ['h3', 'h2'])
  for (const [x, y, s] of [[18, 20, 1.2], [44, 14, 1.1]] as const) layer(r, (l) => dove(l, x, y, s))
})

// Gospel: an open book, a cross of light on its page
icon('gospel', (r) => {
  book(r, 32, 36, 22, 22, 'x1', ['c3', 'c2'], 'c1')
  r.outline('k')
  cross(r, 20, 24, 18, 3, ['g2', 'g3'])
  cross(r, 44, 24, 18, 3, ['g2', 'g3'])
  rays(r, 32, 16, 4, 12, 8, ['y3', 'g3'], 180)
  r.outline('k', ['c1', 'y3', 'g3'])
})

// Call the Faithful: the church bell ringing, the call going out
icon('call-the-faithful', (r) => {
  r.rect(30, 6, 4, 6, 'w2')
  r.poly([[22, 16], [32, 10], [42, 16], [46, 40], [50, 46], [14, 46], [18, 40]], 'g2')
  r.poly([[24, 17], [32, 12], [32, 44], [18, 44], [21, 38]], 'g3')
  r.ellipse(32, 50, 4, 4, 'g1')
  r.outline('k')
  for (const [rad] of [[26], [32]] as const) {
    arc(r, 32, 30, rad, -40, 20, 'h3', 2)
    arc(r, 32, 30, rad, 160, 220, 'h3', 2)
  }
})

// Psalm: a harp, its strings sounding, notes rising
icon('psalm', (r) => {
  layer(r, (l) => {
    l.poly([[14, 58], [16, 10], [24, 8], [48, 30], [52, 58]], 'g2')
    l.poly([[20, 54], [21, 16], [44, 34], [46, 54]], '_')
    l.px.forEach((v, i) => v === '_' && (l.px[i] = null))
  })
  for (let i = 0; i < 5; i++) r.line(24 + i * 5, 18 + i * 4, 24 + i * 5, 54, 'h4')
  for (const [x, y] of [[50, 12], [58, 22]] as const) {
    r.ellipse(x, y, 2.8, 2.1, 'l2')
    r.rect(x + 2, y - 9, 1, 9, 'l2')
  }
  r.outline('k', ['h4'])
})

// Apostles: three of the faithful, hooded, haloed
icon('apostles', (r) => {
  for (const [x, h, c] of [[14, 30, 'e2'], [50, 30, 'e2'], [32, 38, 'e3']] as const) {
    figure(r, x, 60, h, [c === 'e3' ? 'e2' : 'e1', c])
  }
  r.outline('k')
  for (const [x, y] of [[14, 30], [50, 30], [32, 22]] as const) halo(r, x, y - 4, 6, 2, 'g2', 'y3')
  sparkle(r, 32, 6, 2, 'y3', 'c3')
})

icon('psalm-plus', (r) => (copy(r, 'psalm'), badge(r)))

// Gate of Heaven: an arched gate open on light, steps up to it, wings beside it
icon('gate-of-heaven', (r) => {
  cloud(r, [[8, 50, 7], [18, 54, 8], [46, 54, 8], [56, 50, 7]], ['m3', 'm4', 'c3'])
  r.poly([[16, 52], [16, 24], [20, 14], [32, 6], [44, 14], [48, 24], [48, 52]], 'g1')
  r.poly([[20, 52], [20, 25], [24, 17], [32, 11], [40, 17], [44, 25], [44, 52]], 'h4')
  r.poly([[24, 52], [24, 28], [32, 18], [40, 28], [40, 52]], 'h3')
  for (let i = 0; i < 3; i++) r.rect(24 - i * 2, 46 + i * 4, 16 + i * 4, 3, i % 2 ? 'c2' : 'c3')
  r.outline('k')
  for (const [x, y] of [[8, 22], [56, 22], [32, 2]] as const) sparkle(r, x, y, 2, 'y3', 'c3')
})

// Crown of Glory: a gold crown, radiant, a laurel round it
icon('crown-of-glory', (r) => {
  rays(r, 32, 30, 18, 28, 14, ['y3', 'g3'], 180)
  r.poly([[12, 46], [10, 22], [20, 32], [26, 16], [32, 28], [38, 16], [44, 32], [54, 22], [52, 46]], 'g2')
  r.poly([[13, 44], [12, 26], [20, 34], [26, 20], [28, 40]], 'g3')
  r.rect(12, 42, 40, 6, 'g1')
  for (const x of [20, 32, 44]) r.ellipse(x, 45, 2, 2, x === 32 ? 'x3' : 'l2')
  for (const [x, y] of [[10, 22], [26, 16], [38, 16], [54, 22]] as const) r.ellipse(x, y, 1.8, 1.8, 'y3')
  r.outline('k', ['y3', 'g3'])
  for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) r.ellipse(32 + sx * (8 + i * 6), 54 - i * 1.5, 3, 1.8, 'p2')
  r.outline('k', ['y3', 'g3', 'g1', 'g2'])
})

// ================================================================== the Avenger: black, violet, crimson

// the path's entrance: a black flame burning on a dark medallion, a scourge across it
icon('path-avenger', (r) => {
  medallion(r, ['x1', 'x2', 'x3'], ['v1', 'v2', 'v3'])
  flame(r, 32, 52, 36, 13, ['v0', 'v1', 'v3'])
  r.outline('k', ['x1', 'x2', 'x3'])
  // the scourge hanging at the foot, its tails curling up beside the flame
  layer(r, (l) => {
    thick(l, [16, 56], [16, 46], 'w2', 3)
    l.ellipse(16, 45, 2, 2, 'g1')
    for (const [ex, ey] of [[10, 30], [16, 26], [22, 30]] as const) {
      l.line(16, 45, (16 + ex) / 2 + (ex - 16) * 0.4, (45 + ey) / 2, 'e3', 1)
      l.line((16 + ex) / 2 + (ex - 16) * 0.4, (45 + ey) / 2, ex, ey, 'e3', 1)
      l.ellipse(ex, ey, 1.4, 1.4, 'x4')
    }
  }, ['x1', 'x2', 'x3', 'v0', 'v1', 'v3'])
  for (const [x, y] of [[46, 44], [48, 30]] as const) drop(r, x, y, 1.8, 'x4')
})

// Vengeance: a fist clenched in black flame, the blood on its knuckles
icon('vengeance', (r) => {
  flame(r, 32, 60, 56, 26, ['v1', 'v2', 'x2'])
  r.outline('k')
  layer(r, (l) => {
    l.poly([[18, 26], [44, 22], [48, 30], [46, 44], [38, 50], [24, 50], [16, 42]], 'n1')
    for (const x of [22, 29, 36, 43]) l.ellipse(x, 26, 3.6, 3.2, 'n2')
    l.poly([[16, 34], [24, 30], [26, 40], [18, 42]], 'n2')
    for (const x of [22, 29, 36]) l.line(x + 3, 24, x + 3, 30, 'n1')
    l.poly([[22, 50], [40, 50], [42, 62], [20, 62]], 'v0')
  })
  for (const [x, y] of [[22, 22], [36, 21]] as const) drop(r, x, y, 1.6, 'x3')
})

// Scourge: a whip of three knotted tails, blood flying from them
icon('scourge', (r) => {
  layer(r, (l) => {
    thick(l, [8, 56], [22, 40], 'w1', 5)
    thick(l, [9, 55], [21, 41], 'w3', 1)
    l.ellipse(23, 39, 3, 3, 'g1')
    for (const [ex, ey] of [[46, 8], [56, 22], [54, 40]] as const) {
      l.line(24, 38, (24 + ex) / 2 + 4, (38 + ey) / 2 + 4, 'e2', 2)
      l.line((24 + ex) / 2 + 4, (38 + ey) / 2 + 4, ex, ey, 'e2', 2)
      l.ellipse(ex, ey, 2.6, 2.6, 'e1')
    }
  })
  for (const [x, y] of [[40, 30], [48, 46], [34, 14], [58, 52]] as const) drop(r, x, y, 2, 'x2', 'x4')
  r.outline('k', ['x2', 'x4'])
})

// Black Flame: a flame of black and violet, its heart crimson
icon('black-flame', (r) => {
  flame(r, 32, 58, 54, 22, ['v0', 'v2', 'x2'])
  r.outline('k', ['v0'])
  for (const [x, y] of [[12, 20], [52, 14], [54, 40]] as const) sparkle(r, x, y, 2, 'v3', 'x4')
  r.poly([[24, 58], [40, 58], [36, 62], [28, 62]], 'v1')
})

// Wrath: a heart of crimson wreathed in black fire
icon('wrath', (r) => {
  for (const [x, h] of [[14, 40], [50, 44], [32, 58]] as const) flame(r, x, 60, h, 14, ['v1', 'v2', 'v3'])
  r.outline('k')
  layer(r, (l) => heart(l, 32, 38, 15, ['x2', 'x3', 'x4']))
  for (const [x, y] of [[26, 34], [40, 36]] as const) r.line(x - 3, y - 2, x + 3, y + 2, 'x1')
})

// Blood for Blood: two drops of blood turning one into the other, arrows round them
icon('blood-for-blood', (r) => {
  arc(r, 32, 32, 24, 200, 320, 'v2', 3)
  r.poly([[50, 14], [56, 22], [48, 24]], 'v2')
  arc(r, 32, 32, 24, 20, 140, 'v2', 3)
  r.poly([[14, 50], [8, 42], [16, 40]], 'v2')
  r.outline('k')
  drop(r, 22, 36, 8, 'x2', 'x4')
  drop(r, 42, 32, 8, 'x1', 'x3')
  r.outline('k', ['v2'])
})

// Torment: a spiked wheel turning, blood off its spikes
icon('torment', (r) => {
  r.ellipse(32, 32, 20, 20, 'w1')
  r.ellipse(32, 32, 16, 16, '_')
  r.px.forEach((v, i) => v === '_' && (r.px[i] = null))
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    thick(r, [32, 32], [32 + Math.cos(a) * 16, 32 + Math.sin(a) * 16], 'w2', 2)
    const x = 32 + Math.cos(a) * 20
    const y = 32 + Math.sin(a) * 20
    r.poly([[x + Math.cos(a + 1.4) * 3, y + Math.sin(a + 1.4) * 3], [32 + Math.cos(a) * 28, 32 + Math.sin(a) * 28], [x + Math.cos(a - 1.4) * 3, y + Math.sin(a - 1.4) * 3]], 's2')
  }
  ball(r, 32, 32, 5, ['s1', 's2', 's3'])
  r.outline('k')
  for (const [x, y] of [[54, 12], [10, 52], [56, 50]] as const) drop(r, x, y, 2, 'x2', 'x4')
  r.outline('k', ['x2', 'x4'])
})

// Shared Suffering: a scourge's tails and a black flame crossed, a drop of blood between them
icon('shared-suffering', (r) => {
  flame(r, 40, 56, 40, 14, ['v1', 'v2', 'x2'])
  r.outline('k')
  layer(r, (l) => {
    thick(l, [8, 54], [18, 42], 'w1', 4)
    for (const [ex, ey] of [[34, 10], [42, 18], [46, 30]] as const) l.line(18, 42, ex, ey, 'e2', 2)
  })
  drop(r, 26, 52, 4, 'x2', 'x4')
  r.outline('k', ['x2', 'x4'])
})

icon('wrath-plus', (r) => (copy(r, 'wrath'), badge(r)))

// An Eye for an Eye: an eye, crimson, a blow turned back on the one who struck
icon('eye-for-an-eye', (r) => {
  r.poly([[4, 30], [16, 20], [30, 16], [44, 20], [56, 30], [44, 40], [30, 44], [16, 40]], 'v1')
  r.poly([[8, 30], [18, 22], [30, 19], [42, 22], [52, 30], [42, 38], [30, 41], [18, 38]], 'c2')
  ball(r, 30, 30, 9, ['x1', 'x2', 'x3'])
  r.ellipse(30, 30, 3.5, 3.5, 'b1')
  r.outline('k')
  arc(r, 32, 30, 26, 40, 150, 'x3', 2)
  r.poly([[8, 46], [10, 38], [16, 44]], 'x3')
  r.outline('k', ['x3'])
})

icon('torment-plus', (r) => (copy(r, 'torment'), badge(r)))

// Dark Zeal: a critical's star in crimson, black fire behind it
icon('dark-zeal', (r) => {
  flame(r, 32, 58, 50, 22, ['v0', 'v1', 'v2'])
  r.outline('k', ['v0'])
  star4(r, 32, 30, 16, 'x2', 'x4')
  r.outline('k', ['v0', 'v1', 'v2'])
})

// Night of Wrath: a black sun, crimson fire bursting out round it
icon('night-of-wrath', (r) => {
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2
    flame(r, 32 + Math.cos(a) * 18, 32 + Math.sin(a) * 18 + 6, 14, 6, ['x1', 'x2', 'x3'])
  }
  r.ellipse(32, 32, 16, 16, 'x2')
  r.ellipse(32, 32, 13, 13, 'v0')
  arc(r, 32, 32, 13, 200, 250, 'v2', 1)
  r.outline('k')
  for (const [x, y] of [[6, 8], [58, 8], [6, 56], [58, 56]] as const) sparkle(r, x, y, 2, 'v3', 'x4')
})

// ================================================================== the Sentence of Suffering (the Avenger's third)

// the third's entrance: the crown of thorns, three nails and the lance crossed behind it (the Five Sufferings)
icon('mastery-avenger', (r) => {
  layer(r, (l) => {
    // the lance
    thick(l, [10, 58], [54, 8], 'w2', 3)
    l.poly([[50, 10], [58, 2], [56, 12]], 's3')
  })
  for (const [hx, hy, px, py] of [[16, 30, 26, 48], [32, 26, 32, 50], [48, 30, 38, 48]] as const) layer(r, (l) => nail(l, [hx, hy], [px, py], ['s1', 's3', 's2']))
  thornRing(r, 32, 30, 20, 9, ['t1', 't2', 't3'])
  r.outline('k')
  for (const [x, y] of [[20, 42], [44, 42]] as const) drop(r, x, y, 2, 'x2', 'x4')
  r.outline('k', ['x2', 'x4'])
})

// The Five Sufferings: five wounds round a dark cross, the stigmata
icon('five-sufferings', (r) => {
  cross(r, 32, 6, 52, 8, ['v1', 'v2', 'v3'])
  r.outline('k')
  for (const [x, y] of [[32, 14], [14, 24], [50, 24], [32, 32], [32, 54]] as const) {
    r.ellipse(x, y, 4, 4, 'x2')
    r.ellipse(x - 1, y - 1, 2, 2, 'x3')
  }
  r.outline('k', ['v1', 'v2', 'v3'])
  for (const [x, y] of [[10, 50], [54, 50]] as const) drop(r, x, y, 2, 'x2', 'x4')
})

// Crown of Thorns: a crown of briar, its thorns, the blood they draw
icon('thorn-crown', (r) => {
  thornRing(r, 32, 30, 22, 12, ['t1', 't2', 't3'])
  r.outline('k')
  for (const [x, y] of [[16, 46], [30, 50], [46, 46]] as const) drop(r, x, y, 2.5, 'x2', 'x4')
  r.outline('k', ['x2', 'x4'])
})

// Spear of Sorrow: a lance of dark light driven through, crimson where it goes in
icon('spear-of-sorrow', (r) => {
  layer(r, (l) => {
    thick(l, [6, 60], [46, 20], 'v1', 5)
    thick(l, [7, 59], [45, 20], 'v3', 1)
    l.poly([[42, 18], [60, 4], [48, 24]], 'v2')
    l.poly([[46, 18], [58, 6], [48, 20]], 'v3')
    thick(l, [36, 24], [44, 32], 'g1', 3)
  })
  star4(r, 52, 12, 7, 'x2', 'x4')
  for (const [x, y] of [[20, 30], [12, 40]] as const) sparkle(r, x, y, 2, 'v3', 'x4')
  r.outline('k', ['x2', 'x4'])
})

// Nail and Wood: a great nail driven into a beam
icon('nail-and-wood', (r) => {
  r.poly([[4, 40], [60, 30], [60, 46], [4, 56]], 'w2')
  r.poly([[4, 40], [60, 30], [60, 34], [4, 44]], 'w3')
  for (const x of [14, 30, 48]) r.line(x, 46 - x * 0.18, x + 8, 44 - x * 0.18, 'w1')
  r.outline('k')
  layer(r, (l) => nail(l, [30, 8], [32, 42], ['s1', 's3', 's2']))
  drop(r, 38, 52, 3, 'x2', 'x4')
  r.outline('k', ['x2', 'x4'])
})

icon('spear-of-sorrow-plus', (r) => (copy(r, 'spear-of-sorrow'), badge(r)))

// All Five at Once: a black sun, five lances of crimson driven out from it
icon('all-five', (r) => {
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i / 5) * Math.PI * 2
    const tip: P = [32 + Math.cos(a) * 30, 32 + Math.sin(a) * 30]
    const n: P = [-Math.sin(a), Math.cos(a)]
    r.poly([[32 + n[0] * 5, 32 + n[1] * 5], tip, [32 - n[0] * 5, 32 - n[1] * 5]], 'x2')
    r.line(32, 32, tip[0], tip[1], 'x3')
  }
  r.ellipse(32, 32, 12, 12, 'v1')
  r.ellipse(32, 32, 9, 9, 'v0')
  arc(r, 32, 32, 9, 200, 250, 'v3', 1)
  r.outline('k')
})

// Atonement: a drop of blood falling into a chalice, light rising out of it
icon('atonement', (r) => {
  rays(r, 32, 30, 10, 18, 10, ['y3', 'g3'], 180)
  r.poly([[18, 30], [46, 30], [42, 42], [34, 46], [30, 46], [22, 42]], 'g2')
  r.poly([[20, 31], [30, 31], [28, 44], [23, 41]], 'g3')
  r.ellipse(32, 30, 14, 2.5, 'x2')
  r.rect(30, 46, 4, 8, 'g2')
  r.poly([[22, 60], [42, 60], [38, 54], [26, 54]], 'g1')
  r.outline('k', ['y3', 'g3'])
  drop(r, 32, 18, 4, 'x2', 'x4')
  r.outline('k', ['y3', 'g3', 'g2', 'g1'])
})

// ================================================================== the Inquisitor: iron, fire, blood

// the path's entrance: a branding iron red-hot over a stake's flame, chains crossing behind
icon('path-inquisitor', (r) => {
  medallion(r, ['b1', 'b2', 'b3'], ['s1', 's2', 's3'])
  flame(r, 32, 52, 22, 12, ['f1', 'f2', 'f3'])
  r.outline('k', ['b1', 'b2', 'b3'])
  // the branding iron standing up out of the fire, its mark red-hot
  layer(r, (l) => {
    l.rect(31, 24, 3, 24, 's1')
    l.ellipse(32, 18, 8, 8, 'f1')
    l.ellipse(32, 18, 5.5, 5.5, '_')
    l.px.forEach((v, i) => v === '_' && (l.px[i] = null))
    l.rect(31, 11, 3, 14, 'f2')
    l.rect(25, 17, 15, 3, 'f2')
  }, ['b1', 'b2', 'b3', 'f1', 'f2', 'f3'])
  r.rect(32, 12, 1, 12, 'f4')
  r.rect(26, 18, 13, 1, 'f4')
  // the chains hanging from the rim
  chain(r, [14, 22], [20, 46], ['s2', 's3'], 3)
  chain(r, [50, 22], [44, 46], ['s2', 's3'], 3)
})

// Zealotry: a torch held high, its fire leaning
icon('zealotry', (r) => {
  layer(r, (l) => {
    thick(l, [22, 60], [32, 28], 'w1', 5)
    thick(l, [22, 59], [31, 29], 'w3', 1)
    l.poly([[26, 30], [38, 26], [40, 32], [28, 36]], 's1')
  })
  flame(r, 34, 28, 26, 12, ['f1', 'f2', 'f4'])
  r.outline('k')
  for (const [x, y] of [[14, 18], [52, 10], [52, 34]] as const) sparkle(r, x, y, 2, 'f3', 'f4')
})

// Brand the Heretic: a branding iron, its mark glowing red-hot
icon('brand-heretic', (r) => {
  layer(r, (l) => {
    thick(l, [6, 58], [34, 30], 's1', 3)
    thick(l, [6, 58], [14, 50], 'w2', 5)
    l.ellipse(40, 24, 12, 12, 'f1')
    l.ellipse(40, 24, 9, 9, '_')
    l.px.forEach((v, i) => v === '_' && (l.px[i] = null))
    l.rect(38, 14, 4, 20, 'f2')
    l.rect(30, 22, 20, 4, 'f2')
  })
  r.rect(39, 15, 2, 18, 'f4')
  r.rect(31, 23, 18, 2, 'f4')
  for (const [x, y] of [[54, 44], [26, 12]] as const) sparkle(r, x, y, 2, 'f3', 'f4')
})

// Burn the Heretic: fire rising from a pyre of logs
icon('burn-the-heretic', (r) => {
  flame(r, 32, 52, 46, 20, ['f1', 'f2', 'f4'])
  r.outline('k')
  layer(r, (l) => {
    thick(l, [8, 58], [56, 50], 'w1', 5)
    thick(l, [8, 50], [56, 58], 'w2', 5)
  })
})

// Shackles: two iron manacles on a chain
icon('shackles', (r) => {
  chain(r, [20, 32], [44, 32], ['s2', 's3'], 4)
  for (const x of [14, 50]) {
    r.ellipse(x, 40, 11, 11, 's1')
    r.ellipse(x, 40, 7, 7, '_')
    r.px.forEach((v, i) => v === '_' && (r.px[i] = null))
    arc(r, x, 40, 10, 200, 260, 's4', 1)
  }
  r.outline('k')
  for (const [x, y] of [[32, 12], [32, 56]] as const) sparkle(r, x, y, 2, 'f3', 'f4')
})

// Mark of Heresy: a burnt sigil on parchment, a critical's star over it
icon('mark-of-heresy', (r) => {
  r.poly([[8, 14], [52, 8], [56, 52], [12, 58]], 'o2')
  r.poly([[10, 16], [50, 10], [52, 18], [12, 22]], 'o3')
  r.outline('k')
  r.ellipse(32, 34, 10, 10, 'r1')
  r.ellipse(32, 34, 7, 7, 'o2')
  r.rect(31, 26, 2, 16, 'r1')
  r.rect(26, 31, 12, 2, 'r1')
  star4(r, 50, 50, 9, 'f3', 'f4')
  r.outline('k', ['o2', 'o3', 'r1'])
})

// Purging Flame: a ball of fire with a cross of light in it
icon('purging-flame', (r) => {
  for (const [x, y] of [[12, 52], [20, 58], [52, 54]] as const) r.ellipse(x, y, 4, 3, 'f2')
  ball(r, 32, 32, 20, ['f1', 'f2', 'f3', 'f4'])
  r.outline('k')
  cross(r, 32, 18, 28, 4, ['y3', 'c3'])
  r.outline('k', ['f1', 'f2', 'f3', 'f4'])
})

// The Stake: a wooden stake, fire about its foot
icon('the-stake', (r) => {
  layer(r, (l) => {
    l.rect(28, 4, 8, 54, 'w2')
    l.rect(28, 4, 3, 54, 'w3')
    l.rect(18, 18, 28, 5, 'w1')
  })
  chain(r, [26, 30], [38, 30], ['s2', 's3'], 3)
  for (const [x, h] of [[18, 22], [46, 24], [32, 18]] as const) flame(r, x, 62, h, 9, ['f1', 'f2', 'f4'])
  r.outline('k', ['s2', 's3'])
})

icon('shackles-plus', (r) => (copy(r, 'shackles'), badge(r)))

// Interrogation: a hooded inquisitor's face, the eyes lit from below by a candle
icon('interrogation', (r) => {
  r.poly([[12, 58], [16, 22], [32, 6], [48, 22], [52, 58]], 'b2')
  r.poly([[16, 56], [19, 24], [32, 10], [32, 56]], 'b3')
  r.ellipse(32, 34, 11, 13, 'b1')
  for (const x of [27, 37]) r.rect(x - 1, 31, 3, 2, 'f3')
  r.outline('k')
  layer(r, (l) => {
    l.rect(29, 50, 6, 10, 'c2')
    flame(l, 32, 50, 10, 4, ['f2', 'f3', 'f4'])
  })
})

icon('purging-flame-plus', (r) => (copy(r, 'purging-flame'), badge(r)))

// No Mercy: an executioner's axe, blood on its edge
icon('no-mercy', (r) => {
  layer(r, (l) => {
    thick(l, [10, 60], [40, 10], 'w1', 4)
    thick(l, [11, 59], [39, 11], 'w3', 1)
    l.poly([[34, 6], [60, 12], [58, 36], [40, 28], [30, 18]], 's2')
    l.poly([[36, 8], [58, 13], [57, 20], [36, 16]], 's3')
  })
  r.poly([[58, 22], [58, 36], [54, 33]], 'x2')
  drop(r, 52, 46, 2.5, 'x2', 'x4')
  r.outline('k', ['x2', 'x4'])
})

// Sentence: a judge's gavel brought down, a crimson strike where it lands
icon('sentence', (r) => {
  r.poly([[10, 56], [54, 56], [50, 50], [14, 50]], 'w1')
  r.outline('k')
  layer(r, (l) => {
    thick(l, [36, 46], [58, 22], 'w2', 4)
    l.poly([[12, 26], [26, 12], [42, 28], [28, 42]], 'w2')
    l.poly([[14, 26], [26, 14], [30, 18], [18, 30]], 'w3')
    thick(l, [20, 34], [34, 20], 'g2', 2)
  })
  star4(r, 22, 48, 9, 'x2', 'x4')
  r.outline('k', ['x2', 'x4'])
})

// ================================================================== Doomsday (the Inquisitor's third)

// the third's entrance: a sword of judgement point down under a red-gold eclipsed sun
icon('mastery-inquisitor', (r) => {
  eclipse(r, 32, 22, 12, ['f3', 'r2'], 'b1', 'f4')
  r.outline('k', ['f3', 'r2'])
  layer(r, (l) => sword(l, [32, 22], [32, 62], 3, ['s3', 's4'], ['g2', 'g3']))
})

// The Last Days: the eclipse alone, the light going red
icon('last-days', (r) => {
  eclipse(r, 32, 32, 16, ['r2', 'f3'], 'b1', 'f4')
  r.outline('k', ['r2', 'f3'])
  for (const [x, y] of [[8, 56], [56, 56]] as const) sparkle(r, x, y, 2, 'f3', 'f4')
})

// Doom: an hourglass, its sand red, running out
icon('doom', (r) => {
  hourglass(r, 32, 32, 48, ['w1', 'g2'], 'l4', 'r2', 0.35)
  r.outline('k')
  for (const [x, y] of [[8, 14], [56, 50]] as const) sparkle(r, x, y, 2, 'f3', 'f4')
})

// Confess: a figure forced to its knees, the weight of judgement pressing down
icon('confess', (r) => {
  for (const x of [16, 32, 48]) {
    thick(r, [x, 4], [x, 16], 'f3', 2)
    r.poly([[x - 4, 14], [x + 4, 14], [x, 20]], 'f3')
  }
  r.poly([[14, 60], [18, 44], [28, 36], [38, 40], [42, 50], [52, 54], [54, 60]], 'b2')
  r.poly([[18, 58], [21, 46], [28, 40], [32, 44], [30, 58]], 'b3')
  r.ellipse(34, 34, 6, 6, 'b2')
  r.ellipse(32, 34, 3.5, 4, 'n2')
  r.outline('k')
})

// Inevitable: Doom's hourglass, the badge of its mastery
icon('inevitable', (r) => (copy(r, 'doom'), badge(r)))
icon('confess-plus', (r) => (copy(r, 'confess'), badge(r)))

// The Last Judgement: the scales of judgement, a sword through their beam, red-gold light behind
icon('last-judgement', (r) => {
  rays(r, 32, 16, 8, 22, 14, ['f3', 'r2'])
  layer(r, (l) => {
    l.rect(31, 12, 3, 42, 'g1')
    l.rect(10, 16, 44, 3, 'g2')
    for (const x of [14, 50]) {
      l.line(x - 6, 36, x, 18, 'g3')
      l.line(x + 6, 36, x, 18, 'g3')
      l.ellipse(x, 38, 8, 3, 'g2')
    }
    l.poly([[22, 60], [42, 60], [38, 54], [26, 54]], 'g1')
  }, ['f3', 'r2'])
  layer(r, (l) => sword(l, [32, 6], [32, 50], 2.5, ['s3', 's4'], ['x2', 'x3']), ['g1', 'g2', 'g3', 'f3', 'r2'])
})

// Day of Wrath: a skull split by a falling sword, fire about it
icon('dies-irae', (r) => {
  for (const [x, h] of [[12, 22], [52, 24]] as const) flame(r, x, 62, h, 9, ['r1', 'r2', 'f3'])
  skull(r, 32, 40, 14)
  r.outline('k')
  layer(r, (l) => sword(l, [32, 4], [32, 44], 3, ['s3', 's4'], ['x2', 'x3']), ['c1', 'c2', 'c3'])
})

// ----------------------------------------------------------------

const DIR = 'skills'
for (const [id, r] of Object.entries(out)) writeAtlas(`${DIR}/${id}.png`, [[r]], PAL)
console.log(`${Object.keys(out).length} cleric icons → public/assets/lsw/${DIR}`)
