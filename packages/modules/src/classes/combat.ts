// Automatic combat talents. Every actor uses the same calculations; only input chooses
// the player. Timers, fractional cadence and combo state are deterministic and saved.
//
// Where they act (design.md §5.13, A2–A3): what a talent does to the striker's blow (its power,
// a critical, a bleed it opens, health it draws back) is computed by the striker's act-making and
// carried by the act; what the one struck takes is its own outcome (`hurt`: dodges, guards, the
// brink); what a defeat gives back is the striker's rule (content: combat/learn). The memory of
// one's own blows and steps (`Entity.combat`) is written only by its owner.

import { DIRS, offhandOf, weaponOf, type Engine, type Entity, type SkillDef, type SkillPassive, type World } from '@openworld/engine'
import { ownWeapon } from './profession.ts'

const skill = (w: World, e: Entity, id: string): boolean => w.hasTag(e, `skill:${id}`)
const of = (profession: string) => (w: World, e: Entity, id: string): boolean => w.prop(e, 'profession') === profession && skill(w, e, id)
const assassin = of('assassin')
const ranger = of('ranger')
const mage = of('mage')
const professionIs = (w: World, e: Entity, profession: string): boolean => w.prop(e, 'profession') === profession
/**
 * A profession's talents answer only its own weapons (profession.ts): the assassin's dagger, the
 * ranger's bow, the mage's staff, the swordsman's katana. A common weapon (a sword, an axe, a mace, a
 * wand) takes none of them; the shared branches serve every weapon alike.
 */
const own = (w: World, a: Entity, weapon: Entity | undefined): weapon is Entity => ownWeapon(w, a, weapon)

/** How far a Hawkeye's arrows fly (Hawk's Sight): as far as the map goes, the first body or wall stopping them. */
const MAP_WIDE = 200
/** Reach a profession adds to its own weapon (the ranger's bow, a Sniper's long shot, its quiver's fletching). */
export function rangeBonus(w: World, a: Entity, weapon: Entity | undefined): number {
  // Far Sight (actives.ts `aim`): a weapon that shoots reaches farther while it lasts
  const aim = (a.combat?.aimUntil ?? 0) > w.state.tick && !!weapon && w.num(weapon, 'range', 1) > 1 ? 3 : 0
  if (!own(w, a, weapon)) return aim
  const shoots = w.num(weapon, 'range', 1) > 1
  // (Hawk's Sight, a Hawkeye's: the bow's arrows fly to the map's edge)
  if (shoots && ranger(w, a, 'hawks-sight')) return MAP_WIDE
  const fletched = offhandsOf(w, a).has('fletch') && shoots ? 1 : 0
  const long = shoots && ranger(w, a, 'long-shot') ? 2 : 0
  if (ranger(w, a, 'ranger-archery')) return 1 + aim + fletched + long
  return aim + fletched + long
}
/**
 * The unique powers of what one holds and wears: a Stigmatic piece's `relic` (content items.ts RELICS) — each
 * one of its kind in the world, each answered here as a talent is.
 */
export function relicsOf(w: World, e: Entity): Set<string> {
  return powersOf(w, e, 'relic')
}
/**
 * The vows of what one holds and wears: a Vowbound piece's `vow` (content items.ts VOWS; a quality's `vows` in the
 * ontology names what a made piece may take) — each a promise kept with a condition and what it pays, answered
 * here as a talent is. Two pieces of one vow are one vow.
 */
export function vowsOf(w: World, e: Entity): Set<string> {
  return powersOf(w, e, 'vow')
}
/**
 * The powers a set worn together grants of its own (content SET_POWERS: a bonus's `power`, World.setBonuses), each
 * answered here as a talent is. Two sets of one power are one power.
 */
/**
 * The powers of one's off-hand piece (content items.ts: each profession's own, its `offhand` — the parrying dagger's
 * second cut, the quiver's fletching, the tome's lore, the scabbard's draw), answered here as a talent is.
 */
export function offhandsOf(w: World, e: Entity): Set<string> {
  const piece = offhandOf(w, e)
  const power = piece && w.prop(piece, 'offhand')
  return new Set(typeof power === 'string' ? [power] : [])
}
export function setPowersOf(w: World, e: Entity): Set<string> {
  return new Set(w.setBonuses(e).flatMap((b) => (b.power ? [b.power] : [])))
}
function powersOf(w: World, e: Entity, key: 'relic' | 'vow'): Set<string> {
  const out = new Set<string>()
  const held = w.get(e.held)
  const weapon = weaponOf(w, e)
  // what is held, the weapon one fights with, and what is worn — a weapon kept in the main hand only while it is the one fought with
  for (const it of [...(held ? [held] : []), ...(weapon ? [weapon] : []), ...w.worn(e).filter((it) => w.prop(it, 'slot') !== 'weapon')]) {
    const r = w.prop(it, key)
    if (typeof r === 'string') out.add(r)
  }
  // and what a set worn together grants (World.setBonuses: a bonus's `vow`, `relic`)
  for (const b of w.setBonuses(e)) if (b[key]) out.add(b[key]!)
  return out
}
/** Below this share of one's food, one is hungry (Light as Chaff). */
const hungry = (w: World, e: Entity): boolean => w.num(e, 'hunger', w.num(e, 'maxHunger', 1)) < w.num(e, 'maxHunger', 1) * 0.5
/** How many relics one carries (Chosen of the Road): the things in one's bag, held and worn that carry a relic's power. */
// ---------------------------------------------------------------- the passives and buffs in data (docs/advancement.md §4)

/** Each world's skills (the engine's), so a passive's numbers are read where a talent's are: bound as the module installs. */
const skillBooks = new WeakMap<World, Map<string, SkillDef>>()
export function bindSkills(w: World, skills: Map<string, SkillDef>): void {
  skillBooks.set(w, skills)
}
type Pay = Exclude<keyof SkillPassive, 'when' | 'party' | 'imbue'>
/** The passives an actor has learned, and the buffs it has up (an active `buff` while it lasts). */
function ownPassives(w: World, e: Entity, book: Map<string, SkillDef>): SkillPassive[] {
  const out: SkillPassive[] = []
  for (const t of e.tags ?? []) if (t.startsWith('skill:')) { const d = book.get(t.slice(6)); if (d?.passive) out.push(d.passive) }
  for (const [id, until] of Object.entries(e.combat?.buffs ?? {})) if (until > w.state.tick) { const b = book.get(id)?.active?.buff; if (b) out.push(b) }
  return out
}
/** One's own, and what the one it follows shares with those near it (`party`: a Demon Hunter's call and vigil). */
function passivesOf(w: World, e: Entity): SkillPassive[] {
  const book = skillBooks.get(w)
  if (!book) return []
  const out = ownPassives(w, e, book)
  const lead = typeof e.props?.companion === 'string' ? w.get(e.props.companion) : undefined
  const a = lead && w.posOf(lead)
  const b = a && w.posOf(e)
  if (lead && a && b && a.map === b.map && Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) <= 6) for (const p of ownPassives(w, lead, book)) if (p.party) out.push(p)
  return out
}
/** Does a passive's condition hold now, for this blow's target (if it asks one)? */
function holds(w: World, e: Entity, p: SkillPassive, target?: Entity): boolean {
  const c = p.when
  if (!c) return true
  if (c.night !== undefined && w.isNight() !== c.night) return false
  const hp = w.num(e, 'hp') / w.num(e, 'maxHp', 1)
  if (c.wounded !== undefined && hp > c.wounded) return false
  if (c.hale && hp < 1) return false
  if (c.standing && !standing(w, e)) return false
  if (c.moving && !recentlyMoved(w, e)) return false
  if (c.companion && alone(w, e)) return false
  if (c.alone && !alone(w, e)) return false
  if (c.weapon === 'own' && !own(w, e, weaponOf(w, e))) return false
  if (c.buff && (e.combat?.buffs?.[c.buff] ?? 0) <= w.state.tick) return false
  if (c.target) {
    if (!target) return false
    if (c.target.status && !c.target.status.some((s) => w.hasStatus({ e: target.id }, s))) return false
    if (c.target.tag && !c.target.tag.some((t) => w.hasTag(target, t) || target.type.includes(`/${t}/`))) return false
    if (c.target.wounded !== undefined && w.num(target, 'hp') / w.num(target, 'maxHp', 1) > c.target.wounded) return false
  }
  return true
}
/** What an actor's passives and buffs pay of one kind now (a sum: +0.1 is 10% more; a `cap` the least). */
export function paid(w: World, e: Entity, key: Pay, target?: Entity): number {
  let n = key === 'cap' ? Infinity : 0
  for (const p of passivesOf(w, e)) {
    const v = p[key]
    if (typeof v !== 'number' || !holds(w, e, p, target)) continue
    n = key === 'cap' ? Math.min(n, v) : n + v
  }
  return n
}

/** The element an enchantment of one's own lends one's blows now (a Spellblade's), the three in turn for `all`. */
function imbued(w: World, e: Entity): string | undefined {
  const book = skillBooks.get(w)
  for (const [id, until] of Object.entries(e.combat?.buffs ?? {})) {
    const imbue = until > w.state.tick ? book?.get(id)?.active?.buff?.imbue : undefined
    if (!imbue) continue
    if (imbue !== 'all') return imbue
    const state = (e.combat ??= {})
    const n = state.imbueHits ?? 0
    state.imbueHits = n + 1
    return ['fire', 'ice', 'lightning'][n % 3]
  }
  return undefined
}
/** What an element lent a blow (an enchantment's, a Spellblade's charge) leaves on the struck now and then. */
const ELEMENT_AFFLICT: Record<string, { status: string; ticks: number; chance: number }> = {
  fire: { status: 'burning', ticks: 30, chance: 0.25 },
  ice: { status: 'frozen', ticks: 10, chance: 0.2 },
  lightning: { status: 'electrified', ticks: 5, chance: 0.2 },
}

const relicsCarried = (w: World, e: Entity): number => [...(e.contents ?? []), ...(e.held ? [e.held] : [])].filter((id) => { const it = w.get(id); return !!it && typeof w.prop(it, 'relic') === 'string' }).length

const recentlyMoved = (w: World, e: Entity): boolean => e.combat?.lastMoveTick !== undefined && w.state.tick - e.combat.lastMoveTick < 6
/** Standing one's ground: no step this second (one who never stepped stands). */
const standing = (w: World, e: Entity): boolean => w.state.tick - (e.combat?.lastMoveTick ?? -Infinity) >= 10
/** On a road: the terrain underfoot is tagged `road` (a dirt road, cobbles, a bridge). */
const onRoad = (w: World, e: Entity): boolean => {
  const at = w.posOf(e)
  return !!at && e.place.on === 'tile' && !!w.onto.terrain(w.terrainAt(at.map, at.x, at.y))?.tags?.includes('road')
}
/** With no companion following (companion.ts: a follower's `companion` names its leader). */
export const alone = (w: World, e: Entity): boolean => {
  const at = w.posOf(e)
  return !at || !w.entitiesOnMap(at.map).some((c) => c.props?.companion === e.id)
}

/** Who called this creature up (a summon's `summoner`), if anyone still is. */
export const summonerOf = (w: World, e: Entity): Entity | undefined => (typeof e.props?.summoner === 'string' ? w.get(e.props.summoner) : undefined)

/** Has one a passive that reads one's steps (in data: standing still, or on the move — a Sniper's, a Skirmisher's)? */
function footed(w: World, e: Entity): boolean {
  const book = skillBooks.get(w)
  return !!book && (e.tags ?? []).some((t) => { const c = t.startsWith('skill:') ? book.get(t.slice(6))?.passive?.when : undefined; return !!c && (c.standing !== undefined || c.moving !== undefined) })
}
/** Cells between the striker and the struck (on one map; none else). */
function cellsBetween(w: World, a: Entity, v: Entity): number {
  const p = w.posOf(a)
  const q = w.posOf(v)
  return p && q && p.map === q.map ? Math.max(Math.abs(p.x - q.x), Math.abs(p.y - q.y)) : 0
}
/** Successful steps, not failed bumps/turning/teleports, charge mobility talents. */
export function recordCombatStep(w: World, e: Entity): void {
  // standing one's ground counts too (worn `holdFast`; the Vow of the Held Ground), and the road's stride (the Vow of the
  // Road), so the step is kept for anyone who moves
  const vows = vowsOf(w, e)
  if (!skill(w, e, 'battle-tempo') && !skill(w, e, 'evasive-step') && !skill(w, e, 'windrunner') && !skill(w, e, 'steady-aim') && !skill(w, e, 'patience') && !footed(w, e) && !(w.stat(e, 'holdFast') > 0) && !vows.has('holdfast') && !vows.has('pilgrim')) return
  const state = (e.combat ??= {})
  state.lastMoveTick = w.state.tick
  if (skill(w, e, 'windrunner')) state.steps = Math.min(3, (state.steps ?? 0) + 1)
}

/** Carry fractional ticks across actions so small haste bonuses really affect a 10 Hz world. */
export function combatDelay(w: World, e: Entity, base: number, kind: 'move' | 'attack'): number {
  const vows = vowsOf(w, e)
  // (the Vow of Silence: sneaking slows its keeper no more)
  if (kind === 'move') for (const id of Object.keys(e.statuses ?? {})) if (!(id === 'sneaking' && vows.has('silence'))) base *= w.onto.status(id)?.moveDelay ?? 1
  // braced behind an Iron Guard (actives.ts): slower on one's feet
  if (kind === 'move' && (e.combat?.ironUntil ?? 0) > w.state.tick) base *= 1.5
  // its own and what it wears (a Vowbound scallop's stride)
  let haste = Math.max(0, w.stat(e, kind === 'move' ? 'moveHaste' : 'attackHaste'))
  // the vows: the Vigil's night stride, the Road's on a road
  if (kind === 'move' && vows.has('vigil') && w.isNight()) haste += 0.15
  if (kind === 'move' && vows.has('pilgrim') && onRoad(w, e)) haste += 0.3
  // a set's power: Light as Chaff, the hungry quick on their feet
  if (kind === 'move' && hungry(w, e) && setPowersOf(w, e).has('chaff')) haste += 0.1
  // the advancements' passives and buffs (docs/advancement.md §4)
  haste += paid(w, e, kind === 'move' ? 'moveHaste' : 'attackHaste')
  if (kind === 'move' && (e.combat?.galeUntil ?? 0) > w.state.tick) haste += 0.3
  if (kind === 'move' && skill(w, e, 'pursuit') && (e.combat?.pursuitUntil ?? 0) > w.state.tick) haste += 0.25
  if (kind === 'attack' && skill(w, e, 'battle-tempo') && recentlyMoved(w, e)) haste += 0.1
  if (kind === 'move' && ranger(w, e, 'fleet-archer') && (e.combat?.fleetUntil ?? 0) > w.state.tick) haste += 0.2
  if (kind === 'move' && skill(w, e, 'slipstream') && (e.combat?.slipUntil ?? 0) > w.state.tick) haste += 0.3
  if (kind === 'move' && skill(w, e, 'adrenaline') && w.hasStatus({ e: e.id }, 'adrenaline')) haste += 0.3
  // the Scale of Hunger (the relic `scales`): the hungrier, the quicker, up to +30% on an empty belly
  if (relicsOf(w, e).has('scales')) haste += 0.3 * Math.max(0, 1 - w.num(e, 'hunger', w.num(e, 'maxHunger', 1)) / w.num(e, 'maxHunger', 1))
  // Gale Step (actives.ts)
  if (kind === 'move' && (e.combat?.hasteUntil ?? 0) > w.state.tick) haste += 0.5
  if (kind === 'attack' && ranger(w, e, 'quick-draw') && own(w, e, weaponOf(w, e))) haste += 0.2
  // a weapon's own quickness (a legendary bow)
  const fought = kind === 'attack' ? weaponOf(w, e) : undefined
  if (fought) haste += Math.max(0, w.num(fought, 'attackHaste'))
  if (!haste) return Math.max(1, base)
  const state = (e.combat ??= {})
  const key = kind === 'move' ? 'moveCarry' : 'attackCarry'
  // (at most half again as quick; slower too, by a passive's price — a Hawkeye's slow draw —, at most by half)
  const ticks = Math.max(1, base / (1 + Math.max(-0.5, Math.min(0.5, haste)))) + (state[key] ?? 0)
  const delay = Math.floor(ticks + 1e-9)
  state[key] = Math.max(0, ticks - delay)
  return delay
}

export interface Strike {
  power: number
  critical: boolean
  charged: boolean
  comboHits: number
  /** Ticks the target bleeds if the blow lands (Hemorrhage). */
  bleed: number
  /** Health the striker draws back if the blow lands (a weapon's lifesteal, a passive's drain). */
  drain: number
  /** A status the struck takes if the blow lands, for so many ticks (a relic's: kneeling, burning, frozen). */
  afflict?: { status: string; ticks: number }
  /** A status the blow ends on the struck (Shatter breaks a freeze; a detonation ends what it burst). */
  ends?: string
  /** Where the struck stood as the blow fell (felled, it may be gone from the world when the blow is answered). */
  at?: { map: string; x: number; y: number }
  /** The element it was lent (an enchantment's, a Spellblade's charge), and whether it was the charged blow after a cast. */
  element?: string
  spellblade?: boolean
  /** Which of the Five Sufferings the blow lays (an Avenger's third): 1 the crown … 5 the lance. */
  suffering?: number
}

/** The Five Sufferings as a blow lays them (lore.md §4): the crown makes the struck kneel, the scourge bleed, hunger mires
 * it, the nails hold it; the lance is a sure critical. */
const SUFFERINGS: Record<number, { afflict?: { status: string; ticks: number }; bleed?: number }> = {
  1: { afflict: { status: 'knelt', ticks: 5 } },
  2: { bleed: 30 },
  3: { afflict: { status: 'mired', ticks: 20 } },
  4: { afflict: { status: 'webbed', ticks: 15 } },
  5: {},
}

/** Contextual bonuses are additive, then the critical multiplier applies before defence. `cast`: the element of the skill it is a blow of. */
export function combatStrike(w: World, a: Entity, target: Entity | undefined, base: number, range: number, weapon: Entity | undefined, primary: boolean, cast?: string): Strike {
  const out: Strike = { power: base, critical: false, charged: false, comboHits: 0, bleed: 0, drain: 0 }
  if (!target || !w.isAgent(target) || w.num(target, 'hp') <= 0 || w.hasStatus({ e: target.id }, 'down')) return out
  const there = w.posOf(target)
  if (there) out.at = { map: there.map, x: there.x, y: there.y }
  const melee = range <= 1
  // the professions' weapon training, each with its own weapons only: dagger, bow, staff
  const mine = own(w, a, weapon)
  if (mine && melee && assassin(w, a, 'assassin-training')) out.power += 1
  if (mine && ranger(w, a, 'ranger-archery')) out.power += 1
  if (mine && mage(w, a, 'mage-focus')) out.power += 1
  let bonus = 0
  let marked = false
  // damage, deeper: an unhurt target, a chain of hits, fighting at half health
  if (primary && skill(w, a, 'first-strike') && w.num(target, 'hp') >= w.num(target, 'maxHp', 1)) bonus += 0.3
  if (primary && skill(w, a, 'momentum') && w.state.tick - (a.combat?.chainTick ?? -Infinity) <= 15) bonus += 0.05 * Math.min(5, a.combat?.chain ?? 0)
  const berserk = skill(w, a, 'berserker') && w.num(a, 'hp') <= w.num(a, 'maxHp', 1) * 0.5
  if (berserk) bonus += 0.25
  // a rally's strength while it lasts (actives.ts)
  if ((a.combat?.rallyUntil ?? 0) > w.state.tick) bonus += 0.25
  // the assassin, deeper: a bleeding mark (Venom Mastery), the night (Nightstalker) — with the dagger
  if (mine && assassin(w, a, 'venom-mastery') && w.hasStatus({ e: target.id }, 'bleeding')) bonus += 0.2
  if (mine && assassin(w, a, 'nightstalker') && w.isNight()) bonus += 0.15
  // the mage: what carries an element strikes harder (Elementalist)
  if (mine && mage(w, a, 'elementalist') && weapon && w.prop(weapon, 'element')) bonus += 0.15
  // swiftness: a blow dodged readies a sure critical
  if (primary && skill(w, a, 'untouchable') && w.state.tick - (a.combat?.dodgeTick ?? -Infinity) <= 20) marked = true
  if (primary) {
    const state = a.combat
    // ranger: standing still steadies the aim; far targets reward it; every third hit on one target is sure
    if (mine && professionIs(w, a, 'ranger')) {
      if (ranger(w, a, 'steady-aim') && w.state.tick - (state?.lastMoveTick ?? -Infinity) >= 10) bonus += 0.3
      const ap = w.posOf(a)
      const tp = w.posOf(target)
      if (ranger(w, a, 'sniper') && ap && tp && Math.max(Math.abs(ap.x - tp.x), Math.abs(ap.y - tp.y)) >= 3) bonus += 0.25
      if (ranger(w, a, 'hunters-mark')) {
        const hits = (state?.markTarget === target.id ? state.markHits ?? 0 : 0) + 1
        out.comboHits = hits === 3 ? 0 : hits
        marked = hits === 3
      }
    }
    // mage: elements answer the attuned; every fourth spell echoes
    if (mine && professionIs(w, a, 'mage')) {
      if (mage(w, a, 'elemental-attunement') && w.prop(weapon, 'element')) bonus += 0.25
      if (mage(w, a, 'spell-echo') && ((state?.spellHits ?? 0) + 1) % 4 === 0) marked = true
    }
  }
  if (skill(w, a, 'executioner') && w.num(target, 'hp') <= w.num(target, 'maxHp', 1) * 0.3) bonus += 0.25
  // the off hand's own (each profession's piece): the parrying dagger cuts again one blow in four, half as hard; the
  // scabbard's first cut after three seconds without one is drawn from it, half again as hard
  const hands = offhandsOf(w, a)
  if (primary && melee && mine && hands.has('twin') && w.rand() < 0.25) bonus += 0.5
  if (primary && melee && mine && hands.has('draw') && w.state.tick - (a.combat?.lastAttackTick ?? -Infinity) >= 30) bonus += 0.5
  let opening = false
  let behind = false
  if (primary && melee) {
    const state = a.combat
    if (skill(w, a, 'windrunner') && (state?.steps ?? 0) >= 3) (out.charged = true), (bonus += 0.5)
    const quietSince = Math.max(state?.lastAttackTick ?? -Infinity, state?.lastHurtTick ?? -Infinity)
    opening = mine && assassin(w, a, 'ambush') && w.state.tick - quietSince >= 40
    if (opening) bonus += 0.5
    const ap = w.posOf(a)
    const tp = w.posOf(target)
    const [dx, dy] = DIRS[target.facing ?? 'down']
    behind = mine && assassin(w, a, 'backstab') && !!ap && !!tp && ap.map === tp.map && (ap.x - tp.x) * dx + (ap.y - tp.y) * dy < 0
    if (behind) bonus += 0.4
    // (Shadow Poise: a Shadowdancer's Backstab cuts deeper)
    if (behind && skill(w, a, 'shadow-poise')) bonus += 0.3
    if (mine && assassin(w, a, 'relentless')) {
      const continuing = state?.comboTarget === target.id && state.comboTick !== undefined && w.state.tick - state.comboTick <= 20
      const hits = (continuing ? state.comboHits ?? 0 : 0) + 1
      out.comboHits = hits === 3 ? 0 : hits
      if (hits === 3) bonus += 0.6
    }
  }
  const relics = relicsOf(w, a)
  // Dragonsbane: what it was forged for
  if (relics.has('dragonsbane') && /\/(dragon|whelp)$/.test(target.type)) bonus += 1
  // the Chain of the Scourging Post: the more its bearer is hurt, the harder they strike (to +50% at the last of their health)
  if (relics.has('scourge')) bonus += 0.5 * Math.max(0, 1 - w.num(a, 'hp') / w.num(a, 'maxHp', 1))
  // the vows (content items.ts VOWS), each a condition and what it pays: the Held Ground strikes harder from where one
  // stands, the Lone Road with no companion by; the Hunt's blow on an unhurt foe falls true; Mercy draws back from
  // one near its end, Dawn from every blow by day
  const vows = vowsOf(w, a)
  if (vows.has('holdfast') && standing(w, a)) bonus += 0.25
  if (vows.has('lone') && alone(w, a)) bonus += 0.15
  // the sets' own powers (content SET_POWERS): the blows one has taken (Blood Price), a foe less hurt than oneself (the
  // Measure), the undead (Lamplight), each relic one carries (Chosen of the Road), a boss (Those Who Came This Far), the
  // night (the Night Kept)
  const powers = setPowersOf(w, a)
  if (powers.has('bloodprice') && (a.combat?.bloodUntil ?? 0) > w.state.tick) bonus += 0.06 * Math.min(5, a.combat?.bloodStacks ?? 0)
  // a Sacrificer's: Agony's stacks, and the Pain Pact's more the more one is hurt (to +40% at the last of one's health)
  if ((a.combat?.agonyUntil ?? 0) > w.state.tick && skill(w, a, 'agony')) bonus += 0.03 * Math.min(10, a.combat?.agonyStacks ?? 0)
  if (powers.has('measure') && w.num(target, 'hp') / w.num(target, 'maxHp', 1) > w.num(a, 'hp') / w.num(a, 'maxHp', 1)) bonus += 0.25
  if (powers.has('lamplight') && (w.hasTag(target, 'undead') || target.type.includes('/undead/'))) bonus += 0.3
  if (powers.has('elect')) bonus += 0.1 * Math.min(5, relicsCarried(w, a))
  if (powers.has('lastdoor') && w.hasTag(target, 'boss')) bonus += 0.3
  if (powers.has('nightkept') && w.isNight()) bonus += 0.2
  // the advancements (docs/advancement.md): the passives and buffs in data, a mark on the struck, and the talents coded
  // here — the pain of the hurt, the first blow out of a veil, a dodge's riposte, the archer's patience, a freeze
  // shattered (Still Time: harder again)
  bonus += paid(w, a, 'damage', target)
  const mark = a.combat?.mark
  if (mark && mark.target === target.id && mark.until > w.state.tick) bonus += mark.damage
  if (mine && skill(w, a, 'pain-pact')) bonus += 0.4 * Math.max(0, 1 - w.num(a, 'hp') / w.num(a, 'maxHp', 1))
  if (primary && skill(w, a, 'unseen') && (a.combat?.veilUntil ?? 0) > w.state.tick) bonus += 0.5
  if (primary && skill(w, a, 'riposte') && w.state.tick - (a.combat?.dodgeTick ?? -Infinity) <= 20) bonus += 0.8
  if (mine && skill(w, a, 'patience')) bonus += 0.1 * Math.min(4, Math.floor((w.state.tick - (a.combat?.lastMoveTick ?? -Infinity)) / 10))
  // a Sniper's Long Shot: each cell an arrow flies beyond the second, 5% harder (to +40%); Unblinking (Hawkeye's): from
  // six cells or farther, every arrow sure
  const flown = mine && !melee ? cellsBetween(w, a, target) : 0
  if (flown && skill(w, a, 'long-shot')) bonus += 0.05 * Math.min(8, Math.max(0, flown - 2))
  // an Avenger's: Vengeance on the one who struck last (within three seconds); the Five Sufferings in turn on one foe, the
  // lance the fifth, harder and sure
  if (skill(w, a, 'vengeance') && a.combat?.hurtBy === target.id && w.state.tick - (a.combat.lastHurtTick ?? -Infinity) <= 30) bonus += 0.3
  if (primary && mine && skill(w, a, 'five-sufferings')) {
    out.suffering = (a.combat?.sufferTarget === target.id ? a.combat.sufferN ?? 0 : 0) + 1
    if (out.suffering === 5) bonus += 0.5
  }
  if (skill(w, a, 'shatter') && w.hasStatus({ e: target.id }, 'frozen')) (bonus += skill(w, a, 'still-time') ? 2 : 1), (out.ends = 'frozen')
  // a Spellblade's: the blow after a cast strikes harder (Seamless, harder again) and carries the cast's element; else an
  // enchantment's element is on every blow of the katana; what carries an element, the katana's own too, cuts deeper (Arcane Edge)
  const charged = primary && mine && skill(w, a, 'blade-and-spell') && (a.combat?.bladeUntil ?? 0) > w.state.tick
  if (charged) (bonus += skill(w, a, 'seamless') ? 1 : 0.5), (out.spellblade = true)
  // (a quiver of an element lends it to the bow's arrows)
  const quiver = mine && !melee && hands.has('fletch') ? offhandOf(w, a) : undefined
  const fletching = quiver && w.prop(quiver, 'element')
  const element = cast ?? (charged ? a.combat?.bladeElement : undefined) ?? (mine ? imbued(w, a) : undefined) ?? (typeof fletching === 'string' ? fletching : undefined)
  if (element && !cast) out.element = element
  if (mine && skill(w, a, 'arcane-edge') && (element || w.prop(weapon, 'element'))) bonus += 0.2
  const unhurt = w.num(target, 'hp') >= w.num(target, 'maxHp', 1)
  // Starfall: every fifth hit falls true
  const guaranteed = (primary && melee && assassin(w, a, 'death-dance') && (opening || behind)) || marked || (primary && relics.has('starfall') && (a.combat?.starHits ?? 0) >= 4) || (primary && vows.has('hunt') && unhurt) || !!a.combat?.sureNext || (primary && skill(w, a, 'shadow-lord') && (a.combat?.shadowHits ?? 0) >= 4) || (flown >= 6 && skill(w, a, 'unblinking')) || out.suffering === 5
  // a weapon that drinks: its lifesteal is health drawn back when the blow lands; and what is worn that drinks (a Vowbound ring)
  if (weapon && w.num(weapon, 'lifesteal') > 0) out.drain += w.num(weapon, 'lifesteal')
  out.drain += Math.max(0, w.stat(a, 'lifesteal'))
  if (vows.has('mercy') && w.num(target, 'hp') <= w.num(target, 'maxHp', 1) * 0.3) out.drain += 2
  if (vows.has('dawn') && !w.isNight()) out.drain += 1
  // a weapon may carry its own edge (a legendary's critChance); what is worn may too; Nightfang at night
  const night = (relics.has('nightfang') && w.isNight() ? 0.25 : 0) + (vows.has('vigil') && w.isNight() ? 0.2 : 0)
  // (the Vow of Silence: a blow struck while sneaking)
  const quiet = vows.has('silence') && w.hasStatus({ e: a.id }, 'sneaking') ? 0.25 : 0
  // Far Sight's keen eye (actives.ts `aim`)
  const aimed = (a.combat?.aimUntil ?? 0) > w.state.tick ? 0.2 : 0
  const chance = Math.max(0, Math.min(1, w.stat(a, 'critChance') + (weapon ? w.num(weapon, 'critChance') : 0) + (berserk ? 0.1 : 0) + night + quiet + aimed + paid(w, a, 'crit', target)))
  out.critical = guaranteed || (chance > 0 && w.rand() < chance)
  // a critical: ×1.5 (Deadly Focus ×2), and what critDamage adds (Lethal Edge, Brutal)
  // Deadly Shot: the ranger's bow's criticals cut deeper
  const deadly = mine && ranger(w, a, 'deadly-shot') ? 0.25 : 0
  out.power *= (1 + bonus) * (out.critical ? (skill(w, a, 'deadly-focus') ? 2 : 1.5) + Math.max(0, w.stat(a, 'critDamage')) + deadly + paid(w, a, 'critDamage', target) : 1)
  out.drain += paid(w, a, 'drain', target)
  // the relics' own: the Mirrorshard steals with a critical; the Crown makes the struck kneel, the Emberheart sets them
  // burning, the Rimecrown freezes them
  if (relics.has('mirrorshard') && out.critical) out.drain += 3
  if (relics.has('crown') && w.rand() < 0.2) out.afflict = { status: 'knelt', ticks: 10 }
  else if (relics.has('emberheart') && w.rand() < 0.25) out.afflict = { status: 'burning', ticks: 30 }
  else if (relics.has('rimecrown') && w.rand() < 0.2) out.afflict = { status: 'frozen', ticks: 10 }
  // Undertow (a set's power): a critical drags the struck to their knees
  if (!out.afflict && out.critical && powers.has('undertow')) out.afflict = { status: 'knelt', ticks: 10 }
  // Thunderstrike (Wrath of Heaven's): every critical electrifies the struck
  if (!out.afflict && out.critical && skill(w, a, 'thunderstrike')) out.afflict = { status: 'electrified', ticks: 5 }
  // the advancements' edges: the dead a Necromancer raised poison every blow (Grave Toxin), a Hexing Edge hexes one in five
  const raiser = summonerOf(w, a)
  if (!out.afflict && raiser && skill(w, raiser, 'grave-toxin')) out.afflict = { status: 'poisoned', ticks: 30 }
  else if (!out.afflict && mine && skill(w, a, 'hex-edge') && w.rand() < 0.2) out.afflict = { status: 'hexed', ticks: 40 }
  // the Sufferings' own (the crown's kneeling, hunger's mire, the nails' hold; the scourge's bleed below)
  const suffered = out.suffering ? SUFFERINGS[out.suffering] : undefined
  if (!out.afflict && suffered?.afflict) out.afflict = suffered.afflict
  if (suffered?.bleed) out.bleed = Math.max(out.bleed, suffered.bleed)
  // an element lent the blow answers on the struck now and then: fire burns, ice freezes a moment, lightning stuns
  const lent = out.element ? ELEMENT_AFFLICT[out.element] : undefined
  if (!out.afflict && lent && w.rand() < lent.chance) out.afflict = { status: lent.status, ticks: lent.ticks }
  // a critical opens a wound that bleeds 1 a second for 4 seconds (Hemorrhage)
  if (primary && out.critical && skill(w, a, 'hemorrhage')) out.bleed = 40
  // an envenomed edge (actives.ts): so many more blows open a bleed
  if ((a.combat?.envenomHits ?? 0) > 0) {
    out.bleed = Math.max(out.bleed, 40)
    a.combat!.envenomHits! -= 1
  }
  // the Day of Wrath (Doomsday's): a branded foe below a fifth of its health is slain by the blow; a boss struck half again
  if (skill(w, a, 'dies-irae') && w.hasStatus({ e: target.id }, 'branded')) {
    if (w.hasTag(target, 'boss')) out.power *= 1.5
    else if (w.num(target, 'hp') < w.num(target, 'maxHp', 1) * 0.2) out.power = Math.max(out.power, w.num(target, 'hp') * 2 + Math.max(0, w.stat(target, 'def')) * 2 + 10)
  }
  return out
}

/**
 * The striker's memory after its blow resolved (its own act-making, like a cooldown): combos,
 * chains, the windows a defeat opens. Immunity and misses consume no charge and build no combo.
 */
export function finishCombatStrike(w: World, a: Entity, target: Entity | undefined, strike: Strike, before: number, range: number, primary: boolean): void {
  const landed = !!target && w.isAgent(target) && before > 0 && w.num(target, 'hp') < before
  const weapon = weaponOf(w, a)
  const mine = own(w, a, weapon)
  if (primary && landed) {
    const state = (a.combat ??= {})
    if (skill(w, a, 'momentum')) (state.chain = w.state.tick - (state.chainTick ?? -Infinity) <= 15 ? (state.chain ?? 0) + 1 : 1), (state.chainTick = w.state.tick)
    if (strike.critical && skill(w, a, 'untouchable')) delete state.dodgeTick
    if (mine && professionIs(w, a, 'ranger')) {
      if (ranger(w, a, 'hunters-mark')) (state.markTarget = target!.id), (state.markHits = strike.comboHits)
      if (ranger(w, a, 'fleet-archer')) state.fleetUntil = w.state.tick + 15
    }
    if (mine && mage(w, a, 'spell-echo')) state.spellHits = (state.spellHits ?? 0) + 1
    // relics that remember one's hits: Starfall counts to five, Galestring lends the wind's speed
    const relics = relicsOf(w, a)
    if (relics.has('starfall')) state.starHits = strike.critical && (state.starHits ?? 0) >= 4 ? 0 : (state.starHits ?? 0) + 1
    if (relics.has('galestring')) state.galeUntil = w.state.tick + 20
    // Shadow Lord counts to five; a riposte is spent
    if (skill(w, a, 'shadow-lord')) state.shadowHits = strike.critical && (state.shadowHits ?? 0) >= 4 ? 0 : (state.shadowHits ?? 0) + 1
    if (skill(w, a, 'riposte')) delete state.dodgeTick
    // the Five Sufferings go on to the next on this foe (after the lance, the crown again)
    if (strike.suffering) (state.sufferTarget = target!.id), (state.sufferN = strike.suffering % 5)
    // a Spellblade's charge is spent by the blows it lent
    if (strike.spellblade) {
      state.bladeHits = (state.bladeHits ?? 1) - 1
      if (state.bladeHits <= 0) {
        delete state.bladeUntil
        delete state.bladeHits
        delete state.bladeElement
      }
    }
  }
  // a sure critical readied (an Umbral Step, a Heartseeker) is spent by the blow that took it
  if (landed && strike.critical && a.combat?.sureNext) delete a.combat.sureNext
  if (primary) {
    const state = (a.combat ??= {})
    state.lastAttackTick = w.state.tick
    if (target && w.isAgent(target)) state.fightTick = w.state.tick
    if (landed && range <= 1) {
      if (strike.charged) state.steps = 0
      if (mine && assassin(w, a, 'relentless')) {
        state.comboTarget = target!.id
        state.comboHits = strike.comboHits
        state.comboTick = w.state.tick
      }
    } else {
      delete state.comboTarget
      delete state.comboHits
      delete state.comboTick
    }
  }
  if (!landed || !target || !w.hasTag(target, 'creature')) return
  const defeated = !w.get(target.id) || w.num(target, 'hp') <= 0 || w.hasStatus({ e: target.id }, 'down')
  if (!defeated || !w.get(a.id) || w.num(a, 'hp') <= 0 || w.hasStatus({ e: a.id }, 'down')) return
  // a defeat counted: the talents that answer one (actives.ts onDefeat) see it go up, and what was felled (a Corpse
  // Burst, a Death Mark: read off the body itself, which may already be gone from the world)
  ;(a.combat ??= {}).defeats = (a.combat.defeats ?? 0) + 1
  const tp = w.posOf(target) ?? strike.at
  if (tp) a.combat.felled = { id: target.id, map: tp.map, x: tp.x, y: tp.y, poisoned: target.statuses?.poisoned !== undefined, hexed: target.statuses?.hexed !== undefined, hunted: target.statuses?.hunted !== undefined, burning: target.statuses?.burning !== undefined, marked: a.combat.mark?.target === target.id && a.combat.mark.until > w.state.tick, tick: w.state.tick }
  if (skill(w, a, 'pursuit')) (a.combat ??= {}).pursuitUntil = w.state.tick + 30
  // what a defeat gives back (Arcane Recovery, Shadow Recovery) is the striker's own rule on the
  // defeat's notify (content: combat/learn)
}

/** Only non-piercing damage attributed to another actor is direct combat damage. Runs in the struck one's own outcome (`hurt`). */
export function combatDamage(eng: Engine, e: Entity, damage: number, attacker: Entity | undefined, pierce: boolean): number {
  const w = eng.world
  if (pierce || !attacker || attacker.id === e.id || !w.isAgent(attacker)) return damage
  const state = (e.combat ??= {})
  // untouchable for a moment (Phantom Step after a dash, Phoenix after a fall)
  if ((state.guardUntil ?? 0) > w.state.tick) return 0
  // a dodge: the blow misses entirely (no roll at all for those without dodge); what is worn may lend it
  // with one's own dagger (Nimble Blade) or bow (Windwalker), a little more
  const held = weaponOf(w, e)
  const nimble = (assassin(w, e, 'nimble-blade') && own(w, e, held) ? 0.08 : 0) + (ranger(w, e, 'windwalker') && own(w, e, held) ? 0.05 : 0)
  // the vows (content items.ts VOWS): the Road's keeper slips blows on the move, the Lone Road's with no companion by
  const vows = vowsOf(w, e)
  const sworn = (vows.has('pilgrim') && recentlyMoved(w, e) ? 0.1 : 0) + (vows.has('lone') && alone(w, e) ? 0.1 : 0)
  // the sets' own: the hungry slip blows (Light as Chaff), and one with a companion at their side (Went Small)
  const powers = setPowersOf(w, e)
  const kept = (powers.has('chaff') && hungry(w, e) ? 0.12 : 0) + (powers.has('second') && !alone(w, e) ? 0.1 : 0)
  const dodge = Math.min(0.5, Math.max(0, w.stat(e, 'dodge') + nimble + sworn + kept + paid(w, e, 'dodge')))
  if (dodge > 0 && w.rand() < dodge) {
    state.dodgeTick = w.state.tick
    // (Fade, the Phantom's: a dodge melts one into the dark a moment, the next blow sure)
    if (skill(w, e, 'fade')) (state.veilUntil = Math.max(state.veilUntil ?? 0, w.state.tick + 10)), (state.sureNext = true)
    w.fx.push({ t: 'say', who: e.id, text: { en: 'Dodged!', zh: '闪避！' } })
    return 0
  }
  // a guard from the front (a passive's `front`, docs/advancement.md): a blow from the way one faces turned aside
  const ep = w.posOf(e)
  const ap = w.posOf(attacker)
  const [fx, fy] = DIRS[e.facing ?? 'down']
  const fromFront = !!ep && !!ap && (ap.x - ep.x) * fx + (ap.y - ep.y) * fy > 0
  const front = paid(w, e, 'front')
  if (front > 0 && fromFront && w.rand() < front) {
    w.fx.push({ t: 'say', who: e.id, text: { en: 'Blocked!', zh: '格挡！' } })
    return 0
  }
  // a piece worn in the off hand turns a blow aside by what is worn's block (the parrying dagger's own, a set's: only
  // with something in the off hand; World.stat counts what is worn)
  const block = offhandOf(w, e) ? Math.min(0.5, Math.max(0, w.stat(e, 'block'))) : 0
  if (block > 0 && w.rand() < block) {
    w.fx.push({ t: 'say', who: e.id, text: { en: 'Blocked!', zh: '格挡！' } })
    return 0
  }
  // (the Vow of the Shield: a fight's first blow — ten seconds out of the fray — is turned half aside)
  const calm = w.state.tick - (state.fightTick ?? -Infinity) > 100
  state.lastHurtTick = w.state.tick
  state.hurtBy = attacker.id
  state.fightTick = w.state.tick
  if (vows.has('ward') && calm) damage *= 0.5
  // the Lance (the relic `lance`): its wielder's blows pass through armour (the engine took the struck's defence off: it
  // is put back); its own wound does not close, and it takes a tenth more
  if (relicsOf(w, attacker).has('lance')) damage += Math.max(0, w.stat(e, 'def'))
  const relics = relicsOf(w, e)
  if (relics.has('lance')) damage *= 1.1
  // the Holy Wood (the relic `nails`): fixed to the world, below a quarter of its health its bearer takes half
  if (relics.has('nails') && w.num(e, 'hp') <= w.num(e, 'maxHp', 1) * 0.25) damage *= 0.5
  // the Held Ground takes less from where one stands, Dawn's keeper by day
  if (vows.has('holdfast') && standing(w, e)) damage *= 0.7
  if (vows.has('dawn') && !w.isNight()) damage *= 0.9
  // the sets' own: the Shroud's keeper near the end, the Night Kept at night; a blow taken is a Blood Price paid
  if (powers.has('shroudward') && w.num(e, 'hp') <= w.num(e, 'maxHp', 1) * 0.5) damage *= 0.85
  if (powers.has('nightkept') && w.isNight()) damage *= 0.85
  if (powers.has('bloodprice')) (state.bloodStacks = (state.bloodUntil ?? 0) > w.state.tick ? Math.min(5, (state.bloodStacks ?? 0) + 1) : 1), (state.bloodUntil = w.state.tick + 60)
  // Agony (a Sacrificer's): every blow taken a stack, ten at most, for five seconds
  if (skill(w, e, 'agony')) (state.agonyStacks = (state.agonyUntil ?? 0) > w.state.tick ? Math.min(10, (state.agonyStacks ?? 0) + 1) : 1), (state.agonyUntil = w.state.tick + 50)
  // a rally's guard, a `guard`'s (actives.ts)
  if ((state.rallyUntil ?? 0) > w.state.tick) damage *= 0.7
  if ((state.ironUntil ?? 0) > w.state.tick) damage *= 0.4
  if (skill(w, e, 'evasive-step') && recentlyMoved(w, e)) damage *= 0.75
  if (skill(w, e, 'defiance') && w.num(e, 'hp') <= w.num(e, 'maxHp', 1) * 0.3) damage *= 0.75
  if (mage(w, e, 'mana-shield') && own(w, e, weaponOf(w, e))) damage *= 0.8
  // holding one's ground (a Vowbound piece's `holdFast`): less taken while one has not stepped this second
  const hold = Math.min(0.5, Math.max(0, w.stat(e, 'holdFast')))
  if (hold > 0 && w.state.tick - (state.lastMoveTick ?? -Infinity) >= 10) damage *= 1 - hold
  // the advancements' passives and buffs: less taken, no blow above a cap (an Aegis)
  const taken = paid(w, e, 'taken')
  if (taken) damage *= Math.max(0.1, 1 + taken)
  damage = Math.max(1, Math.round(damage))
  const cap = paid(w, e, 'cap')
  if (cap < Infinity) damage = Math.min(damage, Math.max(1, cap))
  // a ward (Mana Ward) takes harm before one does, while it lasts
  if ((state.ward ?? 0) > 0 && (state.wardUntil ?? 0) > w.state.tick) {
    const soak = Math.min(state.ward!, damage)
    state.ward! -= soak
    damage -= soak
    if (damage <= 0) {
      w.fx.push({ t: 'say', who: e.id, text: { en: 'Warded!', zh: '结界！' } })
      return 0
    }
  }
  const hp = w.num(e, 'hp', 1)
  // adrenaline: a blow that leaves you at the brink, once a minute
  if (skill(w, e, 'adrenaline') && hp - damage > 0 && hp - damage <= w.num(e, 'maxHp', 1) * 0.3 && w.state.tick - (state.adrenalineTick ?? -Infinity) >= 600) {
    state.adrenalineTick = w.state.tick
    // the rush: faster, and mending a little each second (content: body/adrenaline)
    eng.applyStatus({ e: e.id }, 'adrenaline', 50)
    w.fx.push({ t: 'log', text: { en: 'Adrenaline!', zh: '肾上腺素！' }, tone: 'good' })
  }
  // Undying Avatar (a Sacrificer's third): every forty seconds, a blow that would fell one does not, and one mends to
  // half one's health (told to mend: one's own outcome)
  if (hp > 0 && damage >= hp && skill(w, e, 'undying-avatar') && w.state.tick - (state.avatarTick ?? -Infinity) >= 400) {
    state.avatarTick = w.state.tick
    w.fx.push({ t: 'say', who: e.id, text: { en: 'Not yet!', zh: '还不到时候！' } })
    const half = Math.ceil(w.num(e, 'maxHp', 1) * 0.5) - hp
    if (half > 0) eng.script([{ op: 'emit', impulse: 'notify', to: 'target', params: { what: 'mend', amount: half } }], { target: { e: e.id } }, 'skill')
    return 0
  }
  if (skill(w, e, 'last-stand') && hp > 0 && damage >= hp && w.state.tick - (state.lastStandTick ?? -Infinity) >= 300) {
    state.lastStandTick = w.state.tick
    w.fx.push({ t: 'log', text: { en: 'Last Stand: a lethal blow is survived at 1 health.', zh: '不屈意志：抵御致命一击，保留 1 点生命。' } })
    return hp - 1
  }
  return damage
}

/**
 * Dash (the skill, Q): up to 3 tiles the way the actor faces (Tailwind: 4), stopping before
 * anything solid, or before a creature (Phantom Step passes through, but never ends on one).
 * Cooldown 4 s (Tailwind: 2.5 s). Slipstream and Phantom Step follow it. The dash is an act of
 * moving to the tile it lands on; its windows are the actor's memory.
 */
export function dash(eng: Engine, e: Entity): boolean {
  const w = eng.world
  const at = w.posOf(e)
  if (!at || e.place.on !== 'tile' || !skill(w, e, 'dash') || eng.busy(e) || !eng.ready('dash:' + e.id)) return false
  const [dx, dy] = DIRS[e.facing ?? 'down']
  const reach = skill(w, e, 'tailwind') ? 4 : 3
  const through = skill(w, e, 'phantom-step')
  let land: { x: number; y: number } | undefined
  for (let i = 1; i <= reach; i++) {
    const x = at.x + dx * i
    const y = at.y + dy * i
    if (!w.inBounds(at.map, x, y) || w.blocked(at.map, x, y)) break
    if (w.walkable(at.map, x, y, e.id)) land = { x, y }
    else if (!through) break
  }
  if (!land) return false
  eng.act('move', e.id, { e: e.id }, { instrument: null, params: { map: at.map, x: land.x, y: land.y, dash: true } })
  const now = w.posOf(e)
  if (!now || (now.x === at.x && now.y === at.y && now.map === at.map)) return false
  w.fx.push({ t: 'vfx', fx: 'poof', map: at.map, x: at.x, y: at.y })
  const state = (e.combat ??= {})
  if (skill(w, e, 'slipstream')) state.slipUntil = w.state.tick + 20
  if (through) state.guardUntil = w.state.tick + 5
  eng.setCooldown('dash:' + e.id, skill(w, e, 'tailwind') ? 25 : 40)
  return true
}
