// The mage's advancement icons (docs/advancement.md; content advancement.ts): the three paths and each one's own third —
// the Cryomancer and Everwinter in ice blue and white, the Pyromancer and the Worldfire in fire orange and red, the
// Stormcaller in lightning yellow on violet and the Wrath of Heaven in heaven's gold and white —, the four new skills of
// the first tree in arcane blue, and the entrances (a medallion for each path, an emblem for each third). 64x64, by
// code, in the look of skill-actives.ts: one bold emblem on a clear ground, a dark outline round it, three or four tones
// a colour, a few bright accents; a mastery's picture is its skill's with a gold badge in the lower right.
//
//   npx tsx games/openworld/tools/src/art/skill-adv-mage.ts

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { OUT } from './png.ts'
import { Raster, writeAtlas, type Palette } from './raster.ts'

const PAL: Palette = {
  k: [40, 18, 14, 255],
  s1: [78, 84, 100, 255], s2: [138, 146, 162, 255], s3: [198, 205, 216, 255], s4: [246, 248, 252, 255],
  w1: [86, 46, 26, 255], w2: [136, 80, 42, 255], w3: [188, 124, 68, 255],
  g1: [146, 92, 28, 255], g2: [212, 150, 50, 255], g3: [250, 208, 98, 255],
  r1: [116, 28, 30, 255], r2: [188, 50, 44, 255], r3: [234, 98, 72, 255],
  f1: [196, 64, 28, 255], f2: [240, 126, 38, 255], f3: [255, 196, 76, 255], f4: [255, 242, 172, 255],
  v1: [56, 28, 86, 255], v2: [106, 58, 148, 255], v3: [168, 108, 210, 255], v4: [226, 192, 252, 255],
  i1: [46, 96, 158, 255], i2: [98, 168, 220, 255], i3: [170, 220, 246, 255], i4: [236, 250, 255, 255],
  m1: [86, 86, 94, 255], m2: [136, 136, 146, 255], m3: [188, 188, 198, 255], m4: [230, 230, 236, 255],
  y1: [198, 146, 28, 255], y2: [250, 218, 60, 255], y3: [255, 250, 182, 255],
  b1: [28, 28, 38, 255], b2: [58, 58, 74, 255], b3: [100, 100, 122, 255],
  e1: [78, 52, 38, 255], e2: [120, 84, 54, 255], e3: [166, 120, 80, 255],
  n1: [30, 54, 128, 255], n2: [56, 102, 200, 255], n3: [120, 168, 246, 255],
  // heaven's gold and ivory (the Wrath of Heaven)
  d1: [190, 128, 40, 255], d2: [236, 184, 72, 255], d3: [255, 226, 140, 255], d4: [255, 248, 222, 255],
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

/** A tongue of flame standing on (cx, by), w wide and h tall, leaning a little; its layers from the outer red to the white heart. */
function flame(r: Raster, cx: number, by: number, w: number, h: number, lean = 0, ramp: string[] = ['r2', 'f2', 'f3', 'f4']): void {
  const layer = (s: number, c: string) => {
    const W = w * s
    const H = h * s
    const L = lean * s
    r.poly(
      [
        [cx - W * 0.5, by - H * 0.22],
        [cx - W * 0.42, by - H * 0.5],
        [cx - W * 0.18 + L * 0.5, by - H * 0.72],
        [cx + L, by - H],
        [cx + W * 0.12 + L * 0.6, by - H * 0.74],
        [cx + W * 0.34 + L * 0.3, by - H * 0.6],
        [cx + W * 0.5, by - H * 0.3],
        [cx + W * 0.36, by - H * 0.04],
        [cx, by],
        [cx - W * 0.36, by - H * 0.04],
      ],
      c,
    )
  }
  ramp.forEach((c, i) => layer([1, 0.72, 0.48, 0.26][i], c))
}

/** A snowflake: three bars through its heart, each arm forked twice. */
function snowflake(r: Raster, cx: number, cy: number, rad: number, c: string, w = 2, tip = c): void {
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 - Math.PI / 2
    const end: P = [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]
    thick(r, [cx, cy], end, c, w)
    for (const t of [0.5, 0.78]) {
      const m: P = [cx + Math.cos(a) * rad * t, cy + Math.sin(a) * rad * t]
      for (const s of [-1, 1]) {
        const b = a + s * 0.75
        r.line(m[0], m[1], m[0] + Math.cos(b) * rad * 0.24, m[1] + Math.sin(b) * rad * 0.24, c)
      }
    }
    r.set(end[0], end[1], tip)
  }
}

/** A sun's rays round a centre: long and short by turns. */
function rays(r: Raster, cx: number, cy: number, inner: number, outer: number, n: number, c: string, w = 2, off = 0): void {
  for (let i = 0; i < n; i++) {
    const a = ((i + off) * 2 * Math.PI) / n
    const len = i % 2 ? outer * 0.78 : outer
    thick(r, [cx + Math.cos(a) * inner, cy + Math.sin(a) * inner], [cx + Math.cos(a) * len, cy + Math.sin(a) * len], c, w)
  }
}

/** A path's medallion: a round plate in the path's colours, a gold rim with four studs. */
function medallion(r: Raster, ramp: Ramp): void {
  r.ellipse(32, 32, 25, 25, 'g1')
  r.ellipse(32, 32, 23, 23, 'g2')
  arc(r, 32, 32, 23, 190, 260, 'g3', 2)
  r.ellipse(32, 32, 19, 19, ramp[0])
  r.ellipse(31, 31, 17, 17, ramp[1])
  r.ellipse(29, 29, 10, 10, ramp[2])
  for (const a of [45, 135, 225, 315]) {
    const x = 32 + Math.cos((a * Math.PI) / 180) * 23
    const y = 32 + Math.sin((a * Math.PI) / 180) * 23
    r.ellipse(x, y, 1.6, 1.6, 'g3')
  }
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

/** A bolt of lightning along its turns: its body, a bright core. */
function bolt(r: Raster, pts: P[], w = 3, body = 'y2', core = 'y3'): void {
  for (let i = 0; i + 1 < pts.length; i++) thick(r, pts[i], pts[i + 1], body, w)
  for (let i = 0; i + 1 < pts.length; i++) thick(r, pts[i], pts[i + 1], core, 1)
}

/** A cloud of puffs, dark below and light above. */
function cloud(r: Raster, puffs: [number, number, number][], ramp: [string, string, string]): void {
  for (const [x, y, s] of puffs) r.ellipse(x, y, s, s * 0.85, ramp[0])
  for (const [x, y, s] of puffs) r.ellipse(x - s * 0.1, y - s * 0.18, s * 0.8, s * 0.62, ramp[1])
  for (const [x, y, s] of puffs) r.ellipse(x - s * 0.3, y - s * 0.38, s * 0.38, s * 0.28, ramp[2])
}

/** A critical's star: four long points round a white heart. */
function star4(r: Raster, x: number, y: number, s: number, c = 'y2', core = 's4'): void {
  const pts = (k: number): P[] => [[x, y - s * k], [x + s * k * 0.26, y - s * k * 0.26], [x + s * k, y], [x + s * k * 0.26, y + s * k * 0.26], [x, y + s * k], [x - s * k * 0.26, y + s * k * 0.26], [x - s * k, y], [x - s * k * 0.26, y - s * k * 0.26]]
  r.poly(pts(1), c)
  r.poly(pts(0.5), core)
}

/** A heart's shape, s across from its middle. */
function heart(r: Raster, cx: number, cy: number, s: number, c: string): void {
  r.ellipse(cx - s * 0.5, cy - s * 0.25, s * 0.55, s * 0.55, c)
  r.ellipse(cx + s * 0.5, cy - s * 0.25, s * 0.55, s * 0.55, c)
  r.poly([[cx - s * 1.04, cy - s * 0.12], [cx + s * 1.04, cy - s * 0.12], [cx, cy + s * 1.15]], c)
}

/** A cloaked figure's silhouette: a head and a cloak widening to its feet, dark, its body, a rim of light. */
function figure(r: Raster, cx: number, top: number, h: number, ramp: [string, string, string]): void {
  const w = h * 0.34
  r.poly([[cx - w, top + h], [cx - w * 0.6, top + h * 0.32], [cx + w * 0.6, top + h * 0.32], [cx + w, top + h]], ramp[0])
  r.ellipse(cx, top + h * 0.17, h * 0.14, h * 0.15, ramp[0])
  r.poly([[cx - w * 0.8, top + h], [cx - w * 0.5, top + h * 0.36], [cx - w * 0.05, top + h * 0.34], [cx - w * 0.2, top + h]], ramp[1])
  r.ellipse(cx - h * 0.04, top + h * 0.15, h * 0.08, h * 0.09, ramp[1])
  r.line(cx - w * 0.6, top + h * 0.36, cx - w * 0.92, top + h - 1, ramp[2])
}

/** An ice spike standing out of the ground: its shaded face, its lit face, a white edge. */
function spike(r: Raster, x: number, base: number, w: number, h: number, lean = 0): void {
  r.poly([[x - w / 2, base], [x + lean, base - h], [x + w / 2, base]], 'i1')
  r.poly([[x - w / 2 + 1, base], [x + lean, base - h], [x + lean * 0.4 + 1, base]], 'i2')
  r.poly([[x - w / 2 + 1, base], [x + lean, base - h + 2], [x - w / 6 + lean * 0.3, base]], 'i3')
  r.line(x + lean, base - h, x + lean * 0.5 + 1, base - 2, 'i4')
}

/** Only where a mask raster is drawn: what `draw` paints, kept within it (a cap of ice on a world). */
function within(r: Raster, mask: (m: Raster) => void, draw: (t: Raster) => void): void {
  const m = new Raster(S, S)
  mask(m)
  const t = new Raster(S, S)
  draw(t)
  t.px.forEach((c, i) => c && m.px[i] && (r.px[i] = c))
}

const out: Record<string, Raster> = {}
const icon = (id: string, draw: (r: Raster) => void) => {
  const r = new Raster(S, S)
  draw(r)
  out[id] = r
}
/** Another icon's picture under this one (a mastery's badge goes over its skill's). */
const copy = (r: Raster, from: string) => out[from].px.forEach((c, i) => (r.px[i] = c))

// ---------------------------------------------------------------- the Pyromancer: fire

// Kindling: a twig of tinder, its tip caught, sparks leaping off it
icon('kindling', (r) => {
  thick(r, [12, 54], [38, 26], 'w1', 5)
  thick(r, [12, 53], [37, 26], 'w2', 3)
  r.line(13, 51, 36, 26, 'w3')
  // a knot and a split twig
  r.ellipse(22, 42, 2, 2, 'w1')
  thick(r, [26, 38], [20, 30], 'w2', 2)
  r.outline('k')
  flame(r, 41, 30, 18, 26, 3)
  r.outline('k', ['f3', 'f4'])
  for (const [x, y, s] of [[52, 12, 2], [56, 22, 1], [30, 10, 2], [48, 6, 1]] as const) sparkle(r, x, y, s, 'f3', 'f4')
})

// Flame Wall: a wall of three flames standing on a row of hot stones
icon('flame-wall', (r) => {
  r.poly([[4, 48], [60, 48], [58, 56], [6, 56]], 'e1')
  for (let x = 6; x < 58; x += 9) r.ellipse(x + 4, 51, 4, 3, 'e2')
  for (let x = 6; x < 58; x += 9) r.line(x + 2, 49, x + 5, 49, 'r2')
  r.outline('k')
  flame(r, 16, 49, 16, 30, -2)
  flame(r, 48, 49, 16, 30, 2)
  flame(r, 32, 49, 20, 42, 0)
  r.outline('k', ['f3', 'f4'])
  sparkle(r, 8, 14, 2, 'f3', 'f4')
  sparkle(r, 56, 10, 2, 'f3', 'f4')
})

// Combustion: an ember bursting, its shell flying apart round a white-hot heart
icon('combustion', (r) => {
  const star: P[] = []
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8
    const rad = i % 2 ? 11 : 24
    star.push([32 + Math.cos(a) * rad, 32 + Math.sin(a) * rad])
  }
  r.poly(star, 'r2')
  const inner = star.map(([x, y]): P => [32 + (x - 32) * 0.7, 32 + (y - 32) * 0.7])
  r.poly(inner, 'f2')
  ball(r, 32, 32, 8, ['f3', 'f3', 'f4', 's4'])
  r.outline('k')
  // the ember's shell flying off
  for (const [x, y, a] of [[8, 10, 0], [54, 12, 1], [10, 54, 1], [56, 52, 0]] as const) {
    r.poly([[x, y], [x + 5, y + (a ? -2 : 2)], [x + 3, y + 5]], 'e1')
    r.line(x + 1, y + 1, x + 3, y + 2, 'r2')
  }
  r.outline('k', ['f4', 's4'])
})

// Conflagration: fire running across the grass before the wind, low flames and high
icon('conflagration', (r) => {
  r.poly([[2, 52], [62, 52], [62, 58], [2, 58]], 'e2')
  for (let x = 4; x < 62; x += 5) r.line(x, 52, x + 2, 48, 'g1')
  r.outline('k')
  flame(r, 14, 53, 12, 18, 4)
  flame(r, 30, 53, 16, 30, 6)
  flame(r, 48, 53, 18, 42, 7)
  r.outline('k', ['f3', 'f4'])
  // the wind that drives it
  r.line(4, 22, 16, 22, 'm3')
  r.line(16, 22, 18, 20, 'm3')
  r.line(2, 28, 12, 28, 'm4')
  r.line(6, 34, 14, 34, 'm3')
})

// Ember Heart: a heart of glowing coal, cracked with fire
icon('ember-heart', (r) => {
  r.poly([[32, 54], [10, 32], [8, 22], [14, 13], [24, 12], [32, 20], [40, 12], [50, 13], [56, 22], [54, 32]], 'e1')
  r.poly([[32, 50], [13, 31], [12, 23], [16, 16], [24, 15], [32, 23], [40, 15], [48, 16], [52, 23], [51, 31]], 'b2')
  r.poly([[16, 18], [22, 16], [27, 20], [20, 24]], 'b3')
  // the cracks, alight
  thick(r, [32, 23], [30, 32], 'f2', 2)
  thick(r, [30, 32], [36, 38], 'f2', 2)
  thick(r, [36, 38], [32, 46], 'f2', 2)
  thick(r, [30, 32], [20, 30], 'f2', 2)
  thick(r, [36, 38], [46, 30], 'f2', 2)
  r.line(31, 26, 30, 31, 'f4')
  r.line(33, 39, 32, 44, 'f3')
  r.ellipse(33, 36, 3, 3, 'f3')
  r.set(33, 36, 'f4')
  r.outline('k')
  flame(r, 32, 14, 8, 10, 1, ['f2', 'f3', 'f4'])
  r.outline('k', ['f3', 'f4'])
})

// Inferno: fire raining in slanted drops on a burning ground
icon('inferno', (r) => {
  r.poly([[2, 54], [62, 54], [60, 60], [4, 60]], 'r1')
  r.outline('k')
  for (const [x, y, s] of [[12, 52, 0.7], [30, 53, 1], [50, 52, 0.8]] as const) flame(r, x, y, 14 * s, 18 * s, 0)
  // the falling drops of fire, each with a tail
  for (const [x, y, s] of [[18, 12, 1], [40, 8, 1.2], [52, 26, 0.9], [26, 30, 0.8]] as const) {
    const rad = 4.5 * s
    thick(r, [x - 9 * s, y - 9 * s], [x, y], 'f2', Math.max(2, Math.round(3 * s)))
    thick(r, [x - 12 * s, y - 12 * s], [x - 6 * s, y - 6 * s], 'r2', 2)
    ball(r, x, y, rad, ['r2', 'f2', 'f3', 'f4'])
  }
  r.outline('k', ['f3', 'f4'])
})

// The Pyromancer's medallion: a red plate, a flame
icon('path-pyromancer', (r) => {
  medallion(r, ['r1', 'r2', 'r3'])
  r.outline('k')
  flame(r, 32, 46, 20, 30, 1)
  r.outline('k', ['f3', 'f4'])
})

// Dragon's Breath: a red dragon's head, its jaws wide, a cone of fire roaring out of them
icon('dragons-breath', (r) => {
  r.poly([[24, 31], [60, 10], [62, 31], [59, 52]], 'r2')
  r.poly([[24, 31], [57, 16], [60, 31], [57, 46]], 'f2')
  r.poly([[24, 31], [53, 23], [56, 31], [53, 39]], 'f3')
  r.poly([[24, 31], [48, 28], [48, 34]], 'f4')
  r.outline('k', ['f3', 'f4'])
  // the head: the brow, the upper jaw, the lower jaw hung open
  r.poly([[2, 28], [5, 18], [14, 12], [24, 15], [31, 24], [26, 28], [12, 30]], 'r1')
  r.poly([[4, 26], [7, 19], [14, 15], [22, 17], [27, 23], [14, 26]], 'r2')
  r.line(8, 18, 20, 15, 'r3')
  r.poly([[4, 36], [14, 33], [29, 37], [23, 43], [12, 46], [4, 42]], 'r1')
  r.poly([[6, 37], [14, 35], [25, 38], [19, 41], [10, 43]], 'r2')
  // the horn swept back, the eye, the teeth
  r.poly([[10, 15], [2, 3], [7, 4], [17, 13]], 'm3')
  r.line(4, 4, 12, 13, 'm4')
  r.rect(15, 19, 3, 2, 'y2')
  r.set(16, 19, 'y3')
  for (const x of [19, 23, 27]) r.poly([[x, 27], [x + 2, 27], [x + 1, 31]], 's4')
  for (const x of [14, 18, 22]) r.poly([[x, 35], [x + 2, 35], [x + 1, 31]], 's4')
  r.outline('k', ['f3', 'f4'])
  sparkle(r, 50, 6, 2, 'f3', 'f4')
  sparkle(r, 48, 56, 2, 'f3', 'f4')
})

// Pyroblast: one great bolt of fire flying up and to the right, its round head white-hot, its flame streaming behind
icon('pyroblast', (r) => {
  // (the flame's shape turned to fly: its round foot the bolt's head, its point the tail)
  const turn = (pts: P[], cx: number, cy: number, a: number): P[] => pts.map(([x, y]) => [cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a), cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)])
  for (const [k, c] of [[1, 'r2'], [0.74, 'f2'], [0.5, 'f3'], [0.26, 'f4']] as const) {
    const W = 30 * k
    const H = 62 * k
    const flamePts: P[] = [[-W * 0.5, -H * 0.22], [-W * 0.42, -H * 0.5], [-W * 0.18, -H * 0.72], [0, -H], [W * 0.12, -H * 0.74], [W * 0.34, -H * 0.6], [W * 0.5, -H * 0.3], [W * 0.36, -H * 0.04], [0, 0], [-W * 0.36, -H * 0.04]]
    r.poly(turn(flamePts.map(([x, y]): P => [46 + x, 18 + y + H * 0.1]), 46, 18, (225 * Math.PI) / 180), c)
  }
  r.ellipse(44, 20, 5, 5, 's4')
  r.outline('k', ['f3', 'f4', 's4'])
  for (const [x, y] of [[58, 34], [28, 8], [10, 30], [36, 58]] as const) sparkle(r, x, y, 2, 'f3', 'f4')
})

// Wildfire: one fallen, burning where it lies, its fire leaping on in two arcs to the ground on either side
icon('wildfire', (r) => {
  r.poly([[2, 54], [62, 54], [60, 60], [4, 60]], 'e1')
  r.line(4, 55, 60, 55, 'e2')
  // the fallen: a dark body on its back, its head to the right
  r.ellipse(30, 50, 15, 5, 'b2')
  r.ellipse(48, 48, 5, 5, 'b2')
  r.line(18, 47, 42, 47, 'b3')
  r.outline('k')
  flame(r, 30, 51, 16, 26, 0)
  flame(r, 8, 55, 10, 16, -1)
  flame(r, 56, 55, 10, 16, 1)
  r.outline('k', ['f3', 'f4'])
  // the fire leaping off it: a streak of flame along each arc, falling on the fires beside
  for (const s of [-1, 1]) {
    let prev: P | undefined
    for (let i = 0; i <= 12; i++) {
      const t = i / 12
      const p: P = [(1 - t) ** 2 * (30 + s * 4) + 2 * t * (1 - t) * (30 + s * 14) + t * t * (30 + s * 24), (1 - t) ** 2 * 22 + 2 * t * (1 - t) * 2 + t * t * 34]
      if (prev) thick(r, prev, p, t < 0.85 ? 'f2' : 'f3', t < 0.5 ? 3 : 2)
      prev = p
    }
  }
  r.outline('k', ['f3', 'f4'])
  sparkle(r, 30, 4, 2, 'f3', 'f4')
})

// Flame Wall: Mastery — the wall of flame, a gold badge
icon('flame-wall-plus', (r) => {
  copy(r, 'flame-wall')
  badge(r)
})

// Combustion: Mastery — the bursting ember, a gold badge
icon('combustion-plus', (r) => {
  copy(r, 'combustion')
  badge(r)
})

// Searing: a slender white-hot flame, a critical's star flashing off it
icon('searing', (r) => {
  flame(r, 28, 58, 26, 52, 2, ['f2', 'f3', 'f4', 's4'])
  r.outline('k', ['f4', 's4'])
  r.ellipse(28, 50, 4, 3, 's4')
  star4(r, 48, 16, 10, 'f3', 's4')
  r.outline('k', ['f4', 's4'])
  sparkle(r, 52, 42, 2, 'f3', 'f4')
  sparkle(r, 8, 20, 2, 'f3', 'f4')
})

// ---------------------------------------------------------------- the Worldfire (the Pyromancer's third): the fire that ends a world

// Heart of the Worldfire: a heart that is all flame, from its red rim to a white heart, burning at its top
icon('kalpa-heart', (r) => {
  heart(r, 32, 34, 21, 'r1')
  heart(r, 32, 34, 18, 'r2')
  heart(r, 32, 35, 13, 'f2')
  heart(r, 32, 36, 8, 'f3')
  r.ellipse(32, 35, 3, 3, 'f4')
  r.set(32, 35, 's4')
  r.outline('k')
  flame(r, 20, 22, 12, 18, -2)
  flame(r, 44, 22, 12, 18, 2)
  flame(r, 32, 24, 14, 22, 0)
  r.outline('k', ['f3', 'f4'])
  sparkle(r, 8, 8, 2, 'f3', 'f4')
  sparkle(r, 56, 10, 2, 'f3', 'f4')
})

// Immolate: a dark figure standing in a pyre of its own fire
icon('immolate', (r) => {
  flame(r, 32, 60, 44, 58, 0, ['r2', 'f2', 'f3', 'f4'])
  figure(r, 32, 16, 44, ['b1', 'b2', 'b3'])
  r.rect(28, 22, 2, 1, 'f4')
  r.rect(34, 22, 2, 1, 'f4')
  r.outline('k', ['f3', 'f4'])
  flame(r, 14, 60, 12, 22, -3)
  flame(r, 50, 60, 12, 22, 3)
  r.outline('k', ['f3', 'f4'])
  sparkle(r, 8, 18, 2, 'f3', 'f4')
  sparkle(r, 56, 14, 2, 'f3', 'f4')
})

// Scorched Earth: a wave of fire rolling forward over the ground, its crest curling, the earth behind it burnt black
icon('scorched-earth', (r) => {
  r.poly([[2, 52], [62, 52], [60, 60], [4, 60]], 'e2')
  r.poly([[2, 52], [30, 52], [28, 60], [4, 60]], 'b1')
  for (const x of [6, 14, 22]) r.line(x, 54, x + 4, 57, 'r1')
  r.outline('k')
  // the wave: low behind, rising to a crest that curls over before it
  r.poly([[4, 52], [10, 44], [20, 40], [30, 30], [40, 16], [50, 10], [58, 14], [60, 24], [54, 22], [50, 28], [56, 36], [58, 52]], 'r2')
  r.poly([[10, 52], [16, 46], [26, 40], [36, 28], [44, 20], [52, 16], [56, 20], [50, 22], [46, 30], [52, 40], [52, 52]], 'f2')
  r.poly([[20, 52], [28, 44], [38, 34], [44, 28], [42, 38], [46, 46], [46, 52]], 'f3')
  r.poly([[32, 52], [38, 44], [42, 40], [42, 52]], 'f4')
  r.outline('k', ['f3', 'f4'])
  // the smoke left behind it, no outline
  for (const [x, y] of [[8, 34], [14, 26], [6, 20]] as const) r.ellipse(x, y, 3, 2, 'm2')
})

// Burnout: a burst already spent, its embers flown, the fire in its middle still burning
icon('burnout', (r) => {
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6 + 0.2
    const x = 32 + Math.cos(a) * 24
    const y = 32 + Math.sin(a) * 24
    r.poly([[x, y], [x + Math.cos(a + 1.3) * 4, y + Math.sin(a + 1.3) * 4], [x + Math.cos(a) * 5, y + Math.sin(a) * 5]], i % 2 ? 'e1' : 'r1')
  }
  arc(r, 32, 32, 17, 0, 360, 'r1', 2)
  r.outline('k')
  flame(r, 32, 46, 20, 34, 0)
  r.outline('k', ['f3', 'f4'])
  for (const [x, y] of [[14, 14], [50, 16], [52, 50], [12, 48]] as const) r.set(x, y, 'f3')
})

// Scorched Earth: Mastery — the burning ground, a gold badge
icon('scorched-earth-plus', (r) => {
  copy(r, 'scorched-earth')
  badge(r)
})

// Worldfire: a world wrapped in fire falling out of the sky, its trail behind it, the horizon alight below
icon('worldfire', (r) => {
  // its trail, tapering back up the sky
  for (const [c, k] of [['r2', 9], ['f2', 6], ['f3', 3]] as const)
    for (let i = 0; i <= 24; i++) {
      const t = i / 24
      const w = k * (1 - t) + (c === 'r2' ? 1 : 0)
      if (w > 0.5) r.ellipse(36 + 22 * t, 28 - 22 * t, w, w, c)
    }
  ball(r, 30, 34, 18, ['r1', 'r2', 'f2', 'f3'])
  // its seas boiled away: the dark land on it
  r.poly([[18, 32], [24, 28], [30, 32], [26, 38], [18, 38]], 'e1')
  r.poly([[34, 40], [42, 36], [44, 44], [36, 48]], 'e1')
  r.ellipse(24, 26, 3, 2, 'f4')
  r.outline('k', ['f3', 'f4'])
  r.poly([[2, 56], [62, 56], [62, 61], [2, 61]], 'r1')
  r.line(2, 56, 62, 56, 'f2')
  for (const x of [8, 20, 44, 56]) flame(r, x, 56, 6, 8, 0, ['r2', 'f2', 'f3'])
  r.outline('k', ['f3', 'f4'])
})

// All Is Kindling: a bundle of sticks alight, two arrows of fire wheeling round it, the fire passed on and on
icon('all-is-kindling', (r) => {
  for (const [a0, a1] of [[200, 330], [20, 150]] as const) {
    arc(r, 32, 32, 23, a0, a1, 'f1', 5)
    arc(r, 32, 32, 23, a0, a1, 'f3', 1)
    const t = (a1 * Math.PI) / 180
    const x = 32 + Math.cos(t) * 23
    const y = 32 + Math.sin(t) * 23
    const n = t + Math.PI / 2
    r.poly([[x + Math.cos(n) * 8, y + Math.sin(n) * 8], [x + Math.cos(t) * 7, y + Math.sin(t) * 7], [x - Math.cos(t) * 7, y - Math.sin(t) * 7]], 'f2')
  }
  r.outline('k', ['f3'])
  thick(r, [20, 44], [44, 34], 'w1', 4)
  thick(r, [20, 34], [44, 44], 'w1', 4)
  thick(r, [21, 43], [43, 34], 'w2', 2)
  thick(r, [21, 35], [43, 43], 'w3', 1)
  r.outline('k')
  flame(r, 32, 40, 14, 22, 0)
  r.outline('k', ['f3', 'f4'])
})

// The Worldfire's entrance: a black world eclipsed before a corona of fire
icon('mastery-pyromancer', (r) => {
  const star: P[] = []
  for (let i = 0; i < 24; i++) {
    const a = (i * Math.PI) / 12
    const rad = i % 2 ? 22 : i % 4 ? 26 : 30
    star.push([32 + Math.cos(a) * rad, 32 + Math.sin(a) * rad])
  }
  r.poly(star, 'r2')
  r.poly(star.map(([x, y]): P => [32 + (x - 32) * 0.82, 32 + (y - 32) * 0.82]), 'f2')
  r.ellipse(32, 32, 20, 20, 'f3')
  r.ellipse(32, 32, 17, 17, 'f4')
  r.outline('k')
  ball(r, 33, 33, 16, ['b1', 'b1', 'b2'])
  arc(r, 33, 33, 15, 200, 250, 'f2', 1)
  r.outline('k', ['b1', 'b2'])
})

// ---------------------------------------------------------------- the Cryomancer: ice

// Rime: a twig gone white with frost, icicles hanging from it
icon('rime', (r) => {
  thick(r, [6, 22], [58, 18], 'w1', 4)
  thick(r, [6, 21], [58, 17], 'w2', 2)
  thick(r, [24, 20], [16, 8], 'w1', 3)
  thick(r, [42, 19], [50, 8], 'w1', 3)
  // the frost on top of it
  for (const [x0, x1, y] of [[6, 58, 17], [16, 24, 8]] as const) for (let x = x0; x <= x1; x += 2) r.rect(x, y - 2 - ((x * 7) % 3 === 0 ? 1 : 0), 2, 2, 'i4')
  r.rect(48, 6, 4, 2, 'i4')
  r.outline('k')
  // icicles, long and short
  for (const [x, len] of [[12, 18], [20, 28], [28, 14], [36, 32], [46, 20], [54, 12]] as const) {
    r.poly([[x - 3, 22], [x + 3, 22], [x, 22 + len]], 'i2')
    r.line(x - 1, 23, x, 20 + len, 'i3')
    r.set(x - 1, 23, 'i4')
  }
  r.outline('k')
  sparkle(r, 58, 40, 2, 'i3', 'i4')
  sparkle(r, 6, 46, 2, 'i3', 'i4')
})

// Ice Lance: a long lance of ice driven through two rings of frost
icon('ice-lance', (r) => {
  const a: P = [8, 56]
  thick(r, a, [44, 20], 'i1', 5)
  thick(r, a, [44, 20], 'i2', 3)
  r.line(9, 54, 44, 19, 'i3')
  // the head: a long crystal
  r.poly([[40, 18], [46, 24], [56, 8]], 'i2')
  r.poly([[40, 18], [44, 14], [56, 8]], 'i3')
  r.line(44, 20, 55, 9, 'i4')
  r.outline('k')
  // the rings it passes through
  for (const [x, y] of [[20, 44], [32, 32]] as const) {
    r.ellipse(x, y, 7, 7, 'i3')
    r.ellipse(x, y, 5, 5, null as unknown as string)
    arc(r, x, y, 6, 200, 320, 'i4', 1)
  }
  r.outline('k')
  thick(r, [22, 42], [30, 34], 'i2', 3)
  r.line(22, 41, 30, 33, 'i3')
  sparkle(r, 52, 30, 2, 'i3', 'i4')
  sparkle(r, 12, 30, 2, 'i3', 'i4')
})

// Glacial Prison: a block of ice, something dark held inside it
icon('glacial-prison', (r) => {
  // the block, seen from above a corner
  r.poly([[32, 8], [56, 20], [32, 32], [8, 20]], 'i4')
  r.poly([[8, 20], [32, 32], [32, 58], [8, 46]], 'i2')
  r.poly([[32, 32], [56, 20], [56, 46], [32, 58]], 'i1')
  // the shape held in it: a crouched creature's dark outline
  r.ellipse(20, 40, 6, 7, 'b2')
  r.ellipse(18, 33, 4, 4, 'b2')
  r.ellipse(44, 40, 5, 7, 'n1')
  r.rect(17, 32, 1, 1, 'f3')
  // its edges and a crack, frost on top
  r.line(32, 32, 32, 58, 'i3')
  r.line(8, 20, 32, 32, 's4')
  r.line(32, 32, 56, 20, 'i3')
  r.line(38, 14, 44, 18, 'i3')
  r.line(20, 12, 26, 15, 's4')
  r.line(46, 30, 50, 36, 'i4')
  r.line(50, 36, 48, 40, 'i4')
  r.outline('k')
  sparkle(r, 58, 8, 2, 'i3', 'i4')
})

// Shatter: a crystal breaking, its shards flying out from the crack
icon('shatter', (r) => {
  // the heart of it, cracked through, a piece breaking away
  r.poly([[30, 10], [44, 26], [40, 48], [24, 50], [16, 30]], 'i1')
  r.poly([[30, 12], [42, 26], [38, 46], [25, 48], [18, 30]], 'i2')
  r.poly([[30, 12], [42, 26], [31, 28], [18, 30]], 'i3')
  r.line(29, 15, 22, 28, 'i4')
  r.line(30, 13, 30, 18, 's4')
  thick(r, [31, 28], [27, 38], 'b2', 2)
  thick(r, [27, 38], [32, 48], 'b2', 2)
  thick(r, [31, 28], [40, 34], 'b2', 2)
  r.outline('k')
  // the shards flying off
  for (const [x, y, dx, dy] of [[4, 10, 8, 3], [52, 6, -3, 8], [2, 38, 8, -2], [54, 30, 7, 6], [8, 54, 7, -6], [46, 54, 6, 4], [56, 46, 4, -7]] as const) {
    r.poly([[x, y], [x + dx, y + dy], [x + dx / 2 + 3, y + dy / 2 + 4]], 'i3')
    r.line(x, y, x + dx / 2, y + dy / 2, 'i4')
  }
  r.outline('k')
  // the lines of their flight, no outline
  for (const [x, y, dx, dy] of [[14, 16, 3, 3], [50, 18, -4, 3], [14, 38, 4, -1], [50, 38, -4, -1], [18, 50, 3, -3]] as const) r.line(x, y, x + dx, y + dy, 'i3')
})

// Frost Armour: a breastplate of ice, frost spikes standing off its shoulders
icon('frost-armour', (r) => {
  r.poly([[18, 14], [26, 12], [32, 18], [38, 12], [46, 14], [52, 22], [48, 30], [46, 50], [32, 56], [18, 50], [16, 30], [12, 22]], 'i2')
  r.poly([[20, 16], [26, 14], [32, 20], [32, 54], [20, 48], [18, 30], [15, 23]], 'i3')
  r.line(32, 20, 32, 54, 'i1')
  r.line(21, 32, 43, 32, 'i1')
  r.line(22, 42, 42, 42, 'i1')
  r.line(22, 18, 26, 16, 'i4')
  r.rect(22, 24, 2, 4, 'i4')
  // the spikes of rime on its shoulders
  for (const [x, y, dx] of [[12, 22, -6], [16, 16, -4], [52, 22, 6], [48, 16, 4]] as const) {
    r.poly([[x, y], [x + dx, y - 8], [x + (dx > 0 ? -2 : 2), y - 2]], 'i4')
  }
  r.outline('k')
  sparkle(r, 32, 8, 2, 'i3', 'i4')
})

// Blizzard: a heavy white cloud, snow and hail driving down out of it slantwise
icon('blizzard', (r) => {
  r.ellipse(20, 18, 12, 9, 'm3')
  r.ellipse(36, 14, 14, 11, 'm3')
  r.ellipse(48, 20, 10, 8, 'm3')
  r.rect(10, 18, 46, 9, 'm3')
  r.ellipse(34, 12, 10, 7, 's4')
  r.ellipse(18, 16, 7, 5, 'm4')
  r.rect(10, 24, 46, 3, 'm2')
  r.outline('k')
  // the driven snow
  snowflake(r, 18, 42, 7, 'i4', 1, 'i3')
  snowflake(r, 42, 48, 8, 'i4', 1, 'i3')
  r.outline('k', ['i3'])
  for (const [x, y] of [[30, 34], [52, 34], [10, 52], [30, 56], [56, 56], [24, 30]] as const) {
    r.line(x, y, x - 3, y + 4, 'i3')
    r.set(x - 3, y + 4, 'i4')
  }
})

// The Cryomancer's medallion: a blue plate, a snowflake
icon('path-cryomancer', (r) => {
  medallion(r, ['i1', 'i2', 'i3'])
  r.outline('k')
  snowflake(r, 32, 32, 13, 's4', 2, 'i4')
  r.ellipse(32, 32, 2, 2, 'i4')
  r.outline('k', ['s4', 'i4'])
})

// Ice Spikes: spikes of ice bursting out of a patch of frosted ground, three rows of three, the near ones tallest
icon('ice-spikes', (r) => {
  r.ellipse(32, 51, 30, 10, 'i1')
  r.ellipse(32, 50, 27, 8, 'i2')
  r.ellipse(29, 48, 16, 4, 'i3')
  r.outline('k')
  for (const x of [18, 32, 46]) spike(r, x, 44, 10, 26, x < 32 ? -2 : x > 32 ? 2 : 0)
  r.outline('k')
  for (const x of [10, 32, 54]) spike(r, x, 51, 12, 32, x < 32 ? -3 : x > 32 ? 3 : 0)
  r.outline('k')
  for (const x of [21, 43]) spike(r, x, 58, 14, 38, x < 32 ? -2 : 2)
  r.outline('k')
  sparkle(r, 4, 14, 2, 'i3', 'i4')
  sparkle(r, 60, 10, 2, 'i3', 'i4')
})

// Frozen Ground: a slab of ground frozen over, flat, crazed with cracks, frost rising off it
icon('frozen-ground', (r) => {
  r.poly([[4, 38], [32, 24], [60, 38], [32, 52]], 'i3')
  r.poly([[4, 38], [32, 52], [32, 57], [4, 43]], 'i1')
  r.poly([[32, 52], [60, 38], [60, 43], [32, 57]], 'n1')
  r.poly([[12, 38], [32, 28], [40, 32], [20, 42]], 'i4')
  // the cracks
  for (const [a, b] of [[[18, 36], [28, 40]], [[28, 40], [26, 46]], [[28, 40], [38, 38]], [[38, 38], [46, 42]], [[38, 38], [36, 30]], [[46, 42], [52, 40]]] as [P, P][]) thick(r, a, b, 'i1', 1)
  r.line(4, 38, 32, 24, 's4')
  r.outline('k')
  // the icicles under its edge
  for (const [x, y, h] of [[10, 45, 5], [20, 50, 7], [30, 56, 5], [42, 54, 6], [54, 47, 5]] as const) r.poly([[x - 1.5, y], [x + 1.5, y], [x, y + h]], 'i2')
  r.outline('k')
  // frost rising off it, no outline
  for (const [x, y] of [[16, 18], [30, 12], [46, 20], [54, 28]] as const) {
    r.line(x, y, x + 2, y - 4, 'i3')
    r.set(x + 2, y - 5, 'i4')
  }
  snowflake(r, 32, 12, 6, 'i4', 1, 'i3')
})

// Permafrost: a thick block of ice, an hourglass held frozen in it, its sand stopped
icon('permafrost', (r) => {
  r.poly([[10, 12], [54, 12], [56, 56], [8, 56]], 'i1')
  r.poly([[12, 14], [52, 14], [54, 54], [10, 54]], 'i2')
  r.poly([[12, 14], [30, 14], [20, 54], [10, 54]], 'i3')
  r.line(12, 15, 52, 15, 'i4')
  r.line(11, 16, 9, 53, 'i4')
  // the hourglass inside
  r.rect(22, 20, 20, 3, 'g1')
  r.rect(22, 46, 20, 3, 'g1')
  r.poly([[24, 23], [40, 23], [33, 34], [40, 46], [24, 46], [31, 34]], 'i4')
  r.poly([[26, 24], [38, 24], [33, 31], [31, 31]], 'e3')
  r.poly([[31, 38], [33, 38], [38, 45], [26, 45]], 'e3')
  r.line(32, 31, 32, 38, 'e3')
  r.line(22, 20, 41, 20, 'g3')
  // a crack across the ice
  thick(r, [44, 18], [48, 30], 'i1', 1)
  thick(r, [48, 30], [44, 40], 'i1', 1)
  r.outline('k')
  sparkle(r, 58, 8, 2, 'i3', 'i4')
  sparkle(r, 4, 30, 2, 'i3', 'i4')
})

// Ice Lance: Mastery — the lance of ice, a gold badge
icon('ice-lance-plus', (r) => {
  copy(r, 'ice-lance')
  badge(r)
})

// Deep Chill: a bone gone white with frost, icicles hanging off it, a critical's star flashing cold
icon('deep-chill', (r) => {
  thick(r, [16, 48], [44, 20], 'm3', 7)
  thick(r, [16, 47], [44, 19], 'm4', 3)
  for (const [x, y] of [[12, 48], [16, 52], [44, 16], [48, 20]] as const) {
    r.ellipse(x, y, 5, 5, 'm3')
    r.ellipse(x - 1, y - 1, 3, 3, 'm4')
  }
  // the frost on its back
  for (let t = 0; t <= 1; t += 0.08) r.rect(14 + 30 * t, 42 - 28 * t, 2, 2, 'i3')
  r.outline('k')
  for (const [x, y, h] of [[22, 46, 8], [30, 38, 10], [38, 30, 7]] as const) r.poly([[x - 2, y], [x + 2, y], [x, y + h]], 'i2')
  r.outline('k')
  star4(r, 50, 46, 11, 'i3', 's4')
  r.outline('k', ['s4'])
  sparkle(r, 10, 14, 2, 'i3', 'i4')
})

// Frozen Ground: Mastery — the frozen slab, a gold badge
icon('frozen-ground-plus', (r) => {
  copy(r, 'frozen-ground')
  badge(r)
})

// ---------------------------------------------------------------- Everwinter (the Cryomancer's third): the winter that does not end

// Heart of Winter: a heart cut from ice, its facets lit, a snowflake at its core
icon('heart-of-winter', (r) => {
  heart(r, 32, 32, 22, 'i1')
  heart(r, 32, 32, 19, 'i2')
  heart(r, 30, 30, 11, 'i3')
  // its facets
  for (const [a, b] of [[[32, 22], [32, 54]], [[12, 26], [32, 38]], [[52, 26], [32, 38]], [[20, 16], [32, 22]], [[44, 16], [32, 22]]] as [P, P][]) r.line(a[0], a[1], b[0], b[1], 'i1')
  r.line(14, 20, 20, 14, 'i4')
  r.outline('k')
  snowflake(r, 32, 36, 7, 's4', 1, 'i4')
  sparkle(r, 54, 52, 2, 'i3', 'i4')
  sparkle(r, 8, 50, 2, 'i3', 'i4')
})

// Glacier: a wall of ice sliding forward, its front broken into crevasses, snow on its back, the ground torn before it
icon('glacier', (r) => {
  r.poly([[20, 58], [16, 32], [22, 22], [28, 26], [34, 12], [42, 20], [48, 10], [56, 20], [62, 34], [62, 58]], 'i1')
  r.poly([[22, 56], [19, 34], [24, 26], [29, 30], [34, 18], [40, 26], [40, 56]], 'i2')
  r.poly([[22, 56], [20, 36], [24, 30], [28, 34], [26, 56]], 'i3')
  // its back of snow
  r.poly([[22, 22], [28, 26], [34, 12], [42, 20], [48, 10], [56, 20], [52, 22], [46, 16], [42, 24], [34, 18], [28, 30]], 's4')
  // the crevasses
  for (const [x0, y0, x1, y1] of [[30, 36, 28, 50], [44, 28, 46, 46], [52, 34, 54, 52], [36, 42, 38, 56]] as const) thick(r, [x0, y0], [x1, y1], 'n1', 1)
  r.outline('k')
  // the broken ground and the chunks it pushes, the cold it drives before it
  for (const [x, y, s] of [[10, 54, 4], [4, 58, 3], [14, 46, 2]] as const) r.poly([[x - s, y], [x, y - s], [x + s, y], [x, y + s * 0.6]], 'i3')
  r.outline('k')
  for (const [x, y, l] of [[2, 30, 10], [4, 38, 8], [2, 46, 6]] as const) r.line(x, y, x + l, y, 'i3')
})

// Cold Wave: rings of cold rolling out from a frozen heart, snow thrown off the outermost
icon('cold-wave', (r) => {
  arc(r, 32, 32, 26, 20, 160, 'i2', 3)
  arc(r, 32, 32, 26, 200, 340, 'i2', 3)
  arc(r, 32, 32, 18, 60, 300, 'i3', 3)
  arc(r, 32, 32, 18, 330, 390, 'i3', 3)
  arc(r, 32, 32, 26, 20, 160, 'i4', 1)
  r.outline('k')
  ball(r, 32, 32, 7, ['i1', 'i2', 'i4', 's4'])
  r.outline('k')
  for (const [x, y] of [[4, 32], [60, 32], [32, 2], [32, 61]] as const) r.rect(x - 1, y - 1, 2, 2, 'i4')
  snowflake(r, 52, 10, 5, 'i4', 1, 'i3')
  snowflake(r, 12, 54, 5, 'i4', 1, 'i3')
})

// Frostbite: two fangs of ice biting down, a drop of blood drawn below them
icon('frostbite', (r) => {
  arc(r, 32, 2, 26, 30, 150, 'i1', 6)
  arc(r, 32, 2, 26, 40, 140, 'i3', 2)
  for (const x of [20, 44]) {
    r.poly([[x - 6, 20], [x + 6, 20], [x + (x < 32 ? 2 : -2), 44]], 'i2')
    r.poly([[x - 6, 20], [x - 1, 20], [x + (x < 32 ? 2 : -2), 44]], 'i3')
    r.line(x - 4, 21, x + (x < 32 ? 1 : -3), 40, 'i4')
  }
  r.outline('k')
  // the drop of blood
  r.poly([[32, 40], [37, 50], [32, 56], [27, 50]], 'r1')
  r.ellipse(32, 51, 5, 5, 'r1')
  r.ellipse(32, 51, 4, 4, 'r2')
  r.set(30, 49, 'r3')
  r.outline('k')
  sparkle(r, 8, 40, 2, 'i3', 'i4')
  sparkle(r, 56, 42, 2, 'i3', 'i4')
})

// Cold Wave: Mastery — the rings of cold, a gold badge
icon('cold-wave-plus', (r) => {
  copy(r, 'cold-wave')
  badge(r)
})

// Endless Winter: a world under ice, its cap spreading down it, snow driving over it
icon('endless-winter', (r) => {
  ball(r, 32, 38, 21, ['n1', 'n2', 'n3'])
  within(r, (m) => r.px.forEach((c, i) => c && (m.px[i] = c)), (t) => {
    t.poly([[0, 0], [64, 0], [64, 40], [52, 44], [44, 38], [36, 46], [26, 40], [18, 46], [10, 40], [0, 44]], 'i3')
    t.poly([[0, 0], [64, 0], [64, 30], [50, 34], [40, 28], [28, 34], [16, 28], [0, 32]], 'i4')
  })
  r.outline('k')
  for (const [x, y, h] of [[18, 46, 5], [26, 42, 6], [36, 48, 5], [52, 46, 4]] as const) r.poly([[x - 1.5, y - 1], [x + 1.5, y - 1], [x, y + h]], 'i3')
  r.outline('k')
  snowflake(r, 10, 10, 6, 'i4', 1, 'i3')
  snowflake(r, 54, 8, 5, 'i4', 1, 'i3')
  for (const [x, y] of [[30, 6], [44, 14], [4, 28], [60, 26], [8, 58], [58, 58]] as const) {
    r.line(x, y, x - 2, y + 3, 'i3')
    r.set(x - 2, y + 3, 'i4')
  }
})

// Still Time: a clock stopped, a ring of ice shards hanging round it in the air, frozen as they flew
icon('still-time', (r) => {
  r.ellipse(32, 32, 14, 14, 'i1')
  r.ellipse(32, 32, 12, 12, 'i4')
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6
    r.set(32 + Math.cos(a) * 10, 32 + Math.sin(a) * 10, i % 3 ? 'i2' : 'i1')
  }
  // its hands, stopped
  thick(r, [32, 32], [32, 24], 'b2', 2)
  thick(r, [32, 32], [38, 35], 'b2', 2)
  r.set(32, 32, 'i1')
  r.outline('k')
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 + 0.35
    const x = 32 + Math.cos(a) * 24
    const y = 32 + Math.sin(a) * 24
    const d = a + Math.PI / 2
    r.poly([[x + Math.cos(a) * 5, y + Math.sin(a) * 5], [x + Math.cos(d) * 3, y + Math.sin(d) * 3], [x - Math.cos(a) * 4, y - Math.sin(a) * 4], [x - Math.cos(d) * 2, y - Math.sin(d) * 2]], i % 2 ? 'i2' : 'i3')
    r.set(x, y, 'i4')
  }
  r.outline('k')
  arc(r, 32, 32, 18, 200, 250, 'i3', 1)
  arc(r, 32, 32, 18, 20, 70, 'i3', 1)
})

// Everwinter's entrance: a crown of icicles before a pale winter sun
icon('mastery-cryomancer', (r) => {
  r.ellipse(32, 30, 26, 26, 'n1')
  r.ellipse(32, 30, 23, 23, 'n2')
  r.ellipse(32, 24, 13, 13, 'i3')
  r.ellipse(30, 22, 9, 9, 'i4')
  r.outline('k')
  // the crown: a silver band, icicle points standing off it
  r.rect(10, 42, 44, 8, 's2')
  r.rect(10, 42, 44, 3, 's3')
  for (const [x, h] of [[13, 12], [21, 18], [32, 26], [43, 18], [51, 12]] as const) {
    r.poly([[x - 4, 43], [x, 43 - h], [x + 4, 43]], 'i2')
    r.poly([[x - 3, 43], [x, 43 - h], [x, 43]], 'i3')
  }
  for (const x of [17, 26, 38, 47]) r.ellipse(x, 46, 2, 2, 'i1')
  r.ellipse(32, 46, 2.5, 2.5, 'i4')
  r.outline('k')
  sparkle(r, 56, 8, 2, 'i3', 'i4')
})

// ---------------------------------------------------------------- the Stormcaller: lightning

// The Stormcaller's medallion: a violet plate, a bolt across it
icon('path-stormcaller', (r) => {
  medallion(r, ['v1', 'v2', 'v3'])
  r.outline('k')
  r.poly([[36, 10], [20, 34], [30, 34], [24, 54], [44, 26], [34, 26], [40, 10]], 'y2')
  r.poly([[36, 12], [24, 32], [31, 32], [27, 48], [40, 28], [32, 28], [38, 12]], 'y3')
  r.outline('k', ['y3'])
})

// Static: two charged motes, a crackling spark leaping the gap between them, sparks spitting off it
icon('static', (r) => {
  bolt(r, [[16, 44], [24, 34], [22, 40], [32, 30], [30, 36], [40, 26], [48, 20]], 3)
  bolt(r, [[30, 32], [36, 40], [34, 46]], 1, 'v3', 'v4')
  bolt(r, [[24, 36], [18, 26], [22, 20]], 1, 'v3', 'v4')
  r.outline('k', ['y3', 'v4'])
  ball(r, 14, 46, 9, ['v1', 'v2', 'v3', 'v4'])
  ball(r, 50, 18, 9, ['y1', 'y2', 'y3', 's4'])
  r.rect(11, 45, 6, 2, 'v4')
  r.rect(47, 17, 6, 2, 'y1')
  r.rect(49, 15, 2, 6, 'y1')
  r.outline('k', ['y3', 'v4'])
  for (const [x, y] of [[6, 22], [58, 40], [36, 58], [30, 8]] as const) sparkle(r, x, y, 2, 'y2', 'y3')
})

// Lightning Bolt: a bolt out of a dark cloud, striking the ground in a flash
icon('lightning-bolt', (r) => {
  cloud(r, [[16, 14, 10], [32, 10, 12], [48, 15, 10], [32, 18, 10]], ['b2', 'b3', 'm2'])
  r.outline('k')
  r.ellipse(30, 56, 14, 4, 'y2')
  r.ellipse(30, 56, 8, 2, 'y3')
  r.outline('k', ['y2', 'y3'])
  r.poly([[34, 20], [24, 36], [32, 36], [26, 56], [42, 30], [34, 30], [40, 20]], 'y2')
  r.poly([[35, 22], [27, 35], [33, 35], [29, 50], [39, 32], [32, 32], [38, 22]], 'y3')
  r.outline('k', ['y2', 'y3'])
  for (const [x, y] of [[14, 50], [46, 50], [52, 36]] as const) sparkle(r, x, y, 2, 'y2', 'y3')
})

// Thunderclap: a flash at the heart, its shock rolling out in rings, short bolts flung off them
icon('thunderclap', (r) => {
  for (const [a0, a1] of [[-30, 60], [90, 180], [210, 300]] as const) {
    arc(r, 32, 32, 25, a0, a1, 'v2', 3)
    arc(r, 32, 32, 25, a0 + 10, a1 - 10, 'v4', 1)
  }
  for (const [a0, a1] of [[30, 120], [150, 240], [270, 360]] as const) arc(r, 32, 32, 17, a0, a1, 'y2', 2)
  r.outline('k', ['v4'])
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + Math.PI / 4
    const p = (k: number, o = 0): P => [32 + Math.cos(a) * k + Math.cos(a + Math.PI / 2) * o, 32 + Math.sin(a) * k + Math.sin(a + Math.PI / 2) * o]
    bolt(r, [p(10), p(15, 3), p(19, -2), p(27, 1)], 2)
  }
  ball(r, 32, 32, 8, ['y1', 'y2', 'y3', 's4'])
  r.outline('k', ['v4', 'y3'])
})

// Thunder Spear: a spear made of lightning, its head a white diamond, its shaft a jagged bolt
icon('thunder-spear', (r) => {
  bolt(r, [[4, 60], [12, 48], [10, 54], [20, 42], [18, 48], [28, 36], [26, 42], [36, 30]], 4, 'y2', 'y3')
  // the head: a long diamond, white at its heart
  r.poly([[32, 34], [40, 18], [60, 4], [46, 24], [38, 34]], 'y1')
  r.poly([[34, 32], [41, 20], [57, 7], [45, 23], [37, 31]], 'y2')
  r.poly([[37, 29], [43, 21], [55, 9], [44, 22]], 'y3')
  r.line(40, 26, 54, 10, 's4')
  r.outline('k', ['y3'])
  for (const [x, y] of [[8, 36], [22, 58], [52, 30], [26, 14]] as const) sparkle(r, x, y, 2, 'y2', 'y3')
})

// Overload: an orb of charge cracking, bolts tearing out of it on every side
icon('overload', (r) => {
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 + 0.3
    const p = (k: number, o = 0): P => [32 + Math.cos(a) * k + Math.cos(a + Math.PI / 2) * o, 32 + Math.sin(a) * k + Math.sin(a + Math.PI / 2) * o]
    bolt(r, [p(10), p(18, 4), p(23, -3), p(29, 2)], 3)
  }
  r.outline('k', ['y3'])
  ball(r, 32, 32, 14, ['v1', 'v2', 'v3', 'v4'])
  // its cracks, white with the charge bursting through
  for (const [a, b] of [[[32, 20], [30, 30]], [[30, 30], [38, 36]], [[30, 30], [22, 36]], [[38, 36], [36, 44]]] as [P, P][]) thick(r, a, b, 's4', 1)
  r.outline('k', ['y3'])
})

// Lightning Step: a hooded figure arrived in a flash, the jagged bolt it came by still trailing behind it
icon('lightning-step', (r) => {
  bolt(r, [[2, 46], [10, 38], [8, 44], [18, 36], [16, 42], [30, 34]], 4)
  for (const [x, y, l] of [[4, 22, 14], [2, 28, 20], [6, 56, 16]] as const) r.line(x, y, x + l, y, 'v3')
  figure(r, 44, 8, 50, ['b1', 'b2', 'y2'])
  r.rect(41, 15, 2, 1, 'y3')
  r.rect(46, 15, 2, 1, 'y3')
  r.outline('k', ['v3', 'y3'])
  for (const [x, y] of [[30, 12], [60, 30], [26, 58]] as const) sparkle(r, x, y, 2, 'y2', 'y3')
})

// Quickening: three chevrons of lightning driving forward, sparks thrown off them
icon('quickening', (r) => {
  for (const [x, c, d] of [[8, 'v2', 'v3'], [22, 'y1', 'y2'], [36, 'y2', 'y3']] as const) {
    r.poly([[x, 12], [x + 10, 12], [x + 22, 32], [x + 10, 52], [x, 52], [x + 12, 32]], c)
    r.poly([[x + 2, 14], [x + 9, 14], [x + 20, 32], [x + 12, 32]], d)
  }
  r.outline('k')
  for (const [x, y] of [[6, 4], [60, 14], [60, 50], [30, 60]] as const) sparkle(r, x, y, 2, 'y2', 'y3')
})

// Thunder Spear: Mastery — the spear of lightning, a gold badge
icon('thunder-spear-plus', (r) => {
  copy(r, 'thunder-spear')
  badge(r)
})

// High Voltage: a warning sign, a bolt on it, a critical's star flashing off its corner
icon('high-voltage', (r) => {
  r.poly([[28, 8], [54, 54], [2, 54]], 'b1')
  r.poly([[28, 14], [49, 51], [7, 51]], 'y2')
  r.poly([[28, 14], [28, 51], [7, 51]], 'y3')
  r.poly([[30, 22], [20, 38], [27, 38], [22, 50], [36, 32], [29, 32], [34, 22]], 'b1')
  r.outline('k')
  star4(r, 50, 18, 11, 'y3', 's4')
  r.outline('k', ['s4'])
})

// Lightning Step: Mastery — the figure gone to lightning, a gold badge
icon('lightning-step-plus', (r) => {
  copy(r, 'lightning-step')
  badge(r)
})

// Storm Spirit: a thundercloud with a face, its eyes alight, bolts for arms
icon('storm-spirit', (r) => {
  cloud(r, [[18, 30, 12], [32, 24, 15], [46, 30, 12], [32, 36, 12]], ['v1', 'v2', 'v3'])
  r.outline('k')
  r.ellipse(26, 30, 3, 2, 'y3')
  r.ellipse(38, 30, 3, 2, 'y3')
  r.set(26, 30, 's4')
  r.set(38, 30, 's4')
  r.poly([[26, 38], [29, 36], [32, 39], [35, 36], [38, 38], [32, 42]], 'b1')
  bolt(r, [[10, 38], [6, 46], [12, 46], [6, 58]], 3)
  bolt(r, [[54, 38], [58, 46], [52, 46], [58, 58]], 3)
  r.outline('k', ['y3'])
  sparkle(r, 32, 4, 2, 'y2', 'y3')
})

// Thunder Prison: a cage whose bars are lightning, something dark held in it
icon('thunder-prison', (r) => {
  r.ellipse(32, 54, 24, 6, 'v1')
  r.ellipse(32, 53, 21, 4, 'v2')
  arc(r, 32, 30, 22, 180, 360, 'v1', 4)
  arc(r, 32, 30, 22, 190, 350, 'v3', 1)
  r.outline('k')
  // the held thing
  r.ellipse(32, 44, 8, 8, 'b2')
  r.ellipse(32, 36, 5, 5, 'b2')
  r.rect(29, 35, 2, 1, 'y3')
  r.rect(33, 35, 2, 1, 'y3')
  r.outline('k')
  // the bars
  for (const x of [14, 24, 32, 40, 50]) {
    const top = 30 - Math.sqrt(Math.max(0, 22 * 22 - (x - 32) ** 2))
    bolt(r, [[x, top + 2], [x - 2, top + 12], [x + 2, top + 22], [x - 1, 52]], 2)
  }
  r.outline('k', ['y3', 'b2'])
  sparkle(r, 32, 4, 2, 'y2', 'y3')
})

// ---------------------------------------------------------------- the Wrath of Heaven (the Stormcaller's third): heaven's own lightning

// Heaven's Might: a crest of heaven, two white wings spread from a gold shield, a bolt on it, rays behind
icon('heavens-might', (r) => {
  rays(r, 32, 30, 16, 30, 16, 'd3', 2)
  r.outline('k', ['d3'])
  for (const s of [-1, 1]) {
    r.poly([[32 + s * 8, 26], [32 + s * 30, 12], [32 + s * 28, 22], [32 + s * 30, 26], [32 + s * 26, 34], [32 + s * 26, 40], [32 + s * 10, 40]], 'm4')
    for (const [y0, y1] of [[18, 26], [26, 32], [32, 38]] as const) r.line(32 + s * 12, y1, 32 + s * 26, y0 + 2, 'm3')
  }
  r.poly([[20, 18], [44, 18], [44, 36], [32, 50], [20, 36]], 'd1')
  r.poly([[22, 20], [42, 20], [42, 35], [32, 47], [22, 35]], 'd2')
  r.poly([[34, 22], [26, 34], [31, 34], [28, 44], [38, 30], [33, 30], [37, 22]], 'd4')
  r.outline('k', ['d3'])
})

// Bolt of Judgement: the clouds parted, gold light pouring through, one great bolt driven straight down
icon('judgement-bolt', (r) => {
  cloud(r, [[10, 12, 10], [22, 8, 9], [42, 8, 9], [54, 12, 10]], ['m2', 'm3', 's4'])
  r.outline('k')
  r.poly([[24, 4], [40, 4], [46, 56], [18, 56]], 'd3')
  r.poly([[28, 4], [36, 4], [40, 56], [24, 56]], 'd4')
  r.poly([[34, 6], [24, 28], [32, 28], [26, 56], [42, 22], [34, 22], [40, 6]], 'y2')
  r.poly([[35, 8], [27, 26], [33, 26], [29, 48], [39, 24], [32, 24], [38, 8]], 's4')
  r.outline('k', ['d3', 'd4'])
  r.ellipse(30, 58, 14, 3, 'd3')
  r.ellipse(30, 58, 8, 2, 's4')
})

// Thunder Shroud: a figure inside a sphere of crackling charge
icon('thunder-shroud', (r) => {
  r.ellipse(32, 32, 27, 27, 'v1')
  r.ellipse(32, 32, 25, 25, null as unknown as string)
  figure(r, 32, 12, 42, ['b1', 'b2', 'b3'])
  r.rect(30, 18, 2, 1, 'y3')
  r.rect(34, 18, 2, 1, 'y3')
  r.outline('k')
  arc(r, 32, 32, 26, 0, 360, 'v3', 2)
  for (let i = 0; i < 5; i++) {
    const a = (i * 2 * Math.PI) / 5 - 1.2
    const p = (k: number, d: number): P => [32 + Math.cos(a + d) * k, 32 + Math.sin(a + d) * k]
    bolt(r, [p(26, 0), p(22, 0.12), p(26, 0.24), p(23, 0.36)], 2)
  }
  r.outline('k', ['y3', 'v3'])
})

// Thunderstrike: a bolt slanting down out of the sky onto one point, a critical's star bursting there
icon('thunderstrike', (r) => {
  bolt(r, [[6, 4], [18, 18], [12, 22], [28, 34], [22, 38], [40, 46]], 5, 'y1', 'y2')
  bolt(r, [[6, 4], [18, 18], [12, 22], [28, 34], [22, 38], [40, 46]], 2, 'y3', 's4')
  r.outline('k', ['s4'])
  star4(r, 44, 46, 16, 'y2', 's4')
  r.outline('k', ['s4'])
  for (const [x, y] of [[56, 20], [20, 56], [58, 60]] as const) sparkle(r, x, y, 2, 'y2', 'y3')
})

// Thunder Shroud: Mastery — the figure in its shroud of charge, a gold badge
icon('thunder-shroud-plus', (r) => {
  copy(r, 'thunder-shroud')
  badge(r)
})

// Wrath of Heaven: the heavens opening, light pouring out between the clouds, bolt after bolt falling to the ground
icon('wrath-of-heaven', (r) => {
  r.ellipse(32, 6, 22, 10, 'd3')
  r.ellipse(32, 4, 14, 7, 'd4')
  cloud(r, [[6, 14, 10], [18, 12, 8], [46, 12, 8], [58, 14, 10]], ['m2', 'm3', 's4'])
  r.outline('k', ['d3', 'd4'])
  r.poly([[2, 58], [62, 58], [60, 62], [4, 62]], 'b2')
  for (const [x, l] of [[12, 1], [26, -1], [40, 1], [52, -1]] as const) bolt(r, [[x, 18], [x + 4 * l, 30], [x - 2 * l, 32], [x + 3 * l, 46], [x, 56]], 3)
  r.outline('k', ['d3', 'd4', 'y3'])
  for (const x of [12, 26, 40, 52]) r.ellipse(x, 57, 3, 1.5, 'y3')
})

// Storm Unending: a storm wheeling inward, bolts running along its arms, its eye white
icon('storm-unending', (r) => {
  for (const [c, w, o] of [['v1', 5, 0], ['v2', 3, 0], ['v3', 1, 0.2]] as const) {
    let prev: P | undefined
    for (let i = 0; i <= 60; i++) {
      const t = i / 60
      const a = t * Math.PI * 4 + o
      const rad = 28 - 22 * t
      const p: P = [32 + Math.cos(a) * rad, 32 + Math.sin(a) * rad]
      if (prev) thick(r, prev, p, c, w)
      prev = p
    }
  }
  r.outline('k', ['v3'])
  for (const [x, y] of [[52, 18], [12, 44], [44, 50], [18, 16]] as const) bolt(r, [[x - 4, y - 4], [x + 1, y - 1], [x - 1, y + 1], [x + 4, y + 4]], 2)
  ball(r, 32, 32, 4, ['y2', 'y3', 's4'])
  r.outline('k', ['v3', 'y3'])
})

// The Wrath of Heaven's entrance: a gold halo over a storm-dark round, one great bolt down through it, light behind
icon('mastery-stormcaller', (r) => {
  rays(r, 32, 34, 22, 30, 12, 'd3', 2, 0.5)
  r.ellipse(32, 34, 22, 22, 'v1')
  r.ellipse(32, 34, 19, 19, 'b2')
  r.ellipse(28, 30, 9, 8, 'v2')
  r.outline('k', ['d3'])
  r.poly([[36, 18], [24, 36], [31, 36], [26, 54], [42, 30], [34, 30], [40, 18]], 'y2')
  r.poly([[37, 20], [27, 34], [32, 34], [29, 48], [39, 32], [33, 32], [38, 20]], 'y3')
  r.outline('k', ['d3'])
  r.ellipse(32, 10, 14, 4, 'd1')
  r.ellipse(32, 10, 11, 2, null as unknown as string)
  arc(r, 32, 10, 13, 190, 260, 'd4', 1)
  r.outline('k', ['d3'])
})

// ---------------------------------------------------------------- the first tree, deeper

// Arcane Missiles: three violet bolts flying side by side, trailing light
icon('arcane-missiles', (r) => {
  for (const [x, y] of [[44, 14], [50, 30], [38, 44]] as const) {
    thick(r, [x - 26, y + 12], [x - 6, y + 3], 'v2', 3)
    r.line(x - 30, y + 14, x - 6, y + 3, 'v3')
  }
  r.outline('k', ['v3'])
  for (const [x, y] of [[44, 14], [50, 30], [38, 44]] as const) {
    ball(r, x, y, 6, ['v1', 'v2', 'v4', 's4'])
  }
  r.outline('k', ['v3'])
  sparkle(r, 58, 48, 2, 'v3', 'v4')
})

// Mana Ward: a kite shield of blue light, a rune burning on it
icon('mana-ward', (r) => {
  r.poly([[32, 6], [54, 14], [52, 34], [32, 58], [12, 34], [10, 14]], 'n1')
  r.poly([[32, 10], [50, 17], [48, 33], [32, 53], [16, 33], [14, 17]], 'n2')
  r.poly([[32, 10], [14, 17], [16, 33], [32, 53]], 'n3')
  // the rune
  thick(r, [32, 18], [32, 44], 'i4', 2)
  thick(r, [24, 24], [40, 24], 'i4', 2)
  thick(r, [26, 36], [32, 30], 'i4', 2)
  thick(r, [38, 36], [32, 30], 'i4', 2)
  r.line(15, 18, 30, 12, 's4')
  r.outline('k')
  arc(r, 32, 32, 29, 210, 330, 'n3', 1)
  arc(r, 32, 32, 29, 30, 150, 'n3', 1)
})

// Focus: a crystal prism, a broad beam going in and a narrow bright one coming out
icon('focus', (r) => {
  // the light that goes in
  r.poly([[2, 26], [22, 30], [22, 38], [2, 44]], 'v3')
  r.poly([[2, 31], [22, 33], [22, 35], [2, 39]], 'v4')
  r.poly([[30, 14], [46, 46], [16, 46]], 'i2')
  r.poly([[30, 14], [30, 46], [16, 46]], 'i3')
  r.line(29, 18, 20, 44, 'i4')
  r.outline('k', ['v3', 'v4'])
  // the light that comes out, narrowed
  thick(r, [40, 34], [62, 34], 'v4', 3)
  r.line(40, 34, 62, 34, 's4')
  sparkle(r, 58, 28, 2, 'v4', 's4')
})

// Spell Power: a rune stone with a rising glyph burning violet
icon('spell-power', (r) => {
  r.poly([[18, 8], [46, 8], [52, 18], [50, 56], [14, 56], [12, 18]], 'm1')
  r.poly([[18, 10], [44, 10], [49, 19], [47, 54], [17, 54], [15, 19]], 'm2')
  r.poly([[18, 10], [28, 10], [24, 54], [17, 54], [15, 19]], 'm3')
  // the glyph burning in it: an arrow up through two bars
  thick(r, [32, 20], [32, 48], 'v2', 5)
  r.poly([[22, 30], [32, 16], [42, 30]], 'v2')
  thick(r, [22, 38], [42, 38], 'v2', 4)
  thick(r, [24, 46], [40, 46], 'v2', 3)
  thick(r, [32, 22], [32, 47], 'v4', 1)
  r.poly([[26, 28], [32, 20], [38, 28]], 'v3')
  r.line(23, 38, 41, 38, 'v3')
  r.line(25, 46, 39, 46, 'v3')
  r.outline('k')
  sparkle(r, 56, 12, 2, 'v3', 'v4')
  sparkle(r, 8, 46, 2, 'v3', 'v4')
  sparkle(r, 54, 50, 1, 'v3', 'v4')
})

// ---------------------------------------------------------------- written

const mine = new Set(Object.keys(out))
for (const id of mine) {
  const path = join(OUT, 'skills', `${id}.png`)
  // (never over another's picture: only this file's own ids, and only once drawn here)
  if (existsSync(path) && !process.env.REDRAW_ADV_MAGE) throw new Error(`skill-adv-mage: ${id}.png exists; set REDRAW_ADV_MAGE=1 to redraw this file's own`)
}
for (const [id, r] of Object.entries(out)) writeAtlas(`skills/${id}.png`, [[r]], PAL)
console.log(`${mine.size} mage advancement icons → public/assets/lsw/skills`)
