// The swordsman's icons (2026-11-03): the profession's entrance; its first tree (the katana's steel, a pale blue edge
// light); the Sword Saint's and Sword Heart's (silver, the moon's white, a cold blue); the Sacrificer's and the Mad
// Martyr's (crimson, black, a martyr's gold); the Spellblade's and the Nightbreaker's (an arcane violet, and each element's
// own: fire, ice, lightning); each path's and third's entrance. 64x64, drawn by code in the look of
// the other skill icons (skill-adv-*.ts): one bold emblem, a dark outline, three or four tones a colour, a bright accent.
//
//   npx tsx games/openworld/tools/src/art/skill-swordsman.ts

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { OUT } from './png.ts'
import { Raster, writeAtlas, type Palette } from './raster.ts'

const PAL: Palette = {
  k: [40, 18, 14, 255],
  s1: [78, 84, 100, 255], s2: [138, 146, 162, 255], s3: [198, 205, 216, 255], s4: [246, 248, 252, 255],
  g1: [146, 92, 28, 255], g2: [212, 150, 50, 255], g3: [250, 208, 98, 255],
  r1: [116, 28, 30, 255], r2: [188, 50, 44, 255], r3: [234, 98, 72, 255],
  c1: [74, 10, 24, 255], c2: [140, 20, 44, 255], c3: [204, 58, 80, 255],
  b1: [24, 22, 32, 255], b2: [52, 50, 66, 255], b3: [92, 92, 112, 255],
  e1: [70, 110, 160, 255], e2: [140, 190, 230, 255], e3: [220, 240, 255, 255],
  t1: [36, 116, 116, 255], t2: [78, 178, 168, 255], t3: [160, 232, 214, 255],
  w1: [86, 46, 26, 255], w2: [136, 80, 42, 255], w3: [188, 124, 68, 255],
  o1: [176, 164, 130, 255], o2: [222, 212, 178, 255], o3: [250, 246, 228, 255],
  v1: [56, 28, 86, 255], v2: [106, 58, 148, 255], v3: [168, 108, 210, 255], v4: [226, 192, 252, 255],
  h1: [40, 30, 70, 255], h2: [100, 90, 150, 255],
  m1: [86, 86, 94, 255], m2: [136, 136, 146, 255], m3: [188, 188, 198, 255],
  f3: [255, 196, 76, 255], f4: [255, 242, 172, 255],
  y1: [168, 120, 20, 255], y2: [240, 200, 56, 255], y3: [255, 246, 168, 255],
}

const S = 64
type P = [number, number]
type Ramp = [string, string, string, string?]
const EDGE: Ramp = ['s1', 's3', 'e3', 's4']
const NONE = null as unknown as string

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

function drop(r: Raster, x: number, y: number, s: number, ramp: Ramp): void {
  r.ellipse(x, y, s, s * 1.2, ramp[0])
  r.ellipse(x - s * 0.15, y, s * 0.75, s, ramp[1])
  r.poly([[x - s * 0.6, y - s * 0.5], [x, y - s * 2.4], [x + s * 0.6, y - s * 0.5]], ramp[1])
  r.set(x - s * 0.35, y - s * 0.3, ramp[2])
}

function cloud(r: Raster, puffs: [number, number, number][], ramp: Ramp): void {
  for (const [x, y, s] of puffs) r.ellipse(x, y, s, s * 0.85, ramp[0])
  for (const [x, y, s] of puffs) r.ellipse(x - 1, y - 1, s * 0.82, s * 0.68, ramp[1])
  for (const [x, y, s] of puffs) r.ellipse(x - s * 0.3, y - s * 0.32, s * 0.36, s * 0.3, ramp[2])
}

function curve(pts: P[], steps = 6): P[] {
  const out: P[] = []
  for (let i = 0; i + 1 < pts.length; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)]
    for (let s = 0; s < steps; s++) {
      const t = s / steps
      const t2 = t * t, t3 = t2 * t
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ])
    }
  }
  out.push(pts[pts.length - 1])
  return out
}

/** A katana: a narrow blade from the guard to the point, its edge lit, a round guard, a wrapped grip and a pommel. */
function katana(r: Raster, hilt: P, tip: P, h = 2.4, ramp: Ramp = EDGE, guard = 'g2', wrap: [string, string] = ['h1', 'h2']): void {
  const len = Math.hypot(tip[0] - hilt[0], tip[1] - hilt[1])
  const d: P = [(tip[0] - hilt[0]) / len, (tip[1] - hilt[1]) / len]
  const n: P = [-d[1], d[0]]
  const at = (t: number, o: number): P => [hilt[0] + d[0] * t + n[0] * o, hilt[1] + d[1] * t + n[1] * o]
  // the blade, its back a little thicker, the point cut slant
  r.poly([at(0, h), at(len - h * 3, h), tip, at(len - h * 1.2, -h * 0.6), at(0, -h * 0.8)], ramp[1])
  thick(r, at(1, h * 0.7), at(len - h * 3.2, h * 0.7), ramp[0], 1)
  thick(r, at(1, -h * 0.3), at(len - h * 1.6, -h * 0.3), ramp[2], 1)
  if (ramp[3]) r.set(tip[0] - d[0], tip[1] - d[1], ramp[3])
  // the guard (tsuba), the grip wrapped in diamonds, the pommel
  r.ellipse(hilt[0], hilt[1], h + 2.2, h + 2.2, guard)
  const grip = 11
  for (let i = 1; i <= grip; i++) {
    const p = at(-i, 0)
    r.rect(p[0] - 1.2, p[1] - 1.2, 3, 3, i % 3 === 0 ? wrap[1] : wrap[0])
  }
  const end = at(-grip - 1, 0)
  r.ellipse(end[0], end[1], 1.8, 1.8, guard)
}

/** A cut of light through the air: a crescent along an arc, thick in its middle and thin at its ends. */
function slash(r: Raster, cx: number, cy: number, rad: number, a0: number, a1: number, ramp: Ramp = ['e1', 'e2', 'e3', 's4']): void {
  const steps = 24
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const a = ((a0 + (a1 - a0) * t) * Math.PI) / 180
    const w = 1 + Math.sin(t * Math.PI) * 4
    const x = cx + Math.cos(a) * rad
    const y = cy + Math.sin(a) * rad
    r.ellipse(x, y, w, w, ramp[0])
  }
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const a = ((a0 + (a1 - a0) * t) * Math.PI) / 180
    const w = Math.sin(t * Math.PI) * 2.6
    r.ellipse(cx + Math.cos(a) * (rad - 1), cy + Math.sin(a) * (rad - 1), w, w, ramp[1])
  }
  arc(r, cx, cy, rad - 1.5, a0 + (a1 - a0) * 0.2, a0 + (a1 - a0) * 0.8, ramp[2], 1)
}

/** A figure's silhouette (a cloak and its head) in one ramp: dark, body, a rim of light. */
function figure(r: Raster, cx: number, top: number, h: number, ramp: Ramp): void {
  const w = h * 0.36
  r.poly([[cx - w, top + h], [cx - w * 0.7, top + h * 0.3], [cx + w * 0.7, top + h * 0.3], [cx + w, top + h]], ramp[0])
  r.ellipse(cx, top + h * 0.16, h * 0.15, h * 0.16, ramp[0])
  r.poly([[cx - w * 0.8, top + h], [cx - w * 0.55, top + h * 0.35], [cx - w * 0.1, top + h * 0.32], [cx - w * 0.25, top + h]], ramp[1])
  r.ellipse(cx - h * 0.04, top + h * 0.14, h * 0.09, h * 0.1, ramp[1])
  r.line(cx - w * 0.68, top + h * 0.34, cx - w * 0.95, top + h - 1, ramp[2])
}

/** A gold badge in the corner: a skill's mastery. */
function badge(r: Raster): void {
  ball(r, 50, 50, 9, ['g1', 'g2', 'g3'])
  r.outline('k')
  r.rect(48, 44, 4, 12, 'f4')
  r.rect(44, 48, 12, 4, 'f4')
}

function heart(r: Raster, cx: number, cy: number, s: number, ramp: Ramp): void {
  r.ellipse(cx - s * 0.5, cy - s * 0.2, s * 0.55, s * 0.55, ramp[0])
  r.ellipse(cx + s * 0.5, cy - s * 0.2, s * 0.55, s * 0.55, ramp[0])
  r.poly([[cx - s * 1.02, cy], [cx + s * 1.02, cy], [cx, cy + s * 1.15]], ramp[0])
  r.ellipse(cx - s * 0.5, cy - s * 0.25, s * 0.4, s * 0.4, ramp[1])
  r.ellipse(cx + s * 0.45, cy - s * 0.25, s * 0.4, s * 0.4, ramp[1])
  r.poly([[cx - s * 0.85, cy], [cx + s * 0.85, cy], [cx, cy + s * 0.95]], ramp[1])
  r.set(cx - s * 0.65, cy - s * 0.45, ramp[2])
}

/** A swallow in flight: its forked tail behind, its wings swept. */
function swallow(r: Raster, cx: number, cy: number, s: number, body: string, light: string): void {
  r.poly([[cx + s, cy], [cx + s * 0.2, cy - s * 0.25], [cx - s * 0.5, cy - s], [cx - s * 0.15, cy - s * 0.15], [cx - s, cy - s * 0.2], [cx - s * 0.4, cy + s * 0.05], [cx - s, cy + s * 0.45], [cx - s * 0.2, cy + s * 0.25], [cx + s * 0.2, cy + s * 0.3]], body)
  r.line(cx + s * 0.9, cy - s * 0.02, cx - s * 0.1, cy - s * 0.12, light)
  r.set(cx + s * 0.75, cy - s * 0.08, 'k')
}

function eye(r: Raster, cx: number, cy: number, w: number, h: number, iris: Ramp): void {
  r.poly([[cx - w, cy], [cx - w * 0.5, cy - h], [cx + w * 0.5, cy - h], [cx + w, cy], [cx + w * 0.5, cy + h], [cx - w * 0.5, cy + h]], 'o3')
  ball(r, cx, cy, h * 0.9, iris)
  r.ellipse(cx, cy, h * 0.3, h * 0.6, 'b1')
}

function flame(r: Raster, cx: number, base: number, s: number, ramp: Ramp): void {
  r.poly([[cx - s, base], [cx - s * 0.8, base - s * 1.2], [cx - s * 0.3, base - s * 0.8], [cx, base - s * 2.2], [cx + s * 0.3, base - s * 0.8], [cx + s * 0.8, base - s * 1.2], [cx + s, base]], ramp[0])
  r.poly([[cx - s * 0.6, base], [cx - s * 0.4, base - s * 0.9], [cx, base - s * 1.5], [cx + s * 0.4, base - s * 0.9], [cx + s * 0.6, base]], ramp[1])
  r.poly([[cx - s * 0.25, base], [cx, base - s * 0.8], [cx + s * 0.25, base]], ramp[2])
}

const out: Record<string, Raster> = {}
/** Another icon's picture under this one (a mastery's badge goes over its skill's). */
const copy = (r: Raster, from: string) => out[from].px.forEach((c, i) => (r.px[i] = c))
const icon = (id: string, draw: (r: Raster) => void) => {
  const r = new Raster(S, S)
  draw(r)
  out[id] = r
}

// ================================================================ the profession and its first tree: steel, an edge's light

// The profession: a katana across a red sun, a cut of light over them
icon('swordsman', (r) => {
  ball(r, 34, 30, 22, ['r1', 'r2', 'r3'])
  r.outline('k')
  katana(r, [20, 46], [56, 10])
  r.outline('k', ['r1', 'r2', 'r3'])
  slash(r, 34, 40, 26, 200, 300)
  r.outline('k', ['r1', 'r2', 'r3', 's1', 's2', 's3', 's4', 'e3', 'g2', 'h1', 'h2'])
})

icon('kenjutsu', (r) => {
  katana(r, [32, 46], [32, 4], 2.8)
  r.outline('k')
  sparkle(r, 40, 12, 4, 'e3', 's4')
  sparkle(r, 22, 24, 2, 'e2', 'e3')
})

icon('honed-blade', (r) => {
  katana(r, [14, 46], [54, 10])
  r.outline('k')
  r.rect(30, 46, 22, 8, 'm2')
  r.rect(30, 46, 22, 3, 'm3')
  r.outline('k')
  for (const [x, y] of [[36, 40], [44, 38], [40, 34]] as const) sparkle(r, x, y, 2, 'f3', 'f4')
})

icon('clean-cut', (r) => {
  katana(r, [8, 40], [58, 40])
  r.outline('k')
  thick(r, [12, 6], [52, 58], 'r2', 3)
  thick(r, [12, 6], [52, 58], 'r3', 1)
  r.outline('k', ['s1', 's2', 's3', 's4', 'e3', 'g2', 'h1', 'h2'])
})

icon('fleet-stance', (r) => {
  figure(r, 38, 10, 46, ['b1', 'b2', 'b3'])
  r.outline('k')
  for (const [y, len] of [[24, 16], [34, 22], [44, 14], [54, 18]] as const) thick(r, [6, y], [6 + len, y], 't2', 2)
  katana(r, [44, 40], [60, 28], 1.6)
  r.outline('k', ['t2', 'b1', 'b2', 'b3'])
})

icon('parry', (r) => {
  katana(r, [12, 52], [52, 12])
  thick(r, [54, 50], [18, 18], 'm2', 4)
  thick(r, [54, 50], [18, 18], 'r2', 1)
  r.outline('k')
  sparkle(r, 32, 32, 6, 'f3', 'f4')
  sparkle(r, 32, 32, 3, 'f4', 's4')
})

icon('way-of-the-blade', (r) => {
  ball(r, 32, 30, 24, ['r1', 'r2', 'r3'])
  r.outline('k')
  katana(r, [32, 58], [32, 4], 3)
  r.outline('k', ['r1', 'r2', 'r3'])
  for (const [x, y] of [[12, 12], [52, 14], [50, 50]] as const) sparkle(r, x, y, 2, 'f3', 'f4')
})

icon('cross-cut', (r) => {
  slash(r, 32, 48, 28, 205, 335)
  r.outline('k')
  katana(r, [16, 50], [44, 28], 2)
  r.outline('k', ['e1', 'e2', 'e3', 's4'])
})

icon('rising-slash', (r) => {
  slash(r, 50, 36, 26, 110, 230)
  r.outline('k')
  katana(r, [36, 56], [44, 10], 2.2)
  r.outline('k', ['e1', 'e2', 'e3', 's4'])
})

icon('step-cut', (r) => {
  r.ellipse(14, 52, 8, 3, 'w2')
  r.ellipse(26, 54, 6, 2.5, 'w2')
  r.outline('k')
  for (const y of [26, 34, 42]) thick(r, [6, y], [20, y], 'e2', 2)
  katana(r, [24, 34], [60, 34], 2.4)
  r.outline('k', ['e2'])
})

icon('whirl-cut', (r) => {
  slash(r, 32, 32, 24, 0, 160)
  slash(r, 32, 32, 24, 180, 340)
  r.outline('k')
  katana(r, [32, 32], [52, 14], 2)
  r.outline('k', ['e1', 'e2', 'e3', 's4'])
})

icon('focus-stance', (r) => {
  katana(r, [32, 56], [34, 20], 2.6)
  r.outline('k')
  eye(r, 32, 12, 14, 6, ['e1', 'e2', 'e3'])
  r.outline('k')
})

icon('piercing-thrust', (r) => {
  katana(r, [18, 32], [60, 32], 2.8)
  r.outline('k')
  for (const [y, x] of [[22, 30], [42, 26], [32, 40]] as const) thick(r, [x, y], [x + 14, y], 'e2', 2)
  sparkle(r, 60, 32, 3, 'e3', 's4')
})

icon('heaven-rending', (r) => {
  cloud(r, [[16, 20, 10], [32, 14, 12], [48, 20, 10]], ['e1', 'e2', 'e3'])
  r.outline('k')
  r.poly([[30, 2], [36, 2], [34, 62], [32, 62]], 's4')
  r.poly([[31, 2], [33, 2], [33, 62]], 'e3')
  for (let y = 6; y < 30; y += 4) (r.set(28, y, NONE), r.set(38, y, NONE))
  r.outline('k', ['e1', 'e2', 'e3'])
  sparkle(r, 33, 40, 5, 'f4', 's4')
})

for (const [id, base] of [['cross-cut-plus', 'cross-cut'], ['rising-plus', 'rising-slash'], ['step-cut-plus', 'step-cut'], ['whirl-cut-plus', 'whirl-cut'], ['thrust-plus', 'piercing-thrust']] as const)
  icon(id, (r) => {
    copy(r, base)
    badge(r)
  })

icon('blood-on-steel', (r) => {
  katana(r, [14, 50], [52, 12])
  r.outline('k')
  for (const [x, y, s] of [[44, 26, 3], [36, 38, 2.4], [50, 44, 2]] as const) drop(r, x, y, s, ['c1', 'c2', 'c3'])
  r.outline('k', ['s1', 's2', 's3', 's4', 'e3', 'g2', 'h1', 'h2'])
})

icon('unwavering', (r) => {
  r.poly([[4, 56], [24, 20], [34, 34], [42, 26], [60, 56]], 'b2')
  r.poly([[4, 56], [24, 20], [22, 40], [12, 56]], 'b3')
  r.poly([[20, 28], [24, 20], [28, 28]], 'o3')
  r.outline('k')
  katana(r, [44, 56], [44, 18], 2)
  r.outline('k', ['b2', 'b3', 'o3'])
})

icon('flowing-blade', (r) => {
  const ribbon = curve([[6, 44], [18, 34], [32, 42], [46, 30], [58, 36]], 6)
  for (let i = 0; i + 1 < ribbon.length; i++) thick(r, ribbon[i], ribbon[i + 1], 't1', 4)
  for (let i = 0; i + 1 < ribbon.length; i++) thick(r, ribbon[i], ribbon[i + 1], 't2', 2)
  r.outline('k')
  katana(r, [16, 54], [52, 12], 2.2)
  r.outline('k', ['t1', 't2'])
})

icon('sword-soul', (r) => {
  for (const [rad, c] of [[26, 'e1'], [20, 'e2']] as const) r.ellipse(32, 30, rad * 0.7, rad, c)
  katana(r, [32, 58], [32, 4], 3)
  r.outline('k', ['e1', 'e2'])
  sparkle(r, 32, 8, 5, 'e3', 's4')
})

icon('sheath-cut', (r) => {
  thick(r, [8, 52], [40, 20], 'b1', 6)
  thick(r, [8, 52], [40, 20], 'b2', 3)
  r.outline('k')
  katana(r, [42, 18], [58, 2], 2.2)
  r.outline('k', ['b1', 'b2'])
  sparkle(r, 41, 19, 5, 'f3', 'f4')
})

icon('wind-cutter', (r) => {
  slash(r, 18, 32, 30, -50, 50, ['t1', 'e2', 'e3', 's4'])
  slash(r, 8, 32, 30, -40, 40, ['e1', 'e2', 'e3'])
  r.outline('k')
  katana(r, [14, 54], [30, 38], 1.8)
  r.outline('k', ['t1', 'e1', 'e2', 'e3', 's4'])
})

icon('edge-discipline', (r) => {
  r.rect(10, 14, 30, 38, 'o2')
  r.rect(10, 14, 30, 4, 'o1')
  for (const y of [24, 30, 36, 42]) r.line(16, y, 34, y, 'b2')
  r.outline('k')
  katana(r, [24, 58], [56, 10], 2.2)
  r.outline('k', ['o1', 'o2', 'b2'])
})

icon('steady-breath', (r) => {
  arc(r, 32, 32, 24, 0, 360, 'e1', 2)
  for (const [y, len] of [[24, 30], [32, 36], [40, 26]] as const) {
    const pts = curve([[32 - len / 2, y], [32, y - 4], [32 + len / 2, y]], 6)
    for (let i = 0; i + 1 < pts.length; i++) thick(r, pts[i], pts[i + 1], 'e2', 2)
  }
  r.outline('k')
  sparkle(r, 32, 12, 2, 'e3', 's4')
})

// ================================================================ the Sword Saint, and Sword Heart: silver, the moon, cold blue

/** A crescent moon: a disc with another cut out of it. */
function moon(r: Raster, cx: number, cy: number, rad: number, cut: P, ramp: Ramp): void {
  const tmp = new Raster(S, S)
  tmp.ellipse(cx, cy, rad, rad, ramp[1])
  tmp.ellipse(cx - rad * 0.25, cy + rad * 0.2, rad * 0.55, rad * 0.55, ramp[2])
  tmp.ellipse(cx + cut[0], cy + cut[1], rad * 0.86, rad * 0.86, NONE)
  for (let i = 0; i < tmp.px.length; i++) if (tmp.px[i]) r.px[i] = tmp.px[i]
}

icon('path-swordsaint', (r) => {
  ball(r, 32, 32, 24, ['b1', 'e1', 'e1', 'e2'])
  r.outline('k')
  moon(r, 30, 26, 14, [6, -5], ['o1', 'o2', 'o3'])
  katana(r, [16, 52], [52, 14])
  r.outline('k', ['b1', 'e1', 'e2', 'o1', 'o2', 'o3'])
})

icon('iaido-stance', (r) => {
  thick(r, [6, 44], [44, 44], 'b1', 6)
  thick(r, [6, 44], [44, 44], 'b2', 3)
  r.ellipse(46, 44, 5, 5, 'g2')
  for (let x = 50; x <= 60; x++) r.rect(x, 43, 1, 3, x % 3 ? 'h1' : 'h2')
  r.outline('k')
  for (const [rad, c] of [[18, 'e2'], [12, 'e3']] as const) arc(r, 46, 44, rad, 200, 340, c, 1)
  sparkle(r, 46, 26, 3, 'e3', 's4')
})

icon('iaido', (r) => {
  r.poly([[2, 34], [62, 30], [62, 34], [2, 36]], 'e3')
  r.line(2, 33, 62, 31, 's4')
  r.outline('k')
  figure(r, 50, 30, 30, ['b1', 'b2', 'b3'])
  r.outline('k', ['e3', 's4'])
  katana(r, [44, 44], [62, 48], 1.6)
  r.outline('k', ['e3', 's4', 'b1', 'b2', 'b3'])
  for (const x of [10, 22]) sparkle(r, x, 33, 2, 's4', 's4')
})

icon('phantom-sword-dance', (r) => {
  for (const [a, b] of [[[12, 54], [24, 8]], [[52, 54], [40, 8]]] as [P, P][]) katana(r, a, b, 2.2, ['e1', 'e1', 'e2'], 'e1', ['e1', 'e2'])
  katana(r, [32, 58], [32, 4], 2.6)
  r.outline('k', ['e1', 'e2'])
  sparkle(r, 32, 6, 3, 'e3', 's4')
})

icon('swallow-return', (r) => {
  arc(r, 32, 34, 22, 200, 520, 'e2', 2)
  r.poly([[12, 26], [6, 34], [14, 36]], 'e2')
  r.outline('k')
  swallow(r, 34, 24, 14, 'b2', 's3')
  r.outline('k', ['e2'])
  katana(r, [20, 58], [44, 42], 1.8)
  r.outline('k', ['e2', 'b2', 's3'])
})

icon('zanshin', (r) => {
  thick(r, [12, 16], [52, 56], 'r2', 4)
  thick(r, [52, 16], [12, 56], 'r2', 4)
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) if ((x + y) % 2 === 0 && r.get(x, y) === 'r2') r.set(x, y, NONE)
  katana(r, [16, 30], [60, 54], 2.2)
  r.outline('k', ['r2'])
})

icon('flowing-water', (r) => {
  for (const [y, c] of [[40, 'e1'], [48, 'e2'], [56, 'e1']] as const) {
    const wave = curve([[2, y], [16, y - 6], [32, y], [48, y - 6], [62, y]], 6)
    for (let i = 0; i + 1 < wave.length; i++) thick(r, wave[i], wave[i + 1], c, 3)
  }
  r.outline('k')
  katana(r, [14, 34], [54, 8], 2.2)
  r.outline('k', ['e1', 'e2'])
})

icon('flash-step', (r) => {
  figure(r, 14, 16, 36, ['e1', 'e1', 'e2'])
  figure(r, 28, 14, 38, ['e1', 'e2', 'e3'])
  figure(r, 46, 12, 40, ['b1', 'b2', 'b3'])
  r.outline('k', ['e1', 'e2', 'e3'])
  for (const y of [30, 40, 50]) thick(r, [4, y], [12, y], 's4', 1)
})

for (const [id, base] of [['swallow-plus', 'swallow-return'], ['iaido-plus', 'iaido'], ['dance-plus', 'phantom-sword-dance']] as const)
  icon(id, (r) => {
    copy(r, base)
    badge(r)
  })

icon('wind-blade', (r) => {
  for (const [rad, c] of [[24, 't1'], [17, 't2'], [10, 't3']] as const) arc(r, 32, 32, rad, 0, 300, c, 2)
  r.outline('k')
  katana(r, [12, 52], [52, 12], 2.4)
  r.outline('k', ['t1', 't2', 't3'])
})

icon('issen', (r) => {
  moon(r, 32, 32, 24, [0, 0.01], ['e1', 'o2', 'o3'])
  r.ellipse(32, 32, 22, 22, 'o2')
  ball(r, 32, 32, 20, ['o1', 'o2', 'o3'])
  r.outline('k')
  // the moon cut in two: a line of light straight through it, the halves pushed apart
  for (let y = 4; y < 60; y++) for (let x = 4; x < 60; x++) if (Math.abs(x - y) <= 1 && r.get(x, y)) r.set(x, y, NONE)
  thick(r, [6, 6], [58, 58], 's4', 2)
  r.line(6, 7, 57, 58, 'e3')
  sparkle(r, 32, 32, 6, 'f4', 's4')
})

icon('mastery-swordsaint', (r) => {
  ball(r, 32, 30, 24, ['e1', 'e2', 'e2', 'e3'])
  r.outline('k')
  heart(r, 32, 30, 12, ['o1', 'o3', 's4'])
  r.outline('k', ['e1', 'e2', 'e3'])
  katana(r, [32, 60], [32, 4], 2.6)
  r.outline('k', ['e1', 'e2', 'e3', 'o1', 'o3', 's4'])
})

icon('sword-heart', (r) => {
  heart(r, 32, 34, 18, ['e1', 'e2', 'e3'])
  r.outline('k')
  katana(r, [12, 56], [54, 12], 2.2)
  r.outline('k', ['e1', 'e2', 'e3'])
  sparkle(r, 32, 30, 4, 's4', 's4')
})

icon('mirror-stance', (r) => {
  r.ellipse(32, 46, 28, 10, 'e1')
  r.ellipse(32, 46, 24, 8, 'e2')
  r.ellipse(26, 44, 10, 3, 'e3')
  r.outline('k')
  katana(r, [32, 40], [32, 4], 2.4)
  // its reflection, upside down and faint, in the still water
  for (let y = 48; y < 56; y += 2) r.line(31, y, 33, y, 's3')
  r.outline('k', ['e1', 'e2', 'e3'])
})

icon('void-slash', (r) => {
  slash(r, 0, 32, 54, -36, 36)
  slash(r, -10, 32, 54, -30, 30, ['e1', 'e2', 'e3'])
  r.outline('k')
  for (const [x, y] of [[50, 14], [56, 48]] as const) sparkle(r, x, y, 2, 'e3', 's4')
})

icon('no-mind', (r) => {
  // an ensō: one stroke of the brush round an empty middle, left open
  for (let a = 30; a <= 340; a += 4) {
    const t = (a * Math.PI) / 180
    const w = 2 + 2.5 * Math.sin(((a - 30) / 310) * Math.PI)
    r.ellipse(32 + Math.cos(t) * 22, 32 + Math.sin(t) * 22, w, w, 'b1')
  }
  r.outline('k')
  sparkle(r, 32, 32, 3, 'e3', 's4')
})

icon('iaido-mastery', (r) => {
  copy(r, 'iaido')
  r.poly([[2, 44], [62, 40], [62, 43], [2, 46]], 'e2')
  r.outline('k', ['e3', 's4', 'e2'])
  badge(r)
})

icon('ten-thousand-swords', (r) => {
  for (const [x, y] of [[10, 6], [24, 14], [38, 4], [52, 12], [16, 30], [32, 26], [46, 32], [58, 28]] as const) katana(r, [x, y], [x, y + 20], 1.4)
  r.outline('k')
  r.rect(2, 58, 60, 3, 'b2')
  for (const x of [10, 24, 38, 52]) sparkle(r, x, 56, 2, 'e3', 's4')
})

icon('sword-god', (r) => {
  for (let i = 0; i < 12; i++) {
    const t = (i * Math.PI) / 6
    thick(r, [32 + Math.cos(t) * 12, 30 + Math.sin(t) * 12], [32 + Math.cos(t) * 28, 30 + Math.sin(t) * 28], i % 2 ? 'g2' : 'g3', 2)
  }
  ball(r, 32, 30, 11, ['g1', 'g2', 'g3', 'f4'])
  r.outline('k', ['g2', 'g3'])
  katana(r, [32, 60], [32, 6], 2.8)
  r.outline('k', ['g1', 'g2', 'g3', 'f4'])
})

// ================================================================ the Sacrificer, and the Mad Martyr: crimson, black, a god's gold

icon('path-sacrificer', (r) => {
  heart(r, 32, 30, 18, ['c1', 'c2', 'c3'])
  r.outline('k')
  katana(r, [16, 50], [54, 10], 2.4)
  r.outline('k', ['c1', 'c2', 'c3'])
  for (const [x, y, s] of [[22, 50, 2.6], [32, 56, 2.2], [44, 52, 2]] as const) drop(r, x, y, s, ['c1', 'c2', 'c3'])
  r.outline('k', ['c1', 'c2', 'c3', 's1', 's2', 's3', 's4', 'e3', 'g2', 'h1', 'h2'])
})

icon('pain-pact', (r) => {
  r.rect(12, 10, 34, 40, 'o2')
  r.rect(12, 10, 34, 4, 'o1')
  for (const y of [20, 26, 32]) r.line(18, y, 40, y, 'c2')
  r.outline('k')
  ball(r, 40, 46, 9, ['c1', 'c2', 'c3'])
  r.outline('k', ['o1', 'o2'])
  thick(r, [48, 6], [58, 30], 'w1', 2)
  for (const [x, y] of [[50, 12], [53, 18], [56, 24]] as const) (r.set(x - 2, y, 'w1'), r.set(x + 2, y - 1, 'w1'))
})

icon('blood-offering', (r) => {
  r.poly([[16, 16], [48, 16], [44, 34], [36, 40], [28, 40], [20, 34]], 'g2')
  r.poly([[18, 18], [46, 18], [44, 24], [20, 24]], 'c2')
  r.rect(30, 40, 4, 12, 'g1')
  r.rect(22, 52, 20, 4, 'g2')
  r.set(24, 28, 'g3')
  r.outline('k')
  drop(r, 32, 10, 3, ['c1', 'c2', 'c3'])
  r.outline('k', ['g1', 'g2', 'g3', 'c2'])
})

icon('crimson-whirl', (r) => {
  slash(r, 32, 32, 24, 0, 160, ['c1', 'c2', 'c3', 'r3'])
  slash(r, 32, 32, 24, 180, 340, ['c1', 'c2', 'c3', 'r3'])
  r.outline('k')
  for (const [x, y] of [[8, 10], [56, 12], [54, 56], [10, 54]] as const) drop(r, x, y, 2, ['c1', 'c2', 'c3'])
  r.outline('k', ['c1', 'c2', 'c3', 'r3'])
})

icon('rending-sacrifice', (r) => {
  slash(r, 32, 52, 30, 210, 330, ['c1', 'c2', 'c3', 'r3'])
  r.outline('k')
  katana(r, [12, 56], [46, 24], 2.2)
  r.outline('k', ['c1', 'c2', 'c3', 'r3'])
  for (const [x, y] of [[12, 44], [18, 40]] as const) drop(r, x, y, 2, ['c1', 'c2', 'c3'])
})

icon('agony', (r) => {
  for (let i = 0; i < 14; i++) {
    const t = (i * Math.PI) / 7
    const a: P = [32 + Math.cos(t) * 20, 32 + Math.sin(t) * 20]
    const b: P = [32 + Math.cos(t + 0.2) * 28, 32 + Math.sin(t + 0.2) * 28]
    thick(r, a, b, 'w1', 2)
  }
  arc(r, 32, 32, 20, 0, 360, 'w2', 3)
  r.outline('k')
  for (let i = 0; i < 4; i++) r.rect(24, 40 - i * 6, 16, 4, i < 3 ? 'c2' : 'c3')
  r.outline('k', ['w1', 'w2'])
})

icon('blood-drinker', (r) => {
  r.poly([[10, 20], [54, 20], [50, 30], [14, 30]], 'b2')
  for (const x of [20, 44]) r.poly([[x - 4, 30], [x + 4, 30], [x, 46]], 'o3')
  r.outline('k')
  for (const x of [20, 44]) drop(r, x, 54, 2.6, ['c1', 'c2', 'c3'])
  r.outline('k', ['b2', 'o3'])
})

icon('frenzy', (r) => {
  flame(r, 32, 58, 22, ['r1', 'r2', 'f3'])
  r.outline('k')
  for (const x of [24, 40]) r.poly([[x - 6, 36], [x + 6, 34], [x + 4, 38], [x - 4, 40]], 'f4')
  for (const x of [24, 40]) r.set(x, 37, 'c1')
  r.outline('k', ['r1', 'r2', 'f3'])
})

icon('numbness', (r) => {
  heart(r, 32, 30, 20, ['m1', 'm2', 'm3'])
  r.outline('k')
  for (let y = 18; y < 50; y += 6) (thick(r, [28, y], [36, y + 2], 'b1', 1), r.set(32, y + 1, 'b1'))
  r.line(32, 16, 32, 52, 'b2')
})

icon('offering-plus', (r) => {
  copy(r, 'blood-offering')
  badge(r)
})

icon('undying-rage', (r) => {
  heart(r, 32, 38, 16, ['c1', 'c2', 'c3'])
  r.outline('k')
  flame(r, 32, 30, 12, ['r1', 'r2', 'f3'])
  r.outline('k', ['c1', 'c2', 'c3'])
})

icon('crimson-whirl-plus', (r) => {
  copy(r, 'crimson-whirl')
  badge(r)
})

// the Five's nails, dull, in a row; the sixth, one's own, red and driven into the heart
icon('sixth-suffering', (r) => {
  heart(r, 32, 40, 16, ['c1', 'c2', 'c3'])
  r.outline('k')
  for (const x of [8, 18, 28, 38, 48]) {
    r.rect(x + 1, 6, 3, 12, 'm1')
    r.rect(x - 1, 4, 7, 3, 'm2')
    r.set(x + 2, 18, 'm1')
  }
  r.outline('k', ['c1', 'c2', 'c3'])
  r.poly([[28, 14], [36, 14], [33, 52], [31, 52]], 'r2')
  r.poly([[30, 14], [32, 14], [32, 50]], 'r3')
  r.rect(24, 10, 16, 4, 'g2')
  r.rect(24, 10, 16, 1, 'g3')
  r.outline('k', ['c1', 'c2', 'c3', 'm1', 'm2'])
  for (const [x, y] of [[22, 56], [42, 58]] as const) drop(r, x, y, 1.6, ['c1', 'c2', 'c3'])
})

icon('mastery-sacrificer', (r) => {
  flame(r, 32, 62, 28, ['c1', 'c2', 'r3'])
  r.outline('k')
  figure(r, 32, 14, 46, ['b1', 'b2', 'c2'])
  r.outline('k', ['c1', 'c2', 'r3'])
  for (const [a, b] of [[[20, 30], [14, 22]], [[44, 30], [50, 22]], [[24, 48], [16, 52]], [[40, 48], [48, 52]]] as [P, P][]) thick(r, a, b, 'w1', 2)
  for (const x of [28, 36]) r.set(x, 22, 'g3')
})

icon('pain-vessel', (r) => {
  r.poly([[22, 10], [42, 10], [40, 18], [50, 30], [48, 50], [40, 58], [24, 58], [16, 50], [14, 30], [24, 18]], 'b2')
  r.poly([[17, 34], [47, 34], [46, 50], [40, 55], [24, 55], [18, 50]], 'c2')
  r.poly([[18, 34], [28, 34], [28, 54], [24, 55], [18, 50]], 'c3')
  r.rect(20, 8, 24, 4, 'b3')
  r.outline('k')
  for (const [x, y] of [[30, 26], [38, 22]] as const) drop(r, x, y, 1.6, ['c1', 'c2', 'c3'])
})

icon('flesh-for-blade', (r) => {
  katana(r, [14, 52], [52, 10], 2.8, ['c1', 'c2', 'c3', 'r3'], 'b3', ['b1', 'b2'])
  r.outline('k')
  for (const [x, y] of [[46, 26], [38, 36], [30, 44]] as const) drop(r, x + 4, y + 6, 2, ['c1', 'c2', 'c3'])
  r.outline('k', ['c1', 'c2', 'c3', 'r3', 'b1', 'b2', 'b3'])
  sparkle(r, 52, 10, 3, 'r3', 'f4')
})

icon('pain-spread', (r) => {
  for (const [rad, c] of [[26, 'c1'], [19, 'c2'], [12, 'c3']] as const) arc(r, 32, 32, rad, 0, 360, c, 2)
  ball(r, 32, 32, 6, ['c1', 'c2', 'c3'])
  r.outline('k', ['c1', 'c2', 'c3'])
  for (let i = 0; i < 8; i++) {
    const t = (i * Math.PI) / 4
    drop(r, 32 + Math.cos(t) * 26, 32 + Math.sin(t) * 26, 1.6, ['c1', 'c2', 'c3'])
  }
})

icon('feed-on-pain', (r) => {
  r.poly([[22, 10], [42, 10], [42, 14], [34, 30], [42, 46], [42, 54], [22, 54], [22, 46], [30, 30], [22, 14]], 'o2')
  r.poly([[24, 14], [40, 14], [32, 28]], 'c2')
  r.poly([[32, 34], [40, 50], [24, 50]], 'c2')
  r.rect(18, 6, 28, 4, 'w2')
  r.rect(18, 54, 28, 4, 'w2')
  r.outline('k')
  for (const y of [32, 36, 40]) r.set(32, y, 'c3')
})

icon('sixth-suffering-plus', (r) => {
  copy(r, 'sixth-suffering')
  badge(r)
})

icon('final-offering', (r) => {
  r.ellipse(32, 32, 24, 24, 'b1')
  r.outline('k')
  slash(r, 52, 52, 46, 190, 260, ['c1', 'c2', 'c3', 'r3'])
  r.outline('k', ['b1'])
  for (const [x, y] of [[16, 46], [24, 52], [44, 18]] as const) drop(r, x, y, 2, ['c1', 'c2', 'c3'])
})

icon('undying-avatar', (r) => {
  figure(r, 32, 6, 54, ['b1', 'b2', 'b3'])
  r.outline('k')
  // its cracks, a god's gold shining through them
  for (const [a, b] of [[[28, 20], [34, 30]], [[34, 30], [30, 40]], [[30, 40], [36, 52]], [[22, 36], [28, 44]]] as [P, P][]) thick(r, a, b, 'g3', 1)
  sparkle(r, 32, 12, 3, 'f4', 's4')
})

// ================================================================ the Spellblade, and the Nightbreaker: an arcane violet; fire, ice, lightning

const FIRE: Ramp = ['r1', 'r2', 'f3', 'f4']
const ICE: Ramp = ['e1', 'e2', 'e3', 's4']
const VOLT: Ramp = ['y1', 'y2', 'y3', 's4']
const ARCANE: Ramp = ['v1', 'v3', 'v4', 's4']

/** A bolt of lightning along its turns: thick in its dark, a bright core. */
function bolt(r: Raster, pts: P[], ramp: Ramp = VOLT, w = 3): void {
  for (let i = 0; i + 1 < pts.length; i++) thick(r, pts[i], pts[i + 1], ramp[1], w)
  for (let i = 0; i + 1 < pts.length; i++) thick(r, pts[i], pts[i + 1], ramp[2], 1)
}

/** A snowflake: three strokes through its middle, a pair of twigs on each arm. */
function flake(r: Raster, cx: number, cy: number, s: number, c = 'e3', tip = 's4'): void {
  for (let i = 0; i < 6; i++) {
    const t = (i * Math.PI) / 3
    const end: P = [cx + Math.cos(t) * s, cy + Math.sin(t) * s]
    thick(r, [cx, cy], end, c, 1)
    const mid: P = [cx + Math.cos(t) * s * 0.6, cy + Math.sin(t) * s * 0.6]
    for (const o of [-0.6, 0.6]) thick(r, mid, [mid[0] + Math.cos(t + o) * s * 0.3, mid[1] + Math.sin(t + o) * s * 0.3], c, 1)
    r.set(end[0], end[1], tip)
  }
}

/** A ring of runes: a circle and the marks on it, a spell's. */
function runes(r: Raster, cx: number, cy: number, rad: number, c = 'v3', mark = 'v4'): void {
  arc(r, cx, cy, rad, 0, 360, c, 2)
  arc(r, cx, cy, rad - 5, 0, 360, c, 1)
  for (let i = 0; i < 8; i++) {
    const t = (i * Math.PI) / 4 + 0.2
    r.rect(cx + Math.cos(t) * (rad - 2.5) - 1, cy + Math.sin(t) * (rad - 2.5) - 1, 2, 2, mark)
  }
}

icon('path-spellblade', (r) => {
  ball(r, 32, 32, 24, ['v1', 'v2', 'v2', 'v3'])
  r.outline('k')
  runes(r, 32, 32, 19, 'v3', 'v4')
  katana(r, [16, 52], [52, 14], 2.4, ARCANE)
  r.outline('k', ['v1', 'v2', 'v3', 'v4'])
  flame(r, 12, 20, 5, ['r1', 'r2', 'f3'])
  flake(r, 52, 46, 6)
  bolt(r, [[50, 4], [45, 12], [50, 13], [44, 22]], VOLT, 2)
})

icon('blade-and-spell', (r) => {
  runes(r, 32, 32, 22)
  katana(r, [14, 50], [52, 12], 2.6)
  r.outline('k', ['v3', 'v4'])
  sparkle(r, 46, 18, 4, 'v4', 's4')
  sparkle(r, 18, 22, 2, 'v3', 'v4')
})

icon('flame-enchant', (r) => {
  // the fire licking up both sides of the blade
  for (const [x, y, sz] of [[24, 46, 7], [40, 40, 7], [25, 28, 5], [39, 22, 5], [27, 14, 3]] as const) flame(r, x, y, sz, ['r1', 'r2', 'f3'])
  r.outline('k')
  katana(r, [32, 58], [32, 4], 2.8, FIRE)
  r.outline('k', ['r1', 'r2', 'f3'])
  sparkle(r, 32, 4, 3, 'f3', 'f4')
})

icon('frost-enchant', (r) => {
  katana(r, [32, 58], [32, 4], 2.8, ICE)
  r.outline('k')
  for (const [x, y, s] of [[16, 16, 8], [48, 26, 7], [18, 42, 5]] as const) flake(r, x, y, s)
  for (const [x, y] of [[46, 46], [26, 6]] as const) sparkle(r, x, y, 2, 'e3', 's4')
})

icon('thunder-enchant', (r) => {
  katana(r, [32, 58], [32, 4], 2.8, VOLT)
  r.outline('k')
  bolt(r, [[20, 6], [14, 16], [22, 18], [14, 32]])
  bolt(r, [[46, 18], [52, 28], [44, 30], [50, 44]])
  r.outline('k', ['y1', 'y2', 'y3', 's4', 'g2', 'h1', 'h2'])
})

icon('arcane-edge', (r) => {
  katana(r, [12, 52], [54, 10], 3, ARCANE)
  r.outline('k')
  for (const t of [10, 20, 30, 40]) {
    const x = 12 + (42 * t) / 50
    const y = 52 - (42 * t) / 50
    r.rect(x + 3, y + 3, 2, 2, 'v4')
  }
  for (const [x, y] of [[52, 30], [26, 14], [40, 50]] as const) sparkle(r, x, y, 3, 'v3', 'v4')
})

icon('mana-tempered', (r) => {
  flame(r, 32, 60, 16, ['v1', 'v2', 'v3'])
  r.outline('k')
  katana(r, [6, 30], [58, 30], 2.8)
  r.outline('k', ['v1', 'v2', 'v3'])
  for (const [x, y] of [[18, 20], [46, 16]] as const) sparkle(r, x, y, 2, 'v4', 's4')
})

icon('flame-slash', (r) => {
  slash(r, 32, 50, 28, 205, 335, FIRE)
  r.outline('k')
  for (const [x, y] of [[14, 38], [32, 26], [50, 38]] as const) flame(r, x, y, 4, ['r1', 'r2', 'f3'])
  r.outline('k', ['r1', 'r2', 'f3', 'f4'])
  katana(r, [20, 58], [44, 36], 1.8)
})

icon('thunder-thrust', (r) => {
  katana(r, [6, 44], [34, 30], 2.4)
  r.outline('k')
  bolt(r, [[34, 30], [42, 22], [44, 30], [52, 20], [54, 26], [62, 14]])
  r.outline('k', ['s1', 's2', 's3', 's4', 'e3', 'g2', 'h1', 'h2'])
  sparkle(r, 34, 30, 3, 'y3', 's4')
})

icon('frost-ring', (r) => {
  arc(r, 32, 32, 26, 0, 360, 'e1', 4)
  arc(r, 32, 32, 26, 0, 360, 'e2', 2)
  arc(r, 32, 32, 25, 20, 160, 'e3', 1)
  r.outline('k')
  for (let i = 0; i < 6; i++) {
    const t = (i * Math.PI) / 3 + 0.5
    flake(r, 32 + Math.cos(t) * 26, 32 + Math.sin(t) * 26, 4)
  }
  katana(r, [22, 44], [44, 20], 2.2, ICE)
  r.outline('k', ['e1', 'e2', 'e3', 's4'])
})

icon('thunder-thrust-plus', (r) => {
  copy(r, 'thunder-thrust')
  badge(r)
})

icon('blade-channel', (r) => {
  arc(r, 32, 32, 24, 200, 520, 'v3', 3)
  r.poly([[8, 18], [20, 18], [12, 28]], 'v3')
  r.outline('k')
  katana(r, [32, 58], [32, 6], 2.6)
  r.outline('k', ['v3'])
  for (const [x, y] of [[48, 14], [14, 46]] as const) sparkle(r, x, y, 2, 'v4', 's4')
})

icon('trinity-cut', (r) => {
  slash(r, 32, 30, 22, 205, 335, FIRE)
  slash(r, 32, 44, 22, 205, 335, ICE)
  slash(r, 32, 58, 22, 205, 335, VOLT)
  r.outline('k')
  sparkle(r, 32, 6, 3, 'v4', 's4')
})

// the Nightbreaker: the night cut through, the dawn behind it shining out along the blade
icon('mastery-spellblade', (r) => {
  ball(r, 32, 32, 26, ['b1', 'b1', 'b1'])
  r.outline('k')
  for (const [x, y] of [[14, 22], [24, 10], [30, 18], [52, 38], [46, 56], [34, 50]] as P[]) r.set(x, y, 'o2')
  // the rift's light, widest at its middle, kept within the night it cuts
  const tmp = new Raster(S, S)
  for (const [c, w0, w1] of [['g1', 1, 6.5], ['g2', 0.5, 4.5], ['g3', 0, 2.8], ['f4', 0, 1.2]] as [string, number, number][])
    for (let i = 0; i <= 40; i++) {
      const t = i / 40
      const w = w0 + Math.sin(t * Math.PI) * w1
      if (w > 0.4) tmp.ellipse(8 + t * 48, 56 - t * 48, w, w, c)
    }
  tmp.px.forEach((c, i) => c && Math.hypot((i % S) - 32, Math.floor(i / S) - 32) <= 25 && (r.px[i] = c))
  katana(r, [20, 44], [54, 10], 2.2, ARCANE)
  r.outline('k', ['b1', 'o2', 'g1', 'g2', 'g3', 'f4'])
  sparkle(r, 32, 32, 4, 'f4', 's4')
  flame(r, 20, 30, 4, ['r1', 'r2', 'f3'])
  bolt(r, [[50, 28], [46, 34], [50, 34], [46, 41]], VOLT, 2)
  flake(r, 38, 50, 4)
})

// a katana crossed with a staff and its orb
icon('blade-spell-union', (r) => {
  thick(r, [14, 10], [50, 56], 'w1', 4)
  thick(r, [14, 10], [50, 56], 'w3', 1)
  ball(r, 12, 8, 6, ARCANE)
  r.outline('k')
  katana(r, [14, 52], [54, 10], 2.6)
  r.outline('k', ['w1', 'w3', 'v1', 'v3', 'v4', 's4'])
  sparkle(r, 32, 32, 4, 'v4', 's4')
})

// the three, thrown through a prism into one blade
icon('prism-enchant', (r) => {
  r.poly([[32, 2], [48, 26], [16, 26]], 'o2')
  r.poly([[32, 6], [32, 24], [20, 24]], 'o3')
  r.outline('k')
  thick(r, [24, 26], [30, 50], 'r2', 2)
  thick(r, [32, 26], [32, 50], 'e2', 2)
  thick(r, [40, 26], [34, 50], 'y2', 2)
  r.outline('k', ['o2', 'o3'])
  katana(r, [32, 62], [32, 44], 2.4, ARCANE)
  r.outline('k', ['o2', 'o3', 'r2', 'e2', 'y2'])
})

// lightning, cut in two
icon('raikiri', (r) => {
  bolt(r, [[30, 2], [20, 18], [30, 22], [24, 32]], VOLT, 4)
  bolt(r, [[34, 32], [44, 38], [36, 46], [44, 62]], VOLT, 4)
  r.outline('k')
  thick(r, [4, 40], [60, 22], 's3', 2)
  thick(r, [4, 40], [60, 22], 's4', 1)
  r.outline('k', ['y1', 'y2', 'y3', 's4'])
  for (const [x, y] of [[24, 32], [34, 32]] as const) sparkle(r, x, y, 3, 'y3', 's4')
})

icon('ringing-blade', (r) => {
  for (const [rad, c] of [[14, 'v3'], [20, 'v2'], [26, 'v1']] as const) {
    arc(r, 32, 30, rad, 130, 230, c, 2)
    arc(r, 32, 30, rad, -50, 50, c, 2)
  }
  r.outline('k')
  katana(r, [32, 60], [32, 4], 2.6)
  r.outline('k', ['v1', 'v2', 'v3'])
  sparkle(r, 32, 6, 3, 'v4', 's4')
})

// a star falling in fire, the blade coming down with it
icon('meteor-cut', (r) => {
  for (let i = 0; i < 4; i++) thick(r, [6 + i * 3, 4], [30 + i * 2, 30], i % 2 ? 'r2' : 'f3', 2)
  ball(r, 36, 34, 12, ['r1', 'r2', 'f3', 'f4'])
  r.outline('k')
  katana(r, [56, 20], [26, 58], 2.4, FIRE)
  r.outline('k', ['r1', 'r2', 'f3', 'f4'])
  r.rect(4, 60, 56, 2, 'b2')
})

icon('ten-thousand-thunders', (r) => {
  cloud(r, [[16, 14, 10], [32, 10, 12], [48, 14, 10]], ['b1', 'b2', 'b3'])
  r.outline('k')
  for (const x of [12, 30, 48]) bolt(r, [[x + 4, 22], [x - 2, 34], [x + 4, 36], [x, 52]], VOLT, 3)
  r.outline('k', ['b1', 'b2', 'b3'])
  for (const x of [8, 26, 44]) katana(r, [x + 8, 62], [x + 8, 50], 1.2)
})

// no seam between them: a loop half of steel, half of the arcane, the blade through its knot
icon('seamless', (r) => {
  arc(r, 20, 32, 12, 0, 360, 's2', 4)
  arc(r, 44, 32, 12, 0, 360, 'v2', 4)
  arc(r, 20, 32, 12, 200, 330, 's4', 1)
  arc(r, 44, 32, 12, 200, 330, 'v4', 1)
  r.outline('k')
  katana(r, [32, 60], [32, 4], 2.6, ['g1', 'g2', 'g3', 'f4'])
  r.outline('k', ['s2', 's4', 'v2', 'v4'])
  for (const [x, y] of [[10, 10], [54, 10], [54, 54]] as const) sparkle(r, x, y, 2, 'f3', 'f4')
})

// ---------------------------------------------------------------- write them (never over another's picture)

const MINE = Object.keys(out)
for (const id of MINE) {
  const path = join(OUT, 'skills', `${id}.png`)
  if (existsSync(path) && !process.argv.includes('--again')) throw new Error(`skills/${id}.png is already drawn (pass --again to redraw this file's own)`)
}
for (const [id, r] of Object.entries(out)) writeAtlas(`skills/${id}.png`, [[r]], PAL)
console.log(`${MINE.length} swordsman icons → public/assets/lsw/skills`)
