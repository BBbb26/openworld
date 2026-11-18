// The advancements (docs/advancement.md): a path of three at level 10, the profession's mastery at 16, at a trainer;
// a path's skills learned only on it, the mastery's only once advanced so far; a change of path gives its points back.
// The new skills do what they say on a field of slimes: the passives in data, the buffs, the fields and traps, the
// detonations, the leaps, the beasts and the dead called and commanded, the marks, the wards, what a Demon Hunter shares
// with those who follow.

import { describe, expect, it } from 'vitest'
import { Game, OFFHAND, RuleLibrary, cannotLearn, onPath, textOf, type Engine, type Entity, type MapData } from '@openworld/engine'
import { ADVANCE_LEVELS, ADVANCE_POINTS, advance, advanceProfession, cast, castLeft, combatDamage, combatDelay, combatStrike, effectiveActive, setSkill, thirdOf } from '@openworld/modules'
import { ADVANCEMENT_SKILLS, BASE_RULES, HAZARDS, MASTERIES, PATHS, SKILLS, SKILL_BY_ID, SKILL_PROFESSIONS, STORY_RULES, SUMMONS, branchesForProfession, buildOntology, decodeChunk, skillsForProfession } from '@openworld-game/content'
import { buildFord } from '../src/demo/world.ts'

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
/** The player knows a skill (its profession and path theirs), in the bar's first slot if it is cast. */
function know(eng: Engine, id: string): void {
  const w = eng.world
  const def = SKILL_BY_ID[id]
  eng.author(() => {
    if (def.profession) w.setProp(w.player, 'profession', def.profession)
    if (def.path) w.setProp(w.player, 'path', [def.path].flat()[0])
    w.addTag(w.player, `skill:${id}`)
  })
  if (def.active) expect(setSkill(eng, 0, id)).toBe(true)
}
const slime = (eng: Engine, x: number, y: number, props: Record<string, number> = {}) => eng.author(() => eng.world.create('actor/creature/slime/green_slime', { on: 'tile', map: 'arena', x, y }, { props: { hp: 200, maxHp: 200, ...props } }))
const lost = (eng: Engine, e: Entity) => 200 - eng.world.num(e, 'hp')

describe('the advancements (docs/advancement.md)', () => {
  it('every profession has two paths or three (at least three active and three passive skills each, one ultimate), a third of five or more on each path, and four more first skills', () => {
    for (const prof of SKILL_PROFESSIONS) {
      expect(prof.paths?.map((p) => p.id), prof.id).toEqual(PATHS[prof.id].map((p) => p.id))
      expect(prof.paths!.length, prof.id).toBeGreaterThanOrEqual(2)
      for (const path of prof.paths!) {
        const own = ADVANCEMENT_SKILLS.filter((s) => s.path === path.id && !s.tier)
        expect(own.filter((s) => s.active).length, path.id).toBeGreaterThanOrEqual(3)
        expect(own.filter((s) => !s.active).length, path.id).toBeGreaterThanOrEqual(3)
        expect(own.every((s) => s.profession === prof.id && s.branch === 'path'), path.id).toBe(true)
        // one ultimate, two points, after the rest
        expect(own.filter((s) => (s.cost ?? 1) === 2 && s.active).length, path.id).toBe(1)
        // the third on this path: the profession's mastery, or the path's own
        const third = ADVANCEMENT_SKILLS.filter((s) => s.profession === prof.id && s.tier === 3 && onPath(s, path.id))
        expect(third.length, path.id).toBeGreaterThanOrEqual(5)
        expect(third.filter((s) => s.active).length, path.id).toBeGreaterThanOrEqual(2)
        expect(third.every((s) => s.branch === 'mastery'), path.id).toBe(true)
      }
      expect(prof.mastery?.name).toEqual(MASTERIES[prof.id].name)
      expect(ADVANCEMENT_SKILLS.filter((s) => s.profession === prof.id && s.branch === 'profession')).toHaveLength(4)
    }
    // every requirement is a skill of the same profession, learnable wherever the skill is
    for (const s of ADVANCEMENT_SKILLS)
      for (const r of s.requires ?? []) {
        expect(SKILL_BY_ID[r]?.profession, `${s.id} ← ${r}`).toBe(s.profession)
        for (const path of [s.path ?? []].flat()) expect(onPath(SKILL_BY_ID[r], path), `${s.id} ← ${r} on ${path}`).toBe(true)
      }
  })

  it('the assassin\'s third is its path\'s own — Hell Sovereign, Phantom, Ghostwail — name and skills', () => {
    const assassin = SKILL_PROFESSIONS.find((p) => p.id === 'assassin')!
    expect(assassin.paths!.map((p) => [p.id, textOf(p.name, 'zh'), p.third && textOf(p.third.name, 'zh')])).toEqual([['necromancer', '死灵术士', '地狱支配者'], ['shadowdancer', '影舞者', '幻影'], ['demonhunter', '猎魔人', '鬼泣']])
    expect(textOf(thirdOf(assassin, 'demonhunter')!.name, 'zh')).toBe('鬼泣')
    for (const path of ['necromancer', 'shadowdancer', 'demonhunter']) expect(thirdOf(assassin, path)?.doc, path).not.toEqual(MASTERIES.assassin.doc)
    expect(branchesForProfession('assassin', 'necromancer').find((b) => b.id === 'mastery')?.name.zh).toBe('地狱支配者')
    const thirdOn = (path: string) => skillsForProfession('assassin', path).filter((s) => s.tier === 3).map((s) => s.id)
    expect(thirdOn('necromancer')).toEqual(['hell-pact', 'hell-guard', 'pestilence', 'soul-harvest', 'plague-lord', 'gate-of-the-styx', 'dominion-of-hell'])
    expect(thirdOn('shadowdancer')).toEqual(['lethality', 'shadow-double', 'ghost', 'fade', 'shadow-double-plus', 'assassinate', 'shadow-lord'])
    expect(thirdOn('demonhunter')).toEqual(['exorcist', 'death-mark', 'hunters-sanctum', 'death-mark-plus', 'undying-hunt', 'ghost-howl', 'hex-plague'])
    // every path of the assassin twelve skills on two arms
    for (const path of ['necromancer', 'shadowdancer', 'demonhunter']) expect(skillsForProfession('assassin', path).filter((s) => s.path === path && !s.tier), path).toHaveLength(12)
  })

  it('the mage\'s paths are the three elements\', each with a third of its own — Everwinter, Worldfire, Wrath of Heaven', () => {
    const mage = SKILL_PROFESSIONS.find((p) => p.id === 'mage')!
    expect(mage.paths!.map((p) => [p.id, textOf(p.name, 'zh'), p.third && textOf(p.third.name, 'zh')])).toEqual([['cryomancer', '霜术师', '永冬'], ['pyromancer', '炎术师', '劫火'], ['stormcaller', '雷术师', '天罚']])
    expect(branchesForProfession('mage', 'stormcaller').find((b) => b.id === 'mastery')?.name.zh).toBe('天罚')
    const thirdOn = (path: string) => skillsForProfession('mage', path).filter((s) => s.tier === 3).map((s) => s.id)
    expect(thirdOn('cryomancer')).toEqual(['heart-of-winter', 'glacier', 'cold-wave', 'frostbite', 'cold-wave-plus', 'endless-winter', 'still-time'])
    expect(thirdOn('pyromancer')).toEqual(['kalpa-heart', 'immolate', 'scorched-earth', 'burnout', 'scorched-earth-plus', 'worldfire', 'all-is-kindling'])
    expect(thirdOn('stormcaller')).toEqual(['heavens-might', 'judgement-bolt', 'thunder-shroud', 'thunderstrike', 'thunder-shroud-plus', 'wrath-of-heaven', 'storm-unending'])
    for (const path of ['cryomancer', 'pyromancer', 'stormcaller']) expect(skillsForProfession('mage', path).filter((s) => s.path === path && !s.tier), path).toHaveLength(12)
    // (no skill of the mage is the old shared mastery's any more)
    expect(SKILLS.filter((s) => s.profession === 'mage' && s.tier === 3 && !s.path)).toEqual([])
  })

  it('the ranger\'s paths are the Hunter, the Sniper and the Skirmisher, each with a third of its own — Greenwood Dawn, Hawkeye, Skywing', () => {
    const ranger = SKILL_PROFESSIONS.find((p) => p.id === 'ranger')!
    expect(ranger.paths!.map((p) => [p.id, textOf(p.name, 'zh'), p.third && textOf(p.third.name, 'zh')])).toEqual([['hunter', '猎人', '森海飞霞'], ['sharpshooter', '狙击手', '鹰眼'], ['skirmisher', '漫游射手', '天空之翼']])
    expect(branchesForProfession('ranger', 'skirmisher').find((b) => b.id === 'mastery')?.name.zh).toBe('天空之翼')
    const thirdOn = (path: string) => skillsForProfession('ranger', path).filter((s) => s.tier === 3).map((s) => s.id)
    expect(thirdOn('hunter')).toEqual(['greenwood-heart', 'the-pack', 'hunting-net', 'feral-instinct', 'hunting-net-plus', 'dawn-flight', 'lord-of-the-hunt'])
    expect(thirdOn('sharpshooter')).toEqual(['hawks-sight', 'sunpiercer', 'sight-lock', 'still-as-stone', 'sight-lock-plus', 'one-shot', 'unblinking'])
    expect(thirdOn('skirmisher')).toEqual(['sky-heart', 'wingbeat', 'flying-feathers', 'ride-the-wind', 'flying-feathers-plus', 'falling-feathers', 'sky-walker'])
    for (const path of ['hunter', 'sharpshooter', 'skirmisher']) expect(skillsForProfession('ranger', path).filter((s) => s.path === path && !s.tier), path).toHaveLength(12)
    // (no profession keeps a mastery shared by its paths any more: every third is a path's own)
    expect(SKILLS.filter((s) => s.tier === 3 && !s.path)).toEqual([])
  })

  it('the cleric\'s paths are the Paladin, the Avenger and the Inquisitor, each with a third of its own — the Evangelist, the Sentence of Suffering, Doomsday', () => {
    const cleric = SKILL_PROFESSIONS.find((p) => p.id === 'cleric')!
    expect([textOf(cleric.name, 'zh'), cleric.weapon?.type, cleric.offhand?.type]).toEqual(['圣职者', 'item/weapon/blunt/cross', 'item/armor/rosary'])
    expect(cleric.paths!.map((p) => [p.id, textOf(p.name, 'zh'), p.third && textOf(p.third.name, 'zh')])).toEqual([['paladin', '圣骑士', '福音传道者'], ['avenger', '复仇者', '苦痛断罪'], ['inquisitor', '异端审判者', '末日裁决']])
    const thirdOn = (path: string) => skillsForProfession('cleric', path).filter((s) => s.tier === 3).map((s) => s.id)
    expect(thirdOn('paladin')).toEqual(['gospel', 'call-the-faithful', 'psalm', 'apostles', 'psalm-plus', 'gate-of-heaven', 'crown-of-glory'])
    expect(thirdOn('avenger')).toEqual(['five-sufferings', 'thorn-crown', 'spear-of-sorrow', 'nail-and-wood', 'spear-of-sorrow-plus', 'all-five', 'atonement'])
    expect(thirdOn('inquisitor')).toEqual(['last-days', 'doom', 'confess', 'inevitable', 'confess-plus', 'last-judgement', 'dies-irae'])
    for (const path of ['paladin', 'avenger', 'inquisitor']) expect(skillsForProfession('cleric', path).filter((s) => s.path === path && !s.tier), path).toHaveLength(12)
    // its first tree as long as the others'
    expect(SKILLS.filter((s) => s.profession === 'cleric' && s.branch === 'profession')).toHaveLength(26)
  })

  it('a path\'s skill is learned only on that path, a mastery\'s only once advanced to the third (and only where that path has it)', () => {
    const { eng, p } = field()
    const w = eng.world
    eng.author(() => (w.setProp(p, 'profession', 'assassin'), w.setProp(p, 'skillPoints', 20)))
    expect(cannotLearn(p, SKILL_BY_ID['shadow-poise'])).toBe('path')
    eng.author(() => w.setProp(p, 'path', 'necromancer'))
    expect(cannotLearn(p, SKILL_BY_ID['shadow-poise'])).toBe('path')
    expect(cannotLearn(p, SKILL_BY_ID['grave-pact'])).toBeUndefined()
    expect(cannotLearn(p, SKILL_BY_ID['hell-pact'])).toBe('tier')
    expect(cannotLearn(p, SKILL_BY_ID.lethality)).toBe('path')
    eng.author(() => w.setProp(p, 'advancement', 3))
    expect(cannotLearn(p, SKILL_BY_ID['hell-pact'])).toBeUndefined()
    eng.author(() => w.setProp(p, 'path', 'shadowdancer'))
    expect(cannotLearn(p, SKILL_BY_ID.lethality)).toBeUndefined()
    expect(cannotLearn(p, SKILL_BY_ID['hell-pact'])).toBe('path')
    expect(cannotLearn(p, SKILL_BY_ID.exorcist)).toBe('path')
  })

  it('a change of path gives back what the new path has not: the old path\'s skills and its third\'s, never the first tree\'s', () => {
    const { eng, p } = field()
    const w = eng.world
    eng.author(() => {
      w.setProp(p, 'profession', 'assassin')
      w.setProp(p, 'path', 'necromancer')
      w.setProp(p, 'advancement', 3)
      for (const id of ['grave-pact', 'hell-pact', 'garrote']) w.addTag(p, `skill:${id}`)
      w.setProp(p, 'skillPoints', 0)
    })
    eng.author(() => advance(w, p, 2, 'shadowdancer', SKILLS))
    expect([w.hasTag(p, 'skill:grave-pact'), w.hasTag(p, 'skill:hell-pact'), w.hasTag(p, 'skill:garrote'), w.num(p, 'skillPoints')]).toEqual([false, false, true, 2])
    eng.author(() => (w.addTag(p, 'skill:lethality'), advance(w, p, 2, 'demonhunter', SKILLS)))
    expect([w.hasTag(p, 'skill:lethality'), w.num(p, 'skillPoints')]).toEqual([false, 3])
  })

  it('at a trainer: the second advancement at level 10 sets one on a path (+3 points), a change of path gives its points back, the third opens the mastery', () => {
    const { index, chunks } = buildFord()
    const game = Game.create(index, buildOntology(), new RuleLibrary([...BASE_RULES, ...STORY_RULES]))
    for (const c of chunks) game.loadChunk(decodeChunk(c))
    const eng = game.engine
    const w = eng.world
    const p = w.player
    const bram = w.get('npc.bram')!
    const at = w.posOf(bram)!
    eng.author(() => {
      eng.quests.put('descent', 'done')
      eng.teleport(p, { map: at.map, x: at.x + 1, y: at.y })
      w.setProp(p, 'profession', 'ranger')
      w.setProp(p, 'level', 9)
      w.setProp(p, 'skillPoints', 0)
    })
    const advance = (tier: number, path?: string) => advanceProfession(eng, tier, path, SKILL_PROFESSIONS, SKILLS)
    expect(advance(2, 'sharpshooter')).toBe('level')
    eng.author(() => w.setProp(p, 'level', ADVANCE_LEVELS[2]))
    expect(advance(3)).toBe('order')
    expect(advance(2, 'pyromancer')).toBe('path')
    expect(advance(2, 'sharpshooter')).toBeUndefined()
    expect([w.prop(p, 'path'), w.num(p, 'advancement'), w.num(p, 'skillPoints')]).toEqual(['sharpshooter', 2, ADVANCE_POINTS])
    expect(eng.controls.learn(SKILL_BY_ID['eagle-eye'])).toBe(true)
    expect(eng.controls.learn(SKILL_BY_ID.deadeye)).toBe(true)
    // a change of path: its two points back, its skills gone, no new points for a tier already reached
    expect(advance(2, 'hunter')).toBeUndefined()
    expect([w.prop(p, 'path'), w.num(p, 'skillPoints'), w.hasTag(p, 'skill:deadeye')]).toEqual(['hunter', ADVANCE_POINTS, false])
    expect(advance(3)).toBe('level')
    eng.author(() => w.setProp(p, 'level', ADVANCE_LEVELS[3]))
    expect(advance(3)).toBeUndefined()
    expect([w.num(p, 'advancement'), w.num(p, 'skillPoints')]).toEqual([3, ADVANCE_POINTS * 2])
    expect(eng.controls.learn(SKILL_BY_ID['greenwood-heart'])).toBe(true)
    // (another path's third is not this one's)
    expect(eng.controls.learn(SKILL_BY_ID['hawks-sight'])).toBe(false)
    // away from a trainer: no advancing
    eng.author(() => eng.teleport(p, { map: 'ford', x: 20, y: 18 }))
    expect(advance(2, 'skirmisher')).toBe('trainer')
  }, 120_000)

  it('the passives in data pay under their condition: Hunter\'s Lore on the afflicted, Undying Hunt when hurt', () => {
    const { eng, p, x, y } = field()
    const w = eng.world
    know(eng, 'hunters-lore')
    const s = slime(eng, x + 1, y)
    const plain = combatStrike(w, p, s, 100, 1, undefined, false).power
    eng.author(() => eng.applyStatus({ e: s.id }, 'bleeding', 50))
    expect(combatStrike(w, p, s, 100, 1, undefined, false).power).toBeCloseTo(plain * 1.15, 5)
    // Undying Hunt: half of health or less, a fifth less taken
    know(eng, 'undying-hunt')
    const before = combatDamage(eng, p, 40, s, false)
    eng.author(() => w.setProp(p, 'hp', 1))
    expect(combatDamage(eng, p, 40, s, false)).toBeLessThan(before)
  })

  it('a buff pays while it lasts, at its price: Blood Offering costs a share of health and strikes harder for 8 s', () => {
    const { eng, p, x, y } = field()
    const w = eng.world
    know(eng, 'blood-offering')
    const s = slime(eng, x + 1, y)
    const hp = w.num(p, 'hp')
    const plain = combatStrike(w, p, s, 100, 1, undefined, false).power
    expect(cast(eng, 0)).toBe(true)
    expect(w.num(p, 'hp')).toBeLessThan(hp)
    expect(combatStrike(w, p, s, 100, 1, undefined, false).power).toBeGreaterThan(plain * 1.45)
    for (let i = 0; i < 90; i++) eng.tick()
    expect(combatStrike(w, p, s, 100, 1, undefined, false).power).toBeCloseTo(plain, 5)
  })

  it('a field lays the game\'s hazards on its pattern, and they do what they say to a foe who walks in: Miasma poisons, a Snare holds and is spent', () => {
    const { eng, p, x, y } = field()
    const w = eng.world
    know(eng, 'miasma')
    expect(cast(eng, 0)).toBe(true)
    const clouds = w.entitiesOnMap('arena').filter((e) => e.type === HAZARDS.miasma)
    expect(clouds).toHaveLength(9)
    // a foe stepping into the cloud is poisoned; the caster's own cloud never hurts the caster
    const s = slime(eng, x + 3, y + 2)
    eng.act('move', s.id, { e: s.id }, { instrument: null, params: { map: 'arena', x: x + 3, y: y + 1 } })
    eng.tick()
    expect(w.hasStatus({ e: s.id }, 'poisoned')).toBe(true)
    know(eng, 'snare-trap')
    p.facing = 'down'
    expect(cast(eng, 0)).toBe(true)
    const snare = w.entitiesOnMap('arena').find((e) => e.type === HAZARDS.snare)!
    const t = slime(eng, x, y + 2)
    eng.act('move', t.id, { e: t.id }, { instrument: null, params: { map: 'arena', x, y: y + 1 } })
    eng.tick()
    expect(w.hasStatus({ e: t.id }, 'webbed')).toBe(true)
    expect(w.get(snare.id)).toBeUndefined()
  })

  it('a detonation bursts what is in its status and ends it (Combustion on the burning); a leap slams where it lands', () => {
    const { eng, p, x, y } = field()
    const w = eng.world
    know(eng, 'combustion')
    const s = slime(eng, x + 2, y)
    eng.author(() => eng.applyStatus({ e: s.id }, 'burning', 50))
    expect(cast(eng, 0)).toBe(true)
    expect(lost(eng, s)).toBeGreaterThan(0)
    expect(w.hasStatus({ e: s.id }, 'burning')).toBe(false)
    eng.author(() => w.destroy(s))
    know(eng, 'meteor-cut')
    const a = slime(eng, x + 4, y)
    expect(cast(eng, 0)).toBe(true)
    expect([lost(eng, a) > 0, w.posOf(p)!.x]).toEqual([true, x + 3])
  })

  it('the Necromancer fights through the dead it raises: stronger by the Grave Pact, every blow of theirs poisoned (Grave Toxin), a poisoned foe they fell bursts (Corpse Burst)', () => {
    const { eng, p, x, y } = field()
    const w = eng.world
    know(eng, 'raise-dead')
    expect(cast(eng, 0)).toBe(true)
    const raised = w.entitiesOnMap('arena').filter((e) => e.type === SUMMONS.skeleton)
    expect(raised).toHaveLength(2)
    expect(raised.every((e) => e.props?.companion === p.id && !eng.hostileTo(e, p))).toBe(true)
    const hp = w.num(raised[0], 'maxHp')
    know(eng, 'grave-pact')
    eng.setCooldown(`skill:raise-dead:${p.id}`, 0)
    expect(cast(eng, 0)).toBe(true)
    const bound = w.entitiesOnMap('arena').find((e) => e.type === SUMMONS.skeleton && !raised.includes(e))!
    expect(w.num(bound, 'maxHp')).toBe(Math.round(hp * 1.5))
    // the dead's blows poison; the Necromancer's own do not
    const s = slime(eng, x + 5, y + 5)
    expect(combatStrike(w, bound, s, 10, 1, undefined, true).afflict).toBeUndefined()
    know(eng, 'grave-toxin')
    expect(combatStrike(w, bound, s, 10, 1, undefined, true).afflict?.status).toBe('poisoned')
    expect(combatStrike(w, p, s, 10, 1, undefined, true).afflict).toBeUndefined()
    // a poisoned foe the dead fell bursts on those near it
    know(eng, 'corpse-burst')
    eng.author(() => {
      w.destroy(s)
      eng.teleport(bound, { map: 'arena', x: x + 5, y: y + 5 })
    })
    bound.facing = 'right'
    const weak = slime(eng, x + 6, y + 5, { hp: 1, maxHp: 1 })
    const near = slime(eng, x + 7, y + 5)
    eng.author(() => eng.applyStatus({ e: weak.id }, 'poisoned', 50))
    eng.setCooldown(`atk:${bound.id}`, 0)
    expect(eng.attack(bound, { e: weak.id })).toBe(true)
    eng.tick()
    expect(w.get(weak.id) === undefined || w.num(weak, 'hp') <= 0).toBe(true)
    expect([lost(eng, near) > 0, w.hasStatus({ e: near.id }, 'poisoned')]).toEqual([true, true])
  })

  it('the Necromancer drives up to four of its dead at a foe; Hell Sovereign: a Hell Pact makes them stronger again, a Soul Harvest feeds on their fellings', () => {
    const { eng, p, x, y } = field()
    const w = eng.world
    const dead = [1, -1, 2].map((dy) => eng.author(() => w.create(SUMMONS.skeleton, { on: 'tile', map: 'arena', x: x - 1, y: y + dy }, { props: { summoner: p.id, companion: p.id } })))
    const s = slime(eng, x + 4, y)
    know(eng, 'drive-the-dead')
    expect(cast(eng, 0)).toBe(true)
    expect(dead.every((d) => Math.max(Math.abs(w.posOf(d)!.x - (x + 4)), Math.abs(w.posOf(d)!.y - y)) === 1)).toBe(true)
    expect([lost(eng, s) > 0, w.hasStatus({ e: s.id }, 'poisoned')]).toEqual([true, true])
    // a Hell Pact on top of the Grave Pact
    know(eng, 'grave-pact')
    know(eng, 'raise-dead')
    eng.setCooldown(`skill:raise-dead:${p.id}`, 0)
    expect(cast(eng, 0)).toBe(true)
    const bound = w.entitiesOnMap('arena').filter((e) => e.type === SUMMONS.skeleton && !dead.includes(e))
    know(eng, 'hell-pact')
    eng.setCooldown(`skill:raise-dead:${p.id}`, 0)
    know(eng, 'raise-dead')
    expect(cast(eng, 0)).toBe(true)
    const hellbound = w.entitiesOnMap('arena').find((e) => e.type === SUMMONS.skeleton && !dead.includes(e) && !bound.includes(e))!
    expect(w.num(hellbound, 'maxHp')).toBe(Math.round(22 * 1.5 * 1.3))
    // a felling by the dead brings the raiser's skills nearer
    know(eng, 'soul-harvest')
    eng.setCooldown(`skill:raise-dead:${p.id}`, 100)
    const weak = slime(eng, x + 8, y + 8, { hp: 1, maxHp: 1 })
    eng.author(() => eng.teleport(hellbound, { map: 'arena', x: x + 7, y: y + 8 }))
    hellbound.facing = 'right'
    eng.setCooldown(`atk:${hellbound.id}`, 0)
    expect(eng.attack(hellbound, { e: weak.id })).toBe(true)
    eng.tick()
    expect(eng.cooldown(`skill:raise-dead:${p.id}`) - w.state.tick).toBeLessThanOrEqual(90)
  })

  it('a skill\'s effects are drawn in its colours: the cast\'s ring, the ground opening for the raised, a shockwave, its blows landing', () => {
    const { eng, x, y } = field()
    const w = eng.world
    const drawn = () => w.fx.flatMap((f) => (f.t === 'vfx' ? [f.fx] : []))
    expect(SKILL_BY_ID['raise-dead'].active?.look).toBe('necro')
    expect(SKILL_BY_ID['hell-guard'].active?.look).toBe('hell')
    expect(SKILL_BY_ID.miasma.active?.look).toBe('poison')
    know(eng, 'raise-dead')
    w.fx.length = 0
    expect(cast(eng, 0)).toBe(true)
    expect(drawn().filter((f) => f === 'cast:necro')).toHaveLength(1)
    expect(drawn().filter((f) => f === 'rise:necro')).toHaveLength(2)
    slime(eng, x + 1, y + 1)
    know(eng, 'army-of-the-dead')
    w.fx.length = 0
    expect(cast(eng, 0)).toBe(true)
    expect(drawn()).toEqual(expect.arrayContaining(['cast:necro', 'burst:necro:2', 'impact:necro', 'rise:necro']))
  })

  it('Phantom: a shadow double fights at one\'s side, a dodge fades one into the dark; Ghostwail: a hexed foe felled spreads its hex', () => {
    const { eng, p, x, y } = field()
    const w = eng.world
    know(eng, 'shadow-double')
    expect(cast(eng, 0)).toBe(true)
    const double = w.entitiesOnMap('arena').find((e) => e.type === SUMMONS.phantom)!
    expect([double.props?.companion, eng.hostileTo(double, p)]).toEqual([p.id, false])
    // a dodge that fades one out (dodge at its most, a half: struck until one is dodged)
    know(eng, 'fade')
    const s = slime(eng, x + 1, y)
    eng.author(() => w.setProp(p, 'dodge', 1))
    let dodged = false
    eng.author(() => { for (let i = 0; i < 40 && !dodged; i++) dodged = combatDamage(eng, p, 1, s, false) === 0 })
    expect(dodged).toBe(true)
    expect([(p.combat?.veilUntil ?? 0) > w.state.tick, p.combat?.sureNext]).toEqual([true, true])
    eng.author(() => w.setProp(p, 'dodge', 0))
    // the hex spread off a hexed foe felled
    know(eng, 'hex-plague')
    const weak = slime(eng, x + 6, y + 6, { hp: 1, maxHp: 1 })
    const near = slime(eng, x + 8, y + 6)
    eng.author(() => (eng.applyStatus({ e: weak.id }, 'hexed', 40), eng.teleport(p, { map: 'arena', x: x + 5, y: y + 6 })))
    p.facing = 'right'
    eng.setCooldown('atk:player', 0)
    expect(eng.attack(p, { e: weak.id })).toBe(true)
    eng.tick()
    expect(w.hasStatus({ e: near.id }, 'hexed')).toBe(true)
  })

  it('the Spellblade: a cast readies the katana\'s next blow (harder, carrying its element); an enchantment lays its element on every blow, one at a time; a blow that lands brings the skills nearer', () => {
    const { eng, p, x, y } = field()
    const w = eng.world
    know(eng, 'flame-slash')
    const katana = eng.author(() => w.create('item/weapon/blade/katana', { on: 'hand', holder: p.id }, { props: { power: 4 } }))
    eng.author(() => w.setProp(p, 'critChance', 0))
    const s = slime(eng, x + 1, y)
    const strike = () => combatStrike(w, p, s, 10, 1, katana, true)
    const plain = strike()
    expect(plain.element).toBeUndefined()
    // Blade and Spell: the blow after a Flame Slash is half again as hard and carries its fire, spent once it lands
    know(eng, 'blade-and-spell')
    expect(cast(eng, 0)).toBe(true)
    const charged = strike()
    expect([charged.spellblade, charged.element, charged.power]).toEqual([true, 'fire', plain.power * 1.5])
    eng.setCooldown('atk:player', 0)
    expect(eng.attack(p, { e: s.id })).toBe(true)
    expect(p.combat?.bladeUntil).toBeUndefined()
    // an enchantment: its element on every blow; a second one ends the first
    know(eng, 'frost-enchant')
    expect(cast(eng, 0)).toBe(true)
    delete p.combat!.bladeUntil
    expect(strike().element).toBe('ice')
    know(eng, 'flame-enchant')
    expect(cast(eng, 0)).toBe(true)
    delete p.combat!.bladeUntil
    expect([p.combat?.buffs?.['frost-enchant'], strike().element]).toEqual([undefined, 'fire'])
    // Arcane Edge: what carries an element cuts deeper
    const lit = strike().power
    know(eng, 'arcane-edge')
    expect(strike().power).toBeGreaterThan(lit)
    // a Prism: the three in turn
    know(eng, 'prism-enchant')
    expect(cast(eng, 0)).toBe(true)
    delete p.combat!.bladeUntil
    expect([strike().element, strike().element, strike().element]).toEqual(['fire', 'ice', 'lightning'])
    // a Channeling Blade: a blow that lands brings every skill 0.3 s nearer
    know(eng, 'blade-channel')
    know(eng, 'flame-slash')
    eng.setCooldown(`skill:flame-slash:${p.id}`, 50)
    eng.setCooldown('atk:player', 0)
    expect(eng.attack(p, { e: s.id })).toBe(true)
    expect(castLeft(eng, p, 'flame-slash')).toBe(47)
    // a Ringing Blade: what a cast readies serves two blows; Seamless: twice as hard, and each brings the skills a second nearer
    know(eng, 'ringing-blade')
    know(eng, 'seamless')
    eng.setCooldown(`skill:flame-slash:${p.id}`, 0)
    expect(cast(eng, 0)).toBe(true)
    expect(p.combat?.bladeHits).toBe(2)
    const left = castLeft(eng, p, 'flame-slash')
    eng.setCooldown('atk:player', 0)
    expect(eng.attack(p, { e: s.id })).toBe(true)
    expect([p.combat?.bladeHits, castLeft(eng, p, 'flame-slash')]).toEqual([1, left - 13])
  })

  it('the mage\'s elements: a third\'s heart strikes harder, Static electrifies, Permafrost holds a freeze longer, Still Time shatters harder and hastens, Burnout keeps the fire, Wildfire spreads it, Immolate and the Thunder Shroud answer a blow hand to hand, a critical electrifies (Thunderstrike)', () => {
    const { eng, p, x, y } = field()
    const w = eng.world
    eng.author(() => (w.setProp(p, 'critChance', 0), w.setProp(p, 'atk', 50), w.setProp(p, 'hp', 1000), w.setProp(p, 'maxHp', 1000)))
    const fresh = (e: Entity) => eng.author(() => { w.setProp(e, 'hp', 200); for (const st of Object.keys(e.statuses ?? {})) eng.removeStatus({ e: e.id }, st) })
    const ready = (id: string) => eng.setCooldown(`skill:${id}:${p.id}`, 0)
    // a third's heart: its element's skills a fifth harder
    const a = slime(eng, x + 3, y)
    know(eng, 'lightning-bolt')
    expect(cast(eng, 0)).toBe(true)
    const plain = lost(eng, a)
    fresh(a)
    know(eng, 'heavens-might')
    ready('lightning-bolt')
    expect(cast(eng, 0)).toBe(true)
    expect(lost(eng, a)).toBeGreaterThan(plain)
    // Static: lightning electrifies one time in four (the dice made to fall low)
    fresh(a)
    know(eng, 'static')
    const roll = w.rand
    w.rand = () => 0
    ready('lightning-bolt')
    expect(cast(eng, 0)).toBe(true)
    w.rand = roll
    expect(w.hasStatus({ e: a.id }, 'electrified')).toBe(true)
    // Permafrost: a freeze held half again as long
    fresh(a)
    know(eng, 'glacial-prison')
    expect(cast(eng, 0)).toBe(true)
    const held = a.statuses!.frozen - w.state.tick
    fresh(a)
    know(eng, 'permafrost')
    ready('glacial-prison')
    expect(cast(eng, 0)).toBe(true)
    expect(a.statuses!.frozen - w.state.tick).toBeGreaterThan(held)
    // Shatter on the frozen: double; Still Time: triple, and a shatter brings every skill a second nearer
    const frozen = () => combatStrike(w, p, a, 100, 1, undefined, false).power
    fresh(a)
    const thawed = frozen()
    eng.author(() => eng.applyStatus({ e: a.id }, 'frozen', 50))
    know(eng, 'shatter')
    expect(frozen()).toBeCloseTo(thawed * 2, 5)
    know(eng, 'still-time')
    expect(frozen()).toBeCloseTo(thawed * 3, 5)
    know(eng, 'ice-lance')
    eng.setCooldown(`skill:glacial-prison:${p.id}`, 100)
    expect(cast(eng, 0)).toBe(true)
    expect(castLeft(eng, p, 'glacial-prison')).toBe(90)
    // Burnout: Combustion leaves the fire it bursts burning (on another slime: the shatters felled the first)
    eng.author(() => { if (w.get(a.id)) w.destroy(a) })
    const e = slime(eng, x + 3, y, { hp: 1000, maxHp: 1000 })
    know(eng, 'combustion')
    know(eng, 'burnout')
    eng.author(() => eng.applyStatus({ e: e.id }, 'burning', 50))
    expect(cast(eng, 0)).toBe(true)
    expect([w.num(e, 'hp') < 1000, w.hasStatus({ e: e.id }, 'burning')]).toEqual([true, true])
    // Wildfire: a burning foe felled spreads its fire to those within 2; All Is Kindling: every skill two seconds nearer
    eng.author(() => w.destroy(e))
    const b = slime(eng, x + 3, y, { hp: 1 })
    const c = slime(eng, x + 4, y + 1)
    eng.author(() => eng.applyStatus({ e: b.id }, 'burning', 50))
    know(eng, 'wildfire')
    know(eng, 'all-is-kindling')
    know(eng, 'pyroblast')
    eng.setCooldown(`skill:combustion:${p.id}`, 100)
    expect(cast(eng, 0)).toBe(true)
    expect(w.num(b, 'hp') <= 0 || !w.get(b.id)).toBe(true)
    expect([w.hasStatus({ e: c.id }, 'burning'), castLeft(eng, p, 'combustion')]).toEqual([true, 80])
    // Immolate, a Thunder Shroud: who strikes the caster hand to hand catches fire, is electrified
    eng.author(() => w.destroy(c))
    const d = slime(eng, x + 1, y)
    for (const [buff, status] of [['immolate', 'burning'], ['thunder-shroud', 'electrified']] as const) {
      fresh(d)
      know(eng, buff)
      expect(cast(eng, 0)).toBe(true)
      eng.setCooldown(`atk:${d.id}`, 0)
      expect(eng.attack(d, { e: p.id }), buff).toBe(true)
      for (let i = 0; i < 3; i++) eng.tick()
      expect(w.hasStatus({ e: d.id }, status), buff).toBe(true)
    }
    // Thunderstrike: a critical electrifies the struck
    know(eng, 'thunderstrike')
    ;(p.combat ??= {}).sureNext = true
    const strike = combatStrike(w, p, d, 100, 1, undefined, false)
    expect([strike.critical, strike.afflict?.status]).toEqual([true, 'electrified'])
  })

  it('the Demon Hunter: a sigil hexes the foe that walks in (weaker, softer); the Call of the Hunt and the Vigil are shared with those who follow', () => {
    const { eng, x, y } = field()
    const w = eng.world
    know(eng, 'binding-sigil')
    expect(cast(eng, 0)).toBe(true)
    expect(w.entitiesOnMap('arena').filter((e) => e.type === HAZARDS.sigil)).toHaveLength(9)
    const s = slime(eng, x + 3, y + 2, { atk: 6, def: 4 })
    const [atk, def] = [w.stat(s, 'atk'), w.stat(s, 'def')]
    eng.act('move', s.id, { e: s.id }, { instrument: null, params: { map: 'arena', x: x + 3, y: y + 1 } })
    eng.tick()
    expect(w.hasStatus({ e: s.id }, 'hexed')).toBe(true)
    expect([w.stat(s, 'atk'), w.stat(s, 'def')]).toEqual([atk - 2, def - 3])
    // one who follows the caster, near: struck harder while the call lasts, taking less with the vigil learned
    know(eng, 'raise-dead')
    expect(cast(eng, 0)).toBe(true)
    const ally = w.entitiesOnMap('arena').find((e) => e.type === SUMMONS.skeleton)!
    const plain = combatStrike(w, ally, s, 100, 1, undefined, false).power
    know(eng, 'hunt-call')
    expect(cast(eng, 0)).toBe(true)
    expect(combatStrike(w, ally, s, 100, 1, undefined, false).power).toBeCloseTo(plain * 1.2, 5)
    const taken = combatDamage(eng, ally, 40, s, false)
    know(eng, 'hunters-vigil')
    expect(combatDamage(eng, ally, 40, s, false)).toBeLessThan(taken)
    // far from the caster, nothing shared
    eng.author(() => eng.teleport(ally, { map: 'arena', x: x + 10, y }))
    expect(combatStrike(w, ally, s, 100, 1, undefined, false).power).toBeCloseTo(plain, 5)
  })

  it('a beast called fights for the caster (its companion, of the caster\'s side), and a Sic sends it at the foe ahead', () => {
    const { eng, p, x, y } = field()
    const w = eng.world
    know(eng, 'call-the-hound')
    expect(cast(eng, 0)).toBe(true)
    const hound = w.entitiesOnMap('arena').find((e) => e.type === SUMMONS.hound)!
    expect(hound.props?.companion).toBe(p.id)
    expect(eng.hostileTo(hound, p)).toBe(false)
    const s = slime(eng, x + 3, y)
    expect(eng.hostileTo(hound, s) || eng.hostileTo(s, hound)).toBe(true)
    know(eng, 'sic')
    expect(cast(eng, 0)).toBe(true)
    expect(lost(eng, s)).toBeGreaterThan(0)
    // its while out, it goes
    for (let i = 0; i < 420; i++) eng.tick()
    expect(w.get(hound.id)).toBeUndefined()
  })

  it('a mark makes its foe take more; a ward takes harm first; a lightning cast brings the others nearer (Storm Unending); an element\'s skills rest less (Storm Spirit)', () => {
    const { eng, p, x, y } = field()
    const w = eng.world
    const s = slime(eng, x + 3, y)
    const plain = combatStrike(w, p, s, 100, 1, undefined, false).power
    know(eng, 'death-mark')
    expect(cast(eng, 0)).toBe(true)
    expect(combatStrike(w, p, s, 100, 1, undefined, false).power).toBeCloseTo(plain * 1.3, 5)
    know(eng, 'mana-ward')
    expect(cast(eng, 0)).toBe(true)
    const hp = w.num(p, 'hp')
    expect(combatDamage(eng, p, 2, s, false)).toBe(0)
    expect(w.num(p, 'hp')).toBe(hp)
    know(eng, 'thunderclap')
    know(eng, 'storm-unending')
    know(eng, 'lightning-bolt')
    eng.setCooldown(`skill:thunderclap:${p.id}`, 100)
    expect(cast(eng, 0)).toBe(true)
    expect(eng.cooldown(`skill:thunderclap:${p.id}`) - w.state.tick).toBe(90)
    // an element's skills rest a fifth less: a Storm Spirit's lightning, not another's ice
    know(eng, 'storm-spirit')
    expect(effectiveActive(eng, p, SKILL_BY_ID['thunder-spear']).cooldown).toBe(Math.round(SKILL_BY_ID['thunder-spear'].active!.cooldown * 0.8))
    expect(effectiveActive(eng, p, SKILL_BY_ID.blizzard).cooldown).toBe(SKILL_BY_ID.blizzard.active!.cooldown)
  })

  it('the Hunter: Mark Prey makes the nearest foe prey (slower; the Hunter and the hound strike it harder), a Hunting Net holds the 3×3 round the foe ahead, the Dawn Flight makes prey of all round; Lord of the Hunt passes the mark on and brings the skills nearer', () => {
    const { eng, p, x, y } = field()
    const w = eng.world
    eng.author(() => (w.setProp(p, 'critChance', 0), w.setProp(p, 'atk', 50)))
    const s = slime(eng, x + 3, y)
    const plain = combatStrike(w, p, s, 100, 1, undefined, false).power
    const pace = combatDelay(w, s, 10, 'move')
    know(eng, 'mark-prey')
    expect(cast(eng, 0)).toBe(true)
    expect(w.hasStatus({ e: s.id }, 'hunted')).toBe(true)
    expect(combatDelay(w, s, 10, 'move')).toBeGreaterThan(pace)
    expect(combatStrike(w, p, s, 100, 1, undefined, false).power).toBeCloseTo(plain * 1.2, 5)
    // the hound, a companion within 6 cells: its bites on the prey a fifth harder too
    know(eng, 'call-the-hound')
    expect(cast(eng, 0)).toBe(true)
    const hound = w.entitiesOnMap('arena').find((e) => e.type === SUMMONS.hound)!
    const bite = combatStrike(w, hound, s, 100, 1, undefined, false).power
    eng.author(() => eng.removeStatus({ e: s.id }, 'hunted'))
    expect(bite).toBeCloseTo(combatStrike(w, hound, s, 100, 1, undefined, false).power * 1.2, 5)
    // a Hunting Net: every foe on the 3×3 round the first foe ahead is held
    const t = slime(eng, x + 4, y + 1)
    know(eng, 'hunting-net')
    expect(cast(eng, 0)).toBe(true)
    eng.tick()
    expect([w.hasStatus({ e: s.id }, 'webbed'), w.hasStatus({ e: t.id }, 'webbed')]).toEqual([true, true])
    // the Dawn Flight: every foe within 4 made prey
    const u = slime(eng, x - 2, y + 2)
    know(eng, 'dawn-flight')
    expect(cast(eng, 0)).toBe(true)
    expect([s, t, u].map((e) => w.hasStatus({ e: e.id }, 'hunted'))).toEqual([true, true, true])
    // Lord of the Hunt: the prey felled, the mark goes to the nearest foe within 4, and every skill comes two seconds nearer
    eng.author(() => { for (const e of [s, t, u, hound]) if (w.get(e.id)) w.destroy(e) })
    const prey = slime(eng, x + 1, y, { hp: 1 })
    const next = slime(eng, x + 2, y + 2)
    eng.author(() => eng.applyStatus({ e: prey.id }, 'hunted', 100))
    know(eng, 'lord-of-the-hunt')
    eng.setCooldown(`skill:mark-prey:${p.id}`, 100)
    expect(eng.attack(p, { e: prey.id })).toBe(true)
    expect(w.num(prey, 'hp') <= 0 || !w.get(prey.id)).toBe(true)
    expect([w.hasStatus({ e: next.id }, 'hunted'), castLeft(eng, p, 'mark-prey')]).toEqual([true, 80])
  })

  it('the Sniper: Long Shot reaches farther, harder the farther it flies; Hawkeye: Hawk\'s Sight shoots to the map\'s edge, slower and twice as hard, Unblinking makes every arrow from six cells sure, Sunpiercer goes through the whole line', () => {
    const { eng, p, x, y } = field()
    const w = eng.world
    eng.author(() => (w.setProp(p, 'critChance', 0), w.setProp(p, 'atk', 5)))
    const bow = eng.author(() => w.create('item/weapon/ranged/bow', { on: 'hand', holder: p.id }, { props: { power: 3, range: 6 } }))
    know(eng, 'ranger-archery')
    const reach = () => eng.reachOf('use', p, undefined, bow)!
    const near = slime(eng, x + 2, y)
    const far = slime(eng, x + 8, y)
    const from = (v: Entity) => combatStrike(w, p, v, 100, 9, bow, false).power
    expect(reach()).toBe(7)
    know(eng, 'long-shot')
    expect(reach()).toBe(9)
    expect(from(far)).toBeCloseTo(from(near) * 1.3, 5)
    // Hawk's Sight: as far as the map goes; every arrow twice as hard, drawn 40% slower
    const plain = from(near)
    const draw = combatDelay(w, p, 10, 'attack')
    know(eng, 'hawks-sight')
    expect(reach()).toBeGreaterThan(100)
    expect(from(near)).toBeCloseTo(plain * 2, 5)
    expect(combatDelay(w, p, 10, 'attack')).toBeGreaterThan(draw * 1.5)
    p.facing = 'down'
    const distant = slime(eng, x, y + 14)
    eng.setCooldown(`atk:${p.id}`, 0)
    expect(eng.attack(p)).toBe(true)
    expect(lost(eng, distant)).toBeGreaterThan(0)
    // Unblinking: from six cells or farther, every arrow sure; nearer, as the dice fall
    know(eng, 'unblinking')
    expect([combatStrike(w, p, distant, 100, 200, bow, false).critical, combatStrike(w, p, near, 100, 200, bow, false).critical]).toEqual([true, false])
    // Sunpiercer: through every foe down the line, to the map's edge
    const mid = slime(eng, x, y + 5)
    const before = lost(eng, distant)
    know(eng, 'sunpiercer')
    expect(cast(eng, 0)).toBe(true)
    expect([lost(eng, mid) > 0, lost(eng, distant) > before]).toEqual([true, true])
  })

  it('the Skirmisher: Flit slips through foes, Arrow Flurry looses four arrows, Running Fight pays on the move; Skywing: Ride the Wind brings the skills nearer with every arrow, a dodge readies Sky Walker\'s sure blow, Ten Thousand Feathers falls round one and lends one its feet', () => {
    const { eng, p, x, y } = field()
    const w = eng.world
    eng.author(() => (w.setProp(p, 'critChance', 0), w.setProp(p, 'atk', 5)))
    const bow = eng.author(() => w.create('item/weapon/ranged/bow', { on: 'hand', holder: p.id }, { props: { power: 3, range: 6 } }))
    know(eng, 'ranger-archery')
    const a = slime(eng, x + 1, y)
    know(eng, 'flit')
    expect(cast(eng, 0)).toBe(true)
    expect(w.posOf(p)!.x).toBe(x + 4)
    const b = slime(eng, x + 7, y, { def: 0 })
    know(eng, 'arrow-flurry')
    expect(cast(eng, 0)).toBe(true)
    expect(lost(eng, b)).toBeGreaterThanOrEqual(4)
    // Running Fight: on the move, a blow harder
    const roll = w.rand
    w.rand = () => 0.99
    know(eng, 'running-fight')
    for (let i = 0; i < 12; i++) eng.tick()
    const still = combatStrike(w, p, b, 100, 6, bow, false).power
    eng.act('move', p.id, { e: p.id }, { instrument: null, params: { dir: 'down' } })
    expect(combatStrike(w, p, b, 100, 6, bow, false).power).toBeCloseTo(still * 1.15, 5)
    w.rand = roll
    // Ride the Wind: an arrow that lands brings every skill a third of a second nearer
    eng.author(() => { for (const e of [a, b]) if (w.get(e.id)) w.destroy(e) })
    const now = w.posOf(p)!
    const c = slime(eng, now.x + 3, now.y)
    p.facing = 'right'
    know(eng, 'ride-the-wind')
    eng.setCooldown(`skill:flit:${p.id}`, 100)
    eng.setCooldown(`atk:${p.id}`, 0)
    expect(eng.attack(p)).toBe(true)
    expect(lost(eng, c)).toBeGreaterThan(0)
    expect(castLeft(eng, p, 'flit')).toBe(97)
    // Sky Walker: a blow dodged, every skill a second nearer and the next blow sure
    know(eng, 'sky-walker')
    eng.author(() => w.setProp(p, 'dodge', 0.5))
    w.rand = () => 0
    expect(eng.combat.damage(p, 10, c, false)).toBe(0)
    w.rand = roll
    expect([castLeft(eng, p, 'flit'), p.combat?.sureNext]).toEqual([87, true])
    // Ten Thousand Feathers: arrows fall round one, and one's feet are quicker while they do
    const pace = combatDelay(w, p, 10, 'move')
    const d = slime(eng, now.x - 1, now.y + 1)
    know(eng, 'falling-feathers')
    expect(cast(eng, 0)).toBe(true)
    eng.tick()
    expect(lost(eng, d)).toBeGreaterThan(0)
    expect(combatDelay(w, p, 10, 'move')).toBeLessThan(pace)
  })

  it('the Paladin mends those who follow too: a Healing Light all within 6, the Oath stronger, a rosary\'s litany a fifth more with the cross; a Renew shared mends them each second; the Evangelist\'s faithful stronger by the Apostles, and a foe they fell mends the Paladin (Crown of Glory)', () => {
    const { eng, p, x, y } = field()
    const w = eng.world
    const beast = (bx: number, by: number) => eng.author(() => w.create(SUMMONS.hound, { on: 'tile', map: 'arena', x: bx, y: by }, { props: { summoner: p.id, companion: p.id, hp: 30, maxHp: 30 } }))
    const near = beast(x, y + 1)
    const far = beast(x + 10, y)
    const hurtAll = () => eng.author(() => { for (const e of [p, near, far]) w.setProp(e, 'hp', 1) })
    const ready = (id: string) => eng.setCooldown(`skill:${id}:${p.id}`, 0)
    know(eng, 'healing-light')
    hurtAll()
    expect(cast(eng, 0)).toBe(true)
    eng.tick()
    expect([w.num(near, 'hp'), w.num(far, 'hp'), w.num(p, 'hp') > 1]).toEqual([1 + Math.ceil(30 * 0.3), 1, true])
    // the Oath of Light: a quarter more; the rosary worn and the cross held, a fifth more again
    know(eng, 'oath-of-light')
    hurtAll()
    ready('healing-light')
    expect(cast(eng, 0)).toBe(true)
    eng.tick()
    expect(w.num(near, 'hp')).toBe(1 + Math.ceil(30 * 0.3 * 1.25))
    eng.author(() => {
      w.create('item/weapon/blunt/cross', { on: 'hand', holder: p.id }, { props: { power: 4 } })
      w.setProp(p, OFFHAND, w.create('item/armor/rosary', { on: 'inside', holder: p.id }, { props: { slot: 'arm', offhand: 'litany' } }).id)
    })
    hurtAll()
    ready('healing-light')
    expect(cast(eng, 0)).toBe(true)
    eng.tick()
    expect(w.num(near, 'hp')).toBe(1 + Math.ceil(30 * 0.3 * 1.25 * 1.2))
    // a Renew: those within 6 mend 2 a second while it lasts
    know(eng, 'renew')
    expect(cast(eng, 0)).toBe(true)
    eng.author(() => w.setProp(near, 'hp', 1))
    for (let i = 0; i < 25; i++) eng.tick()
    expect(w.num(near, 'hp')).toBeGreaterThanOrEqual(5)
    // the faithful: two of them, half again as hale by the Apostles
    eng.author(() => { for (const e of [near, far]) w.destroy(e) })
    know(eng, 'call-the-faithful')
    expect(cast(eng, 0)).toBe(true)
    const faithful = () => w.entitiesOnMap('arena').filter((e) => e.type === SUMMONS.disciple && e.props?.companion === p.id)
    const plain = w.num(faithful()[0], 'maxHp')
    expect(faithful()).toHaveLength(2)
    know(eng, 'apostles')
    ready('call-the-faithful')
    expect(cast(eng, 0)).toBe(true)
    expect(Math.max(...faithful().map((e) => w.num(e, 'maxHp')))).toBe(Math.round(plain * 1.5))
    // Crown of Glory: a foe felled by one of them mends the Paladin and brings the skills a second nearer
    eng.author(() => { for (const e of faithful().slice(1)) w.destroy(e) })
    const one = faithful()[0]
    eng.author(() => { eng.teleport(one, { map: 'arena', x: x - 3, y: y + 3 }); w.setProp(p, 'hp', 10) })
    const prey = slime(eng, x - 2, y + 3, { hp: 1 })
    one.facing = 'right'
    know(eng, 'crown-of-glory')
    eng.setCooldown(`skill:call-the-faithful:${p.id}`, 100)
    eng.setCooldown(`atk:${one.id}`, 0)
    expect(eng.attack(one, { e: prey.id })).toBe(true)
    eng.tick()
    expect([w.num(prey, 'hp') <= 0 || !w.get(prey.id), w.num(p, 'hp') >= 13, castLeft(eng, p, 'call-the-faithful') <= 90]).toEqual([true, true, true])
  })

  it('the Avenger: Vengeance on the one who struck last; the Five Sufferings in turn on one foe — the crown, the scourge, hunger, the nails, the lance — Atonement at the lance; An Eye for an Eye strikes back', () => {
    const { eng, p, x, y } = field()
    const w = eng.world
    eng.author(() => (w.setProp(p, 'critChance', 0), w.setProp(p, 'atk', 5), w.setProp(p, 'hp', 1000), w.setProp(p, 'maxHp', 1000)))
    eng.author(() => w.create('item/weapon/blunt/cross', { on: 'hand', holder: p.id }, { props: { power: 4 } }))
    const s = slime(eng, x + 1, y, { hp: 5000, maxHp: 5000 })
    know(eng, 'vengeance')
    const plain = combatStrike(w, p, s, 100, 1, undefined, false).power
    eng.combat.damage(p, 5, s, false)
    expect(combatStrike(w, p, s, 100, 1, undefined, false).power).toBeCloseTo(plain * 1.3, 5)
    for (let i = 0; i < 31; i++) eng.tick()
    expect(combatStrike(w, p, s, 100, 1, undefined, false).power).toBeCloseTo(plain, 5)
    // the Five, blow by blow on the same foe, and the crown again after the lance
    know(eng, 'smite')
    know(eng, 'five-sufferings')
    know(eng, 'atonement')
    const roll = w.rand
    w.rand = () => 0.99
    const hit = () => (eng.setCooldown(`atk:${p.id}`, 0), expect(eng.attack(p, { e: s.id })).toBe(true))
    const has = (st: string) => w.hasStatus({ e: s.id }, st)
    hit()
    expect(has('knelt')).toBe(true)
    hit()
    expect(has('bleeding')).toBe(true)
    hit()
    expect(has('mired')).toBe(true)
    hit()
    expect(has('webbed')).toBe(true)
    eng.author(() => { w.setProp(p, 'hp', 500); for (const st of ['knelt', 'bleeding', 'mired', 'webbed']) eng.removeStatus({ e: s.id }, st) })
    eng.setCooldown(`skill:smite:${p.id}`, 100)
    hit()
    eng.tick()
    // the lance: Atonement mends a tenth and brings every skill two seconds nearer
    expect([w.num(p, 'hp') >= 600, castLeft(eng, p, 'smite') <= 80]).toEqual([true, true])
    hit()
    expect(has('knelt')).toBe(true)
    // An Eye for an Eye: one struck hand to hand strikes back (the dice made to fall low)
    know(eng, 'eye-for-an-eye')
    eng.author(() => { w.setProp(p, 'atk', 50); for (const st of Object.keys(s.statuses ?? {})) eng.removeStatus({ e: s.id }, st) })
    w.rand = () => 0
    const before = w.num(s, 'hp')
    s.facing = 'left'
    eng.setCooldown(`atk:${s.id}`, 0)
    expect(eng.attack(s, { e: p.id })).toBe(true)
    for (let i = 0; i < 3; i++) eng.tick()
    w.rand = roll
    expect(w.num(s, 'hp')).toBeLessThan(before)
  })

  it('the Inquisitor: a brand makes a heretic softer and judged harder; Doom falls after its while, twice as hard on the branded; the Day of Wrath slays a branded foe near its end, a boss struck half again', () => {
    const { eng, p, x, y } = field()
    const w = eng.world
    eng.author(() => (w.setProp(p, 'critChance', 0), w.setProp(p, 'atk', 20)))
    const roll = w.rand
    w.rand = () => 0.99
    const s = slime(eng, x + 3, y, { hp: 5000, maxHp: 5000 })
    const plain = combatStrike(w, p, s, 100, 1, undefined, false).power
    const def = w.stat(s, 'def')
    know(eng, 'brand-heretic')
    expect(cast(eng, 0)).toBe(true)
    expect([w.hasStatus({ e: s.id }, 'branded'), w.stat(s, 'def')]).toEqual([true, def - 3])
    expect(combatStrike(w, p, s, 100, 1, undefined, false).power).toBeCloseTo(plain * 1.3, 5)
    // Doom: nothing at once; in five seconds a blow, twice as hard on one still branded
    eng.author(() => w.destroy(s))
    const a = slime(eng, x + 2, y, { hp: 5000, maxHp: 5000 })
    know(eng, 'doom')
    expect(cast(eng, 0)).toBe(true)
    expect(w.num(a, 'hp')).toBe(5000)
    for (let i = 0; i < 55; i++) eng.tick()
    const once = 5000 - w.num(a, 'hp')
    expect(once).toBeGreaterThan(0)
    eng.author(() => { w.setProp(a, 'hp', 5000); eng.applyStatus({ e: a.id }, 'branded', 200) })
    eng.setCooldown(`skill:doom:${p.id}`, 0)
    expect(cast(eng, 0)).toBe(true)
    for (let i = 0; i < 55; i++) eng.tick()
    expect(5000 - w.num(a, 'hp')).toBeGreaterThanOrEqual(once * 2)
    // the Day of Wrath: branded and below a fifth of its health, slain by the blow; a boss struck half again
    know(eng, 'dies-irae')
    eng.author(() => w.setProp(a, 'hp', 900))
    expect(combatStrike(w, p, a, 10, 1, undefined, false).power).toBeGreaterThanOrEqual(1800)
    eng.author(() => (w.setProp(a, 'hp', 5000), w.addTag(a, 'boss')))
    const boss = combatStrike(w, p, a, 10, 1, undefined, false).power
    eng.author(() => eng.removeStatus({ e: a.id }, 'branded'))
    expect(boss).toBeCloseTo(combatStrike(w, p, a, 10, 1, undefined, false).power * 1.5, 5)
    w.rand = roll
  })
})
