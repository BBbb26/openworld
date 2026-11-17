// The active skills and the skill bar (engine/src/actives.ts, docs/skill-tree.md): a learned active skill goes in
// the bar's first empty slot; one is cast from its slot, does what it says, and rests for its cooldown; another
// profession's skill is not cast. Every one of the twenty does what it says on a field of slimes.

import { describe, expect, it } from 'vitest'
import { Game, RuleLibrary, TICKS_PER_HOUR, snapshot, textOf, type Engine, type Entity, type MapData } from '@openworld/engine'
import { castCooldown, castLeft, effectiveActive, knownActives, combatDamage, combatDelay, combatStrike, cast, setSkill, skillbar } from '@openworld/modules'
import { BASE_RULES, HAZARDS, SKILLS, SKILL_BY_ID, STORY_RULES, SUMMONS, buildOntology, decodeChunk, skillBook } from '@openworld-game/content'
import { buildFord } from '../src/demo/world.ts'

/** An open field of grass (an arena, as the boss tests have), the player in its middle facing right, every skill known to the engine. */
function field(): { eng: Engine; p: Entity; x: number; y: number } {
  const { index, chunks } = buildFord()
  const game = Game.create(index, buildOntology(), new RuleLibrary([...BASE_RULES, ...STORY_RULES]))
  for (const c of chunks) game.loadChunk(decodeChunk(c))
  const map: MapData = { id: 'arena', name: 'Arena', kind: 'wild', width: 30, height: 30, terrain: Array(900).fill('grass'), portals: [] }
  game.loadMapData(map)
  const eng = game.engine
  const w = eng.world
  for (const s of SKILLS) eng.skills.set(s.id, s)
  const [x, y] = [15, 15]
  eng.author(() => {
    eng.quests.put('descent', 'done')
    w.setFact('seen.arrival', true)
    eng.teleport(w.player, { map: 'arena', x, y })
  })
  w.player.facing = 'right'
  eng.controls.sync()
  return { eng, p: w.player, x, y }
}

/** The player knows a skill (and its profession, if it has one), and it sits in the bar's first slot. */
function know(eng: Engine, id: string): void {
  const w = eng.world
  const def = SKILL_BY_ID[id]
  eng.author(() => {
    if (def.profession) w.setProp(w.player, 'profession', def.profession)
    w.addTag(w.player, `skill:${id}`)
  })
  expect(setSkill(eng, 0, id)).toBe(true)
}

const slime = (eng: Engine, x: number, y: number) => eng.author(() => eng.world.create('actor/creature/slime/green_slime', { on: 'tile', map: 'arena', x, y }, { props: { hp: 200, maxHp: 200 } }))
const hurt = (eng: Engine, e: Entity) => eng.world.num(e, 'hp') < 200

describe('the skill bar', () => {
  it('a learned active skill goes in the first empty slot; slots swap; an unlearned or passive skill is not set', () => {
    const { eng, p } = field()
    eng.author(() => eng.world.setProp(p, 'skillPoints', 10))
    expect(eng.controls.learn(SKILL_BY_ID['light-footed'])).toBe(true)
    expect(skillbar(eng)).toEqual([null, null, null, null, null, null])
    expect(eng.controls.learn(SKILL_BY_ID['gale-step'])).toBe(true)
    expect(skillbar(eng)[0]).toBe('gale-step')
    expect(eng.controls.learn(SKILL_BY_ID.strength)).toBe(true)
    expect(eng.controls.learn(SKILL_BY_ID.cleave)).toBe(true)
    expect(skillbar(eng).slice(0, 2)).toEqual(['gale-step', 'cleave'])
    // moved to another slot: what was there takes its place
    expect(setSkill(eng, 1, 'gale-step')).toBe(true)
    expect(skillbar(eng).slice(0, 2)).toEqual(['cleave', 'gale-step'])
    expect(setSkill(eng, 5, 'whirlwind')).toBe(false)
    expect(setSkill(eng, 5, 'strength')).toBe(false)
    expect(setSkill(eng, 0, null)).toBe(true)
    expect(skillbar(eng)[0]).toBeNull()
  })

  it('a cast rests for its cooldown (shown in the frame), and another profession\'s skill is not cast', () => {
    const { eng, p, x, y } = field()
    know(eng, 'whirlwind')
    const s = slime(eng, x + 1, y)
    expect(cast(eng, 0)).toBe(true)
    expect(hurt(eng, s)).toBe(true)
    expect(castLeft(eng, p, 'whirlwind')).toBe(SKILL_BY_ID.whirlwind.active!.cooldown)
    expect(snapshot(eng).player.skillbar[0]).toEqual({ id: 'whirlwind', left: 80, cooldown: 80, usable: true })
    // resting: not cast again
    const hp = eng.world.num(s, 'hp')
    expect(cast(eng, 0)).toBe(false)
    expect(eng.world.num(s, 'hp')).toBe(hp)
    for (let i = 0; i < 80; i++) eng.tick()
    expect(castLeft(eng, p, 'whirlwind')).toBe(0)
    // a swordsman's skill, the player now a mage: not cast
    know(eng, 'cross-cut')
    eng.author(() => eng.world.setProp(p, 'profession', 'mage'))
    expect(cast(eng, 0)).toBe(false)
  })
})

/** What lies on the arena of a kind (a hazard a field laid, a beast called). */
const onArena = (eng: Engine, type: string) => eng.world.entitiesOnMap('arena').filter((e) => e.type === type)
const buffed = (eng: Engine, p: Entity, id: string) => (p.combat?.buffs?.[id] ?? 0) > eng.world.state.tick
const status = (eng: Engine, s: Entity, id: string) => eng.world.hasStatus({ e: s.id }, id)
const after = (eng: Engine, ticks: number) => { for (let i = 0; i < ticks; i++) eng.tick() }
const wounded = (eng: Engine, p: Entity) => eng.author(() => eng.world.setProp(p, 'hp', 1))

const ADVANCED_CASES: Record<string, (eng: Engine, p: Entity, x: number, y: number) => () => void> = {
  // the assassin
  miasma: (eng) => () => expect(onArena(eng, HAZARDS.miasma)).toHaveLength(9),
  'raise-dead': (eng, p) => () => expect(onArena(eng, SUMMONS.skeleton).filter((e) => e.props?.companion === p.id)).toHaveLength(2),
  'drive-the-dead': (eng, p, x, y) => {
    for (const dy of [1, -1]) eng.author(() => eng.world.create(SUMMONS.skeleton, { on: 'tile', map: 'arena', x, y: y + dy }, { props: { summoner: p.id, companion: p.id } }))
    const s = slime(eng, x + 3, y)
    return () => expect([hurt(eng, s), status(eng, s, 'poisoned')]).toEqual([true, true])
  },
  'toxic-burst': (eng, _p, x, y) => {
    const s = slime(eng, x + 3, y)
    eng.author(() => eng.applyStatus({ e: s.id }, 'poisoned', 50))
    return () => expect([hurt(eng, s), status(eng, s, 'poisoned')]).toEqual([true, false])
  },
  'hell-guard': (eng, p) => () => expect(onArena(eng, SUMMONS.hellguard).filter((e) => e.props?.companion === p.id)).toHaveLength(1),
  pestilence: (eng, _p, x, y) => {
    const s = slime(eng, x + 2, y + 1)
    return () => (after(eng, 15), expect([hurt(eng, s), status(eng, s, 'poisoned')]).toEqual([true, true]))
  },
  'gate-of-the-styx': (eng, p, x, y) => {
    const s = slime(eng, x + 3, y)
    return () => expect([hurt(eng, s), status(eng, s, 'poisoned'), onArena(eng, SUMMONS.hellguard).filter((e) => e.props?.companion === p.id).length]).toEqual([true, true, 2])
  },
  'army-of-the-dead': (eng, p, x, y) => {
    const s = slime(eng, x + 2, y)
    return () => expect([hurt(eng, s), status(eng, s, 'poisoned'), onArena(eng, SUMMONS.skeleton).filter((e) => e.props?.companion === p.id).length]).toEqual([true, true, 4])
  },
  'umbral-step': (eng, p) => () => expect([(p.combat?.veilUntil ?? 0) > eng.world.state.tick, p.combat?.sureNext]).toEqual([true, true]),
  'shade-stab': (eng, _p, x, y) => {
    const s = slime(eng, x + 3, y)
    return () => expect([hurt(eng, s), status(eng, s, 'bleeding')]).toEqual([true, true])
  },
  'shadow-dance': (eng, p) => () => expect(buffed(eng, p, 'shadow-dance')).toBe(true),
  'shadow-double': (eng, p) => () => expect(onArena(eng, SUMMONS.phantom).filter((e) => e.props?.companion === p.id)).toHaveLength(1),
  'chains-of-binding': (eng, _p, x, y) => {
    const two = [slime(eng, x + 3, y), slime(eng, x + 4, y + 1)]
    return () => expect(two.map((s) => [hurt(eng, s), status(eng, s, 'webbed')])).toEqual([[true, true], [true, true]])
  },
  'hex-wave': (eng, _p, x, y) => {
    const s = slime(eng, x + 2, y + 1)
    return () => expect([hurt(eng, s), status(eng, s, 'hexed')]).toEqual([true, true])
  },
  'hunters-sanctum': (eng, p) => () => expect([onArena(eng, HAZARDS.sigil).length > 0, buffed(eng, p, 'hunters-sanctum')]).toEqual([true, true]),
  'ghost-howl': (eng, _p, x, y) => {
    const s = slime(eng, x + 3, y + 2)
    return () => expect([hurt(eng, s), status(eng, s, 'stunned')]).toEqual([true, true])
  },
  blur: (eng, p) => () => expect(buffed(eng, p, 'blur')).toBe(true),
  'thousand-shadows': (eng, _p, x, y) => {
    const three = [slime(eng, x + 2, y), slime(eng, x, y + 3), slime(eng, x - 3, y)]
    return () => expect(three.every((s) => hurt(eng, s))).toBe(true)
  },
  'binding-sigil': (eng) => () => expect(onArena(eng, HAZARDS.sigil)).toHaveLength(9),
  'hunt-call': (eng, p) => () => expect(buffed(eng, p, 'hunt-call')).toBe(true),
  'demon-prison': (eng, _p, x, y) => {
    const s = slime(eng, x + 1, y + 1)
    return () => expect([hurt(eng, s), status(eng, s, 'stunned'), onArena(eng, HAZARDS.sigil).length > 0]).toEqual([true, true, true])
  },
  // the swordsman
  'cross-cut': (eng, _p, x, y) => {
    const s = slime(eng, x + 1, y - 1)
    return () => expect(hurt(eng, s)).toBe(true)
  },
  'rising-slash': (eng, _p, x, y) => {
    const s = slime(eng, x + 1, y)
    return () => expect([hurt(eng, s), status(eng, s, 'knelt')]).toEqual([true, true])
  },
  'step-cut': (eng, _p, x, y) => {
    const s = slime(eng, x + 3, y)
    return () => expect(hurt(eng, s)).toBe(true)
  },
  'whirl-cut': (eng, _p, x, y) => {
    const s = slime(eng, x + 1, y + 1)
    return () => expect(hurt(eng, s)).toBe(true)
  },
  'focus-stance': (eng, p) => () => expect(buffed(eng, p, 'focus-stance')).toBe(true),
  'piercing-thrust': (eng, _p, x, y) => {
    const two = [slime(eng, x + 1, y), slime(eng, x + 2, y)]
    return () => expect(two.every((s) => hurt(eng, s))).toBe(true)
  },
  'heaven-rending': (eng, _p, x, y) => {
    const s = slime(eng, x + 3, y + 1)
    return () => expect(hurt(eng, s)).toBe(true)
  },
  'sheath-cut': (eng, p) => () => expect(buffed(eng, p, 'sheath-cut')).toBe(true),
  'wind-cutter': (eng, _p, x, y) => {
    const s = slime(eng, x + 4, y)
    return () => expect(hurt(eng, s)).toBe(true)
  },
  iaido: (eng, p, x, y) => {
    const two = [slime(eng, x + 1, y), slime(eng, x + 2, y)]
    return () => expect([two.every((s) => hurt(eng, s)), eng.world.posOf(p)!.x > x + 2]).toEqual([true, true])
  },
  'phantom-sword-dance': (eng, _p, x, y) => {
    const s = slime(eng, x + 1, y - 1)
    return () => expect(hurt(eng, s)).toBe(true)
  },
  'swallow-return': (eng, _p, x, y) => {
    const s = slime(eng, x + 1, y)
    return () => expect(hurt(eng, s)).toBe(true)
  },
  'flash-step': (eng, p, x) => () => expect(eng.world.posOf(p)!.x).toBeGreaterThan(x),
  issen: (eng, _p, x, y) => {
    const s = slime(eng, x + 5, y - 1)
    return () => expect(hurt(eng, s)).toBe(true)
  },
  'mirror-stance': (eng, p) => () => expect(buffed(eng, p, 'mirror-stance')).toBe(true),
  'void-slash': (eng, _p, x, y) => {
    const s = slime(eng, x + 5, y)
    return () => expect(hurt(eng, s)).toBe(true)
  },
  'ten-thousand-swords': (eng, _p, x, y) => {
    const s = slime(eng, x + 2, y + 1)
    return () => (after(eng, 15), expect(hurt(eng, s)).toBe(true))
  },
  'blood-offering': (eng, p) => {
    const hp = eng.world.num(p, 'hp')
    return () => expect([buffed(eng, p, 'blood-offering'), eng.world.num(p, 'hp') < hp]).toEqual([true, true])
  },
  'crimson-whirl': (eng, _p, x, y) => {
    const s = slime(eng, x + 1, y)
    return () => expect([hurt(eng, s), status(eng, s, 'bleeding')]).toEqual([true, true])
  },
  'rending-sacrifice': (eng, _p, x, y) => {
    const s = slime(eng, x + 1, y + 1)
    return () => expect(hurt(eng, s)).toBe(true)
  },
  frenzy: (eng, p) => () => expect(buffed(eng, p, 'frenzy')).toBe(true),
  'sixth-suffering': (eng, p) => () => expect(buffed(eng, p, 'sixth-suffering')).toBe(true),
  'flesh-for-blade': (eng, p) => () => expect(buffed(eng, p, 'flesh-for-blade')).toBe(true),
  'pain-spread': (eng, _p, x, y) => {
    const s = slime(eng, x + 2, y)
    return () => expect([hurt(eng, s), status(eng, s, 'bleeding')]).toEqual([true, true])
  },
  'final-offering': (eng, _p, x, y) => {
    const s = slime(eng, x + 3, y)
    return () => expect(hurt(eng, s)).toBe(true)
  },
  'flame-enchant': (eng, p) => () => expect(buffed(eng, p, 'flame-enchant')).toBe(true),
  'frost-enchant': (eng, p) => () => expect(buffed(eng, p, 'frost-enchant')).toBe(true),
  'thunder-enchant': (eng, p) => () => expect(buffed(eng, p, 'thunder-enchant')).toBe(true),
  'flame-slash': (eng, _p, x, y) => {
    const s = slime(eng, x + 1, y - 1)
    return () => expect([hurt(eng, s), status(eng, s, 'burning')]).toEqual([true, true])
  },
  'thunder-thrust': (eng, _p, x, y) => {
    const two = [slime(eng, x + 1, y), slime(eng, x + 3, y)]
    return () => expect(two.every((s) => hurt(eng, s))).toBe(true)
  },
  'frost-ring': (eng, _p, x, y) => {
    const s = slime(eng, x - 1, y + 1)
    return () => expect([hurt(eng, s), status(eng, s, 'frozen')]).toEqual([true, true])
  },
  'trinity-cut': (eng, _p, x, y) => {
    const s = slime(eng, x + 1, y + 1)
    // (fire, ice and lightning in turn: the elements answer one another as they always do, the last one stuns)
    return () => expect([hurt(eng, s), status(eng, s, 'electrified')]).toEqual([true, true])
  },
  'prism-enchant': (eng, p) => () => expect(buffed(eng, p, 'prism-enchant')).toBe(true),
  raikiri: (eng, p, x, y) => {
    const two = [slime(eng, x + 1, y), slime(eng, x + 3, y)]
    return () => expect([two.every((s) => hurt(eng, s) && status(eng, s, 'electrified')), eng.world.posOf(p)!.x > x + 3]).toEqual([true, true])
  },
  'meteor-cut': (eng, p, x, y) => {
    const s = slime(eng, x + 4, y)
    return () => expect([hurt(eng, s), status(eng, s, 'burning'), eng.world.posOf(p)?.x]).toEqual([true, true, x + 3])
  },
  'ten-thousand-thunders': (eng, _p, x, y) => {
    const s = slime(eng, x + 2, y + 1)
    return () => (after(eng, 15), expect(hurt(eng, s)).toBe(true))
  },
  'death-mark': (eng, p, x, y) => {
    const s = slime(eng, x + 3, y)
    return () => expect(p.combat?.mark?.target).toBe(s.id)
  },
  assassinate: (eng, _p, x, y) => {
    const s = slime(eng, x + 3, y)
    return () => expect(hurt(eng, s)).toBe(true)
  },
  garrote: (eng, _p, x, y) => {
    const s = slime(eng, x + 1, y)
    return () => expect([hurt(eng, s), status(eng, s, 'stunned')]).toEqual([true, true])
  },
  caltrops: (eng) => () => expect(onArena(eng, HAZARDS.caltrops)).toHaveLength(9),
  // the ranger
  deadeye: (eng, _p, x, y) => {
    const s = slime(eng, x + 5, y)
    return () => expect(hurt(eng, s)).toBe(true)
  },
  ricochet: (eng, _p, x, y) => {
    const two = [slime(eng, x + 2, y), slime(eng, x + 3, y + 2)]
    return () => expect(two.every((s) => hurt(eng, s))).toBe(true)
  },
  heartseeker: (eng, _p, x, y) => {
    const two = [slime(eng, x + 2, y), slime(eng, x + 4, y)]
    return () => expect(two.every((s) => hurt(eng, s))).toBe(true)
  },
  'snare-trap': (eng) => () => expect(onArena(eng, HAZARDS.snare)).toHaveLength(1),
  'spike-trap': (eng) => () => expect(onArena(eng, HAZARDS.spikes)).toHaveLength(3),
  'killing-field': (eng) => () => expect(onArena(eng, HAZARDS.blast)).toHaveLength(16),
  'call-the-hound': (eng, p) => () => expect(onArena(eng, SUMMONS.hound).map((h) => h.props?.companion)).toEqual([p.id]),
  sic: (eng, p, x, y) => {
    eng.author(() => eng.world.create(SUMMONS.hound, { on: 'tile', map: 'arena', x, y: y + 1 }, { props: { summoner: p.id, companion: p.id } }))
    const s = slime(eng, x + 3, y)
    return () => expect([hurt(eng, s), status(eng, s, 'bleeding')]).toEqual([true, true])
  },
  'the-pack': (eng) => () => expect(onArena(eng, SUMMONS.wolf)).toHaveLength(3),
  'mark-prey': (eng, _p, x, y) => {
    const s = slime(eng, x + 3, y)
    return () => expect([hurt(eng, s), status(eng, s, 'hunted')]).toEqual([true, true])
  },
  'hunting-net': (eng, _p, x, y) => {
    const two = [slime(eng, x + 3, y), slime(eng, x + 4, y + 1)]
    return () => expect(two.every((s) => hurt(eng, s) && status(eng, s, 'webbed'))).toBe(true)
  },
  'dawn-flight': (eng, _p, x, y) => {
    const s = slime(eng, x - 3, y + 2)
    return () => expect([hurt(eng, s), status(eng, s, 'hunted')]).toEqual([true, true])
  },
  'pinning-shot': (eng, _p, x, y) => {
    const s = slime(eng, x + 4, y)
    return () => expect([hurt(eng, s), status(eng, s, 'webbed')]).toEqual([true, true])
  },
  'hold-breath': (eng, p) => () => expect(buffed(eng, p, 'hold-breath')).toBe(true),
  sunpiercer: (eng, _p, x, y) => {
    const two = [slime(eng, x + 2, y), slime(eng, x + 13, y)]
    return () => expect(two.every((s) => hurt(eng, s))).toBe(true)
  },
  'sight-lock': (eng, p, x, y) => {
    const s = slime(eng, x + 10, y + 4)
    return () => expect(p.combat?.mark?.target).toBe(s.id)
  },
  'one-shot': (eng, _p, x, y) => {
    const s = slime(eng, x + 13, y)
    return () => expect(hurt(eng, s)).toBe(true)
  },
  flit: (eng, p, x, y) => {
    slime(eng, x + 1, y)
    return () => expect(eng.world.posOf(p)?.x).toBe(x + 4)
  },
  'arrow-flurry': (eng, _p, x, y) => {
    const s = slime(eng, x + 3, y)
    return () => expect(hurt(eng, s)).toBe(true)
  },
  crosswind: (eng, _p, x, y) => {
    const s = slime(eng, x + 2, y + 1)
    return () => expect([hurt(eng, s), status(eng, s, 'mired')]).toEqual([true, true])
  },
  'gale-dance': (eng, _p, x, y) => {
    const two = [slime(eng, x + 2, y), slime(eng, x + 3, y + 2)]
    return () => expect(two.every((s) => hurt(eng, s))).toBe(true)
  },
  wingbeat: (eng, p) => () => expect(buffed(eng, p, 'wingbeat')).toBe(true),
  'flying-feathers': (eng, _p, x, y) => {
    const two = [slime(eng, x + 3, y), slime(eng, x + 3, y + 1)]
    return () => expect(two.every((s) => hurt(eng, s) && status(eng, s, 'mired'))).toBe(true)
  },
  'falling-feathers': (eng, p, x, y) => {
    const s = slime(eng, x + 1, y + 2)
    return () => (expect(buffed(eng, p, 'falling-feathers')).toBe(true), after(eng, 15), expect(hurt(eng, s)).toBe(true))
  },
  volley: (eng, _p, x, y) => {
    const two = [slime(eng, x + 3, y), slime(eng, x + 4, y + 1)]
    return () => (after(eng, 5), expect(two.every((s) => hurt(eng, s))).toBe(true))
  },
  disengage: (eng, p, x, y) => {
    const s = slime(eng, x + 3, y)
    return () => expect([hurt(eng, s), status(eng, s, 'mired'), eng.world.posOf(p)?.x]).toEqual([true, true, x - 3])
  },
  // the mage
  'flame-wall': (eng) => () => expect(onArena(eng, HAZARDS.flame)).toHaveLength(5),
  combustion: (eng, _p, x, y) => {
    const s = slime(eng, x + 3, y)
    eng.author(() => eng.applyStatus({ e: s.id }, 'burning', 50))
    return () => expect([hurt(eng, s), status(eng, s, 'burning')]).toEqual([true, false])
  },
  inferno: (eng, _p, x, y) => {
    const two = [slime(eng, x + 3, y), slime(eng, x + 5, y + 2)]
    return () => (after(eng, 25), expect(two.every((s) => hurt(eng, s))).toBe(true))
  },
  'ice-lance': (eng, _p, x, y) => {
    const two = [slime(eng, x + 2, y), slime(eng, x + 4, y)]
    return () => expect(two.every((s) => hurt(eng, s) && status(eng, s, 'frozen'))).toBe(true)
  },
  'glacial-prison': (eng, _p, x, y) => {
    const s = slime(eng, x + 3, y)
    return () => expect(status(eng, s, 'frozen')).toBe(true)
  },
  blizzard: (eng, _p, x, y) => {
    const s = slime(eng, x + 2, y + 1)
    return () => (after(eng, 15), expect(hurt(eng, s)).toBe(true))
  },
  'ice-spikes': (eng, _p, x, y) => {
    const s = slime(eng, x + 2, y + 1)
    return () => expect([hurt(eng, s), status(eng, s, 'frozen')]).toEqual([true, true])
  },
  'frozen-ground': (eng) => () => expect(onArena(eng, HAZARDS.frost)).toHaveLength(9),
  'dragons-breath': (eng, _p, x, y) => {
    const two = [slime(eng, x + 2, y), slime(eng, x + 4, y)]
    return () => expect(two.every((s) => hurt(eng, s) && status(eng, s, 'burning'))).toBe(true)
  },
  pyroblast: (eng, _p, x, y) => {
    const s = slime(eng, x + 5, y)
    return () => expect(hurt(eng, s)).toBe(true)
  },
  'lightning-bolt': (eng, _p, x, y) => {
    const s = slime(eng, x + 5, y)
    return () => expect(hurt(eng, s)).toBe(true)
  },
  thunderclap: (eng, _p, x, y) => {
    const s = slime(eng, x + 2, y - 1)
    return () => expect([hurt(eng, s), status(eng, s, 'electrified')]).toEqual([true, true])
  },
  'thunder-spear': (eng, _p, x, y) => {
    const two = [slime(eng, x + 2, y), slime(eng, x + 5, y)]
    return () => expect(two.every((s) => hurt(eng, s))).toBe(true)
  },
  'lightning-step': (eng, p, x, y) => {
    const s = slime(eng, x + 2, y)
    return () => expect([hurt(eng, s), eng.world.posOf(p)?.x]).toEqual([true, x + 4])
  },
  'thunder-prison': (eng, _p, x, y) => {
    const two = [slime(eng, x + 3, y), slime(eng, x + 5, y + 2)]
    return () => (after(eng, 25), expect(two.every((s) => hurt(eng, s))).toBe(true))
  },
  glacier: (eng, _p, x, y) => {
    const two = [slime(eng, x + 2, y), slime(eng, x + 5, y + 1)]
    return () => expect(two.every((s) => hurt(eng, s) && status(eng, s, 'frozen'))).toBe(true)
  },
  'cold-wave': (eng, _p, x, y) => {
    const s = slime(eng, x + 3, y - 2)
    return () => expect([hurt(eng, s), status(eng, s, 'frozen')]).toEqual([true, true])
  },
  'endless-winter': (eng, _p, x, y) => {
    const s = slime(eng, x + 3, y + 2)
    return () => (after(eng, 15), expect(hurt(eng, s)).toBe(true))
  },
  immolate: (eng, p) => () => expect(buffed(eng, p, 'immolate')).toBe(true),
  'scorched-earth': (eng, _p, x, y) => {
    const two = [slime(eng, x + 2, y), slime(eng, x + 5, y - 1)]
    return () => expect(two.every((s) => hurt(eng, s) && status(eng, s, 'burning'))).toBe(true)
  },
  worldfire: (eng, _p, x, y) => {
    const two = [slime(eng, x + 3, y), slime(eng, x + 5, y + 3)]
    return () => expect(two.every((s) => hurt(eng, s) && status(eng, s, 'burning'))).toBe(true)
  },
  'judgement-bolt': (eng, _p, x, y) => {
    const s = slime(eng, x + 6, y)
    return () => expect(hurt(eng, s)).toBe(true)
  },
  'thunder-shroud': (eng, p) => () => expect(buffed(eng, p, 'thunder-shroud')).toBe(true),
  'wrath-of-heaven': (eng, _p, x, y) => {
    const s = slime(eng, x + 3, y - 2)
    return () => (after(eng, 15), expect(hurt(eng, s)).toBe(true))
  },
  'arcane-missiles': (eng, _p, x, y) => {
    const s = slime(eng, x + 3, y)
    return () => expect(hurt(eng, s)).toBe(true)
  },
  'mana-ward': (eng, p) => () => expect(p.combat?.ward).toBeGreaterThan(0),
  // the cleric
  smite: (eng, _p, x, y) => {
    const s = slime(eng, x + 1, y)
    return () => expect([hurt(eng, s), status(eng, s, 'stunned')]).toEqual([true, true])
  },
  prayer: (eng, p) => (wounded(eng, p), () => expect(eng.world.num(p, 'hp')).toBeGreaterThan(1)),
  consecrate: (eng, p) => () => expect([onArena(eng, HAZARDS.holy).length, buffed(eng, p, 'consecrate')]).toEqual([9, true]),
  rebuke: (eng, _p, x, y) => {
    const s = slime(eng, x + 1, y + 1)
    return () => expect([hurt(eng, s), status(eng, s, 'knelt')]).toEqual([true, true])
  },
  'holy-light': (eng, _p, x, y) => {
    const s = slime(eng, x + 4, y)
    return () => expect(hurt(eng, s)).toBe(true)
  },
  blessing: (eng, p) => () => expect(buffed(eng, p, 'blessing')).toBe(true),
  'divine-wrath': (eng, _p, x, y) => {
    const s = slime(eng, x + 2, y + 2)
    return () => expect([hurt(eng, s), status(eng, s, 'stunned')]).toEqual([true, true])
  },
  'hammer-of-heaven': (eng, _p, x, y) => {
    const s = slime(eng, x + 2, y + 1)
    return () => expect(hurt(eng, s)).toBe(true)
  },
  'ward-of-light': (eng, p) => () => expect(p.combat?.ward).toBeGreaterThan(0),
  'healing-light': (eng, p) => (wounded(eng, p), () => expect(eng.world.num(p, 'hp')).toBeGreaterThan(1)),
  'guardian-light': (eng, p, x, y) => {
    const s = slime(eng, x + 2, y)
    return () => expect([hurt(eng, s), buffed(eng, p, 'guardian-light')]).toEqual([true, true])
  },
  renew: (eng, p) => () => expect(buffed(eng, p, 'renew')).toBe(true),
  'radiant-blow': (eng, _p, x, y) => {
    const s = slime(eng, x + 1, y)
    return () => expect([hurt(eng, s), status(eng, s, 'stunned')]).toEqual([true, true])
  },
  'divine-intervention': (eng, p) => () => expect(buffed(eng, p, 'divine-intervention')).toBe(true),
  scourge: (eng, _p, x, y) => {
    const s = slime(eng, x + 1, y + 1)
    return () => expect([hurt(eng, s), status(eng, s, 'bleeding')]).toEqual([true, true])
  },
  'black-flame': (eng, _p, x, y) => {
    const s = slime(eng, x + 4, y)
    return () => expect([hurt(eng, s), status(eng, s, 'burning')]).toEqual([true, true])
  },
  wrath: (eng, p) => () => expect(buffed(eng, p, 'wrath')).toBe(true),
  torment: (eng, _p, x, y) => {
    const s = slime(eng, x + 3, y)
    eng.author(() => eng.applyStatus({ e: s.id }, 'bleeding', 50))
    return () => expect([hurt(eng, s), status(eng, s, 'bleeding')]).toEqual([true, false])
  },
  'night-of-wrath': (eng, _p, x, y) => {
    const s = slime(eng, x + 2, y + 2)
    return () => expect([hurt(eng, s), status(eng, s, 'burning'), status(eng, s, 'bleeding')]).toEqual([true, true, true])
  },
  'brand-heretic': (eng, p, x, y) => {
    const s = slime(eng, x + 4, y + 3)
    return () => expect([hurt(eng, s), status(eng, s, 'branded'), p.combat?.mark?.target === s.id]).toEqual([true, true, true])
  },
  'burn-the-heretic': (eng, _p, x, y) => {
    const s = slime(eng, x + 3, y)
    return () => expect([hurt(eng, s), status(eng, s, 'burning')]).toEqual([true, true])
  },
  shackles: (eng, _p, x, y) => {
    const s = slime(eng, x + 3, y)
    return () => expect([hurt(eng, s), status(eng, s, 'webbed')]).toEqual([true, true])
  },
  'purging-flame': (eng, _p, x, y) => {
    const two = [slime(eng, x + 3, y), slime(eng, x + 4, y + 1)]
    return () => expect(two.every((s) => hurt(eng, s))).toBe(true)
  },
  sentence: (eng, _p, x, y) => {
    const s = slime(eng, x + 4, y)
    return () => expect([hurt(eng, s), status(eng, s, 'stunned')]).toEqual([true, true])
  },
  'call-the-faithful': (eng, p) => () => expect(onArena(eng, SUMMONS.disciple).filter((e) => e.props?.companion === p.id)).toHaveLength(2),
  psalm: (eng, p) => (wounded(eng, p), () => expect(eng.world.num(p, 'hp')).toBeGreaterThan(1)),
  'gate-of-heaven': (eng, p, x, y) => {
    const s = slime(eng, x + 2, y)
    return () => expect([hurt(eng, s), onArena(eng, SUMMONS.seraph).filter((e) => e.props?.companion === p.id).length]).toEqual([true, 1])
  },
  'thorn-crown': (eng) => () => expect(onArena(eng, HAZARDS.briars)).toHaveLength(16),
  'spear-of-sorrow': (eng, _p, x, y) => {
    const two = [slime(eng, x + 2, y), slime(eng, x + 4, y)]
    return () => expect(two.every((s) => hurt(eng, s))).toBe(true)
  },
  'all-five': (eng, _p, x, y) => {
    const s = slime(eng, x + 3, y + 1)
    return () => expect([hurt(eng, s), status(eng, s, 'bleeding'), status(eng, s, 'webbed')]).toEqual([true, true, true])
  },
  doom: (eng, _p, x, y) => {
    const s = slime(eng, x + 3, y)
    return () => (expect(hurt(eng, s)).toBe(false), after(eng, 55), expect(hurt(eng, s)).toBe(true))
  },
  confess: (eng, _p, x, y) => {
    const s = slime(eng, x + 2, y)
    return () => expect([hurt(eng, s), status(eng, s, 'knelt')]).toEqual([true, true])
  },
  'last-judgement': (eng, _p, x, y) => {
    const s = slime(eng, x + 5, y)
    return () => expect([hurt(eng, s), status(eng, s, 'branded')]).toEqual([true, true])
  },
}

describe('each active skill does what it says', () => {
  /** What each does, on slimes set round the player (who stands at x, y facing right). */
  const CASES: Record<string, (eng: Engine, p: Entity, x: number, y: number) => () => void> = {
    whirlwind: (eng, _p, x, y) => {
      const ring = [slime(eng, x + 1, y), slime(eng, x - 1, y + 1), slime(eng, x, y - 1)]
      return () => expect(ring.every((s) => hurt(eng, s))).toBe(true)
    },
    cleave: (eng, _p, x, y) => {
      const s = slime(eng, x + 1, y)
      return () => expect(200 - eng.world.num(s, 'hp')).toBeGreaterThanOrEqual(2)
    },
    'gale-step': (eng, p) => () => expect(p.combat?.hasteUntil).toBeGreaterThan(eng.world.state.tick),
    mend: (eng, p) => {
      eng.author(() => eng.world.setProp(p, 'hp', 1))
      return () => expect(eng.world.num(p, 'hp')).toBeGreaterThan(1)
    },
    'shadow-strike': (eng, p, x, y) => {
      const s = slime(eng, x + 3, y)
      s.facing = 'left'
      return () => {
        expect(hurt(eng, s)).toBe(true)
        // behind it: the side it does not face
        expect(eng.world.posOf(p)).toMatchObject({ x: x + 4, y })
      }
    },
    envenom: (eng, p) => () => expect(p.combat?.envenomHits).toBe(5),
    'smoke-bomb': (eng, p) => () => expect(p.combat?.veilUntil).toBeGreaterThan(eng.world.state.tick),
    flurry: (eng, _p, x, y) => {
      const s = slime(eng, x + 1, y)
      return () => expect(200 - eng.world.num(s, 'hp')).toBeGreaterThanOrEqual(4)
    },
    multishot: (eng, _p, x, y) => {
      const lines = [slime(eng, x + 3, y), slime(eng, x + 3, y + 1), slime(eng, x + 2, y - 1)]
      return () => expect(lines.every((s) => hurt(eng, s))).toBe(true)
    },
    'leap-shot': (eng, p, x, y) => {
      const s = slime(eng, x + 3, y)
      return () => expect([hurt(eng, s), eng.world.posOf(p)?.x, p.facing]).toEqual([true, x - 2, 'right'])
    },
    'piercing-arrow': (eng, _p, x, y) => {
      const row = [slime(eng, x + 1, y), slime(eng, x + 2, y), slime(eng, x + 3, y)]
      return () => expect(row.every((s) => hurt(eng, s))).toBe(true)
    },
    'arrow-rain': (eng, _p, x, y) => {
      const s = slime(eng, x + 3, y)
      const t = slime(eng, x + 3, y + 1)
      return () => {
        for (let i = 0; i < 25; i++) eng.tick()
        expect([hurt(eng, s), hurt(eng, t)]).toEqual([true, true])
      }
    },
    fireball: (eng, _p, x, y) => {
      const s = slime(eng, x + 3, y)
      const t = slime(eng, x + 4, y + 1)
      return () => expect([hurt(eng, s), hurt(eng, t)]).toEqual([true, true])
    },
    'frost-nova': (eng, _p, x, y) => {
      const s = slime(eng, x + 2, y)
      return () => expect([hurt(eng, s), eng.world.hasStatus({ e: s.id }, 'frozen')]).toEqual([true, true])
    },
    'chain-lightning': (eng, _p, x, y) => {
      const chain = [slime(eng, x + 2, y), slime(eng, x + 3, y + 2), slime(eng, x + 4, y + 4)]
      return () => expect(chain.every((s) => hurt(eng, s))).toBe(true)
    },
    blink: (eng, p, x, y) => {
      slime(eng, x + 2, y)
      return () => expect(eng.world.posOf(p)).toMatchObject({ x: x + 4, y })
    },
    // the professions, deeper
    'throwing-knives': (eng, _p, x, y) => {
      const s = slime(eng, x + 4, y)
      return () => expect(hurt(eng, s)).toBe(true)
    },
    'fan-of-knives': (eng, _p, x, y) => {
      const ring = [slime(eng, x + 1, y + 1), slime(eng, x - 1, y)]
      return () => expect(ring.every((s) => hurt(eng, s) && eng.world.hasStatus({ e: s.id }, 'bleeding'))).toBe(true)
    },
    'vanishing-strikes': (eng, _p, x, y) => {
      const three = [slime(eng, x + 2, y), slime(eng, x, y + 3), slime(eng, x - 3, y)]
      return () => expect(three.every((s) => hurt(eng, s))).toBe(true)
    },
    'concussive-shot': (eng, _p, x, y) => {
      const s = slime(eng, x + 4, y)
      return () => expect([hurt(eng, s), eng.world.hasStatus({ e: s.id }, 'stunned')]).toEqual([true, true])
    },
    'hawk-eye': (eng, p) => () => expect(p.combat?.aimUntil).toBeGreaterThan(eng.world.state.tick),
    'arrow-storm': (eng, _p, x, y) => {
      // through the first in a line to the one behind it, and on the lines two aside
      const hit = [slime(eng, x + 2, y), slime(eng, x + 4, y), slime(eng, x + 3, y + 2)]
      return () => expect(hit.every((s) => hurt(eng, s))).toBe(true)
    },
    'frost-bolt': (eng, _p, x, y) => {
      const s = slime(eng, x + 3, y)
      return () => expect([hurt(eng, s), eng.world.hasStatus({ e: s.id }, 'frozen')]).toEqual([true, true])
    },
    thunderstorm: (eng, _p, x, y) => {
      const s = slime(eng, x + 3, y)
      const t = slime(eng, x + 3, y + 1)
      return () => {
        for (let i = 0; i < 25; i++) eng.tick()
        expect([hurt(eng, s), hurt(eng, t)]).toEqual([true, true])
      }
    },
    meteor: (eng, _p, x, y) => {
      const hit = [slime(eng, x + 3, y), slime(eng, x + 5, y + 2)]
      return () => expect(hit.every((s) => hurt(eng, s))).toBe(true)
    },
    // the advancements (docs/advancement.md): the paths', the masteries', the first trees' four more
    ...ADVANCED_CASES,
  }

  const ALL = SKILLS.filter((s) => s.active)
  it('there is a case for every active skill', () => {
    expect(ALL.map((s) => s.id).sort()).toEqual(Object.keys(CASES).sort())
  })

  for (const def of ALL)
    it(`${def.id} (${textOf(def.name, 'zh')})`, () => {
      const { eng, p, x, y } = field()
      // a weapon that reaches: a bow for the ranger, a staff for the mage; else the bare hand
      if (def.profession === 'ranger' || def.profession === 'mage')
        eng.author(() => eng.world.create(def.profession === 'ranger' ? 'item/weapon/ranged/bow' : 'item/weapon/magic/staff', { on: 'hand', holder: p.id }, { props: { power: 3, range: 6 } }))
      know(eng, def.id)
      const check = CASES[def.id](eng, p, x, y)
      expect(cast(eng, 0), def.id).toBe(true)
      eng.tick()
      check()
      expect(castLeft(eng, p, def.id)).toBeGreaterThan(0)
    })
})

describe('what the buffs do in a fight', () => {
  it('Gale Step quickens the step, a Smoke Bomb hides one, Envenom makes blows bleed', () => {
    const { eng, p, x, y } = field()
    const w = eng.world
    const s = slime(eng, x + 1, y)
    const step = combatDelay(w, p, 100, 'move')
    know(eng, 'gale-step')
    cast(eng, 0)
    expect(combatDelay(w, p, 100, 'move')).toBeLessThan(step)
    // Envenom: the next blows open a bleed, five of them
    know(eng, 'envenom')
    cast(eng, 0)
    expect(combatStrike(w, p, s, 10, 1, undefined, false).bleed).toBeGreaterThan(0)
    expect(p.combat?.envenomHits).toBe(4)
    // a Smoke Bomb: the slime, hostile and beside one, does not come at one
    eng.author(() => w.setProp(p, 'hp', 50))
    s.ai = { behaviour: 'melee', temper: 'aggressive', sight: 5, home: { map: 'arena', x: x + 1, y } }
    know(eng, 'smoke-bomb')
    cast(eng, 0)
    const hp = w.num(p, 'hp')
    for (let i = 0; i < 25; i++) eng.tick()
    expect(w.num(p, 'hp')).toBe(hp)
  })
})

describe('where active skills come from: the tree, a book, what one wears', () => {
  it('a skill book read (used on oneself) teaches its skill with no points, and is used up; one known, or another profession\'s, is not read', () => {
    const { eng, p } = field()
    const w = eng.world
    const give = (id: string) => eng.author(() => w.create('item/document/skillbook', { on: 'inside', holder: p.id }, skillBook(id)))
    const book = give('whirlwind')
    expect(w.num(p, 'skillPoints')).toBe(0)
    // a book does not leap the tree: Whirlwind comes after Sweep, and is not read before it
    expect(SKILL_BY_ID.whirlwind.requires).toEqual(['sweep'])
    w.fx = []
    eng.act('use', p.id, { e: p.id }, { instrument: { e: book.id } })
    eng.tick()
    expect([w.get(book.id) !== undefined, knownActives(eng, p)]).toEqual([true, []])
    expect(w.fx.some((f) => f.t === 'log' && textOf(f.text, 'en').includes('Sweep'))).toBe(true)
    eng.author(() => w.addTag(p, 'skill:sweep'))
    eng.act('use', p.id, { e: p.id }, { instrument: { e: book.id } })
    eng.tick()
    expect(knownActives(eng, p)).toEqual([{ id: 'whirlwind', source: 'book' }])
    expect(w.get(book.id)).toBeUndefined()
    expect(snapshot(eng).player.actives).toEqual([{ id: 'whirlwind', source: 'book' }])
    // known already: the second copy stays
    const again = give('whirlwind')
    eng.act('use', p.id, { e: p.id }, { instrument: { e: again.id } })
    eng.tick()
    expect(w.get(again.id)).toBeDefined()
    // a mage's book, the player no mage: not read
    const fire = give('fireball')
    eng.act('use', p.id, { e: p.id }, { instrument: { e: fire.id } })
    eng.tick()
    expect([w.get(fire.id) !== undefined, knownActives(eng, p).some((k) => k.id === 'fireball')]).toEqual([true, false])
    // what a book taught is cast like any other
    expect(setSkill(eng, 2, 'whirlwind')).toBe(true)
    expect(cast(eng, 2)).toBe(true)
  })

  it('a profession\'s book bought out of order is not read before the skill it comes after in the tree (Smoke Bomb after Shadow Strike)', () => {
    const { eng, p } = field()
    const w = eng.world
    eng.author(() => w.setProp(p, 'profession', 'assassin'))
    const smoke = eng.author(() => w.create('item/document/skillbook', { on: 'inside', holder: p.id }, skillBook('smoke-bomb')))
    const read = () => (eng.act('use', p.id, { e: p.id }, { instrument: { e: smoke.id } }), eng.tick())
    const knows = () => [w.get(smoke.id) === undefined, knownActives(eng, p).some((k) => k.id === 'smoke-bomb')]
    expect(SKILL_BY_ID['smoke-bomb'].requires).toEqual(['shadow-strike'])
    read()
    expect(knows()).toEqual([false, false])
    eng.author(() => w.addTag(p, 'skill:shadow-strike'))
    read()
    expect(knows()).toEqual([true, true])
  })

  it('a piece that lends a skill gives it while worn, whatever one\'s profession; taken off, the slot keeps it but it is not had', () => {
    const { eng, p, x, y } = field()
    const w = eng.world
    const helm = eng.author(() => w.create('item/armor/helmet', { on: 'inside', holder: p.id }, { props: { skill: 'fireball' } }))
    eng.controls.sync()
    expect(setSkill(eng, 0, 'fireball')).toBe(false)
    eng.controls.wear(helm.id, true)
    expect(knownActives(eng, p)).toEqual([{ id: 'fireball', source: 'gear', item: helm.id }])
    expect(setSkill(eng, 0, 'fireball')).toBe(true)
    const s = slime(eng, x + 3, y)
    expect(cast(eng, 0)).toBe(true)
    expect(hurt(eng, s)).toBe(true)
    // taken off: still in the slot, shown as not had, and not cast
    eng.controls.wear(helm.id)
    for (let i = 0; i < 70; i++) eng.tick()
    expect(snapshot(eng).player.skillbar[0]).toMatchObject({ id: 'fireball', usable: false })
    expect(cast(eng, 0)).toBe(false)
  })
})

describe('the professions, deeper: enhancements and talents', () => {
  /** The player knows these skills (and their profession). */
  const learn = (eng: Engine, ...ids: string[]) =>
    eng.author(() => {
      for (const id of ids) {
        const def = SKILL_BY_ID[id]
        if (def.profession) eng.world.setProp(eng.world.player, 'profession', def.profession)
        eng.world.addTag(eng.world.player, `skill:${id}`)
      }
    })
  const rest = (eng: Engine, n: number) => { for (let i = 0; i < n; i++) eng.tick() }

  it('an enhancement adds its numbers to the skill it strengthens; Mana Surge shortens every cooldown', () => {
    const { eng, p } = field()
    learn(eng, 'shadow-strike')
    const base = effectiveActive(eng, p, SKILL_BY_ID['shadow-strike'])
    learn(eng, 'shadow-mastery')
    const strong = effectiveActive(eng, p, SKILL_BY_ID['shadow-strike'])
    expect([strong.cooldown, strong.range]).toEqual([base.cooldown - 30, base.range! + 2])
    expect(castCooldown(eng, p, 'shadow-strike')).toBe(strong.cooldown)
    learn(eng, 'fireball')
    const before = castCooldown(eng, p, 'fireball')
    learn(eng, 'mana-surge')
    eng.author(() => eng.world.setProp(p, 'cdr', 0.1))
    expect(castCooldown(eng, p, 'fireball')).toBe(Math.round(before * 0.9))
  })

  it('Elemental Master: every third cast does not rest; Marksman: a cast that hits brings the others nearer', () => {
    const { eng, p, x, y } = field()
    learn(eng, 'blink', 'elemental-master')
    expect(setSkill(eng, 0, 'blink')).toBe(true)
    for (let i = 0; i < 3; i++) {
      eng.author(() => eng.teleport(p, { map: 'arena', x: 5, y }))
      p.facing = 'right'
      expect(cast(eng, 0)).toBe(true)
      if (i < 2) rest(eng, castLeft(eng, p, 'blink'))
    }
    expect(castLeft(eng, p, 'blink')).toBe(0)
    const r = field()
    learn(r.eng, 'multishot', 'leap-shot', 'marksman')
    r.eng.author(() => r.eng.world.create('item/weapon/ranged/bow', { on: 'hand', holder: r.p.id }, { props: { power: 3, range: 6 } }))
    setSkill(r.eng, 0, 'leap-shot')
    setSkill(r.eng, 1, 'multishot')
    cast(r.eng, 0)
    const left = castLeft(r.eng, r.p, 'leap-shot')
    slime(r.eng, r.x + 3, r.y)
    r.p.facing = 'right'
    expect(cast(r.eng, 1)).toBe(true)
    expect(castLeft(r.eng, r.p, 'leap-shot')).toBe(left - 5)
    void x
  })

  it('a defeat answered: Master Assassin readies Shadow Strike; All Is Kindling hastens every skill when the felled was burning', () => {
    /** Fell a weak slime beside the player with a blow (burning, if so). */
    const fell = (eng: Engine, p: Entity, burning = false) => {
      const at = eng.world.posOf(p)!
      const weak = eng.author(() => eng.world.create('actor/creature/slime/green_slime', { on: 'tile', map: 'arena', x: at.x + 1, y: at.y }, { props: { hp: 1, maxHp: 1 } }))
      if (burning) eng.author(() => eng.applyStatus({ e: weak.id }, 'burning', 50))
      p.facing = 'right'
      eng.setCooldown('atk:player', 0)
      expect(eng.attack(p, { e: weak.id })).toBe(true)
      eng.tick()
      expect(eng.world.get(weak.id) === undefined || eng.world.num(weak, 'hp') <= 0).toBe(true)
    }
    // the assassin
    const a = field()
    learn(a.eng, 'shadow-strike', 'master-assassin')
    setSkill(a.eng, 0, 'shadow-strike')
    slime(a.eng, a.x + 3, a.y)
    expect(cast(a.eng, 0)).toBe(true)
    expect(castLeft(a.eng, a.p, 'shadow-strike')).toBeGreaterThan(0)
    a.eng.author(() => a.eng.teleport(a.p, { map: 'arena', x: 5, y: 5 }))
    fell(a.eng, a.p)
    expect(castLeft(a.eng, a.p, 'shadow-strike')).toBe(0)
    // the Worldfire's: a foe that falls burning
    const b = field()
    learn(b.eng, 'whirlwind', 'all-is-kindling')
    setSkill(b.eng, 0, 'whirlwind')
    cast(b.eng, 0)
    const whirl = castLeft(b.eng, b.p, 'whirlwind')
    fell(b.eng, b.p)
    expect(castLeft(b.eng, b.p, 'whirlwind')).toBe(whirl - 1)
    fell(b.eng, b.p, true)
    expect(castLeft(b.eng, b.p, 'whirlwind')).toBeLessThanOrEqual(whirl - 1 - 20)
  })

  it('the talents that shape a blow: Venom Mastery, Nightstalker; Nimble Blade dodges', () => {
    const { eng, p, x, y } = field()
    const w = eng.world
    const s = slime(eng, x + 1, y)
    const strike = (weapon: Entity) => combatStrike(w, p, s, 10, 1, weapon, false).power
    // the assassin's dagger on a bleeding slime
    learn(eng, 'assassin-training')
    const dagger = eng.author(() => w.create('item/weapon/blade/dagger', { on: 'hand', holder: p.id }, { props: { power: 2 } }))
    eng.author(() => eng.applyStatus({ e: s.id }, 'bleeding', 40))
    const plain = strike(dagger)
    learn(eng, 'venom-mastery')
    expect(strike(dagger)).toBeGreaterThan(plain)
    // Nightstalker: the same blow, by night
    const day = strike(dagger)
    learn(eng, 'nightstalker')
    expect(strike(dagger)).toBe(day)
    eng.author(() => { while (!w.isNight()) w.state.tick += TICKS_PER_HOUR })
    expect(strike(dagger)).toBeGreaterThan(day)
    // Nimble Blade: blows miss now and then, with the dagger in hand
    learn(eng, 'nimble-blade')
    let missed = 0
    for (let i = 0; i < 400; i++) if (eng.author(() => combatDamage(eng, p, 5, s, false)) === 0) missed++
    expect(missed).toBeGreaterThan(10)
  })

  it('Deadly Shot: a bow\'s criticals cut deeper; Elementalist: a staff with an element strikes harder', () => {
    const { eng, p, x, y } = field()
    const w = eng.world
    const s = slime(eng, x + 3, y)
    learn(eng, 'ranger-archery')
    const bow = eng.author(() => w.create('item/weapon/ranged/bow', { on: 'hand', holder: p.id }, { props: { power: 3, range: 6 } }))
    eng.author(() => w.setProp(p, 'critChance', 1))
    const crit = combatStrike(w, p, s, 10, 3, bow, false)
    expect(crit.critical).toBe(true)
    learn(eng, 'deadly-shot')
    expect(combatStrike(w, p, s, 10, 3, bow, false).power).toBeGreaterThan(crit.power)
    eng.author(() => w.setProp(p, 'critChance', 0))
    const m = field()
    learn(m.eng, 'mage-focus')
    const staff = m.eng.author(() => m.eng.world.create('item/weapon/magic/staff', { on: 'hand', holder: m.p.id }, { props: { power: 3, range: 4, element: 'fire' } }))
    const t = slime(m.eng, m.x + 3, m.y)
    const plain = combatStrike(m.eng.world, m.p, t, 10, 3, staff, false).power
    learn(m.eng, 'elementalist')
    expect(combatStrike(m.eng.world, m.p, t, 10, 3, staff, false).power).toBeGreaterThan(plain)
  })

  it('Hawk Eye: a bow reaches farther', () => {
    const { eng, p } = field()
    const w = eng.world
    const bow = eng.author(() => w.create('item/weapon/ranged/bow', { on: 'hand', holder: p.id }, { props: { power: 3, range: 6 } }))
    const far = eng.reachOf('use', p, undefined, bow)!
    learn(eng, 'hawk-eye')
    setSkill(eng, 1, 'hawk-eye')
    cast(eng, 1)
    expect(eng.reachOf('use', p, undefined, bow)).toBe(far + 3)
  })
})
