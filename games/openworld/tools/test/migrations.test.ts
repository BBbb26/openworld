// Older saves brought up to the world as it is now (content migrate*.ts, game.ts upgradeSave; the client's upgrade
// hooks, games/openworld/client/src/game.ts): what a save already holds is the save's, so what the maps or the content
// changed since must be brought to it by hand — the Held Ground's plots and Firstlight's loom, the merchants' goods, the
// forged sets' pieces, the professions' skills that went.

import { describe, expect, it } from 'vitest'
import { Game, MAINHAND, OFFHAND, RuleLibrary, type Entity } from '@openworld/engine'
import { socialOf } from '@openworld/modules'
import { BASE_RULES, GAME, PLOTS_LAYOUT, PROFESSIONS_LAYOUT, RANGER_LAYOUT, SET_DEFS, STOCK_LAYOUT, STORY_RULES, buildOntology, decodeChunk, migratePlots, migrateProfessions, migrateStock } from '@openworld-game/content'
import { buildFord } from '../src/demo/world.ts'

const onto = buildOntology()
const lib = () => new RuleLibrary([...BASE_RULES, ...STORY_RULES])

function game() {
  const { index, chunks } = buildFord()
  const g = Game.create(index, onto, lib())
  for (const c of chunks) g.loadChunk(decodeChunk(c))
  g.mods.provider = { resolve: () => new Promise<null>(() => {}) }
  const chunk = (id: string) => decodeChunk(chunks.find((c) => c.map.id === id)!)
  return { g, index, chunks, chunk, eng: g.engine, w: g.engine.world }
}

describe('the Held Ground\'s plots and Firstlight\'s loom in an older save', () => {
  it('a save that had been to both before they were staked out (fb7bb3a) gets every plot and the loom where the maps have them, the waypoint statue moved aside for it; a building already paid for rises on its plot', () => {
    const { g, chunk, eng, w } = game()
    const plots = structuredClone(Object.values(w.state.entities).filter((e) => e.type.startsWith('fixture/build/plot/')))
    expect(plots.map((e) => e.id).sort()).toEqual(['apothecary', 'arcane', 'kitchen', 'lodge1', 'lodge2', 'lodge3', 'loom', 'storehouse', 'workshop'].map((id) => `haven.plot.${id}`))
    const statue = (w.get('wp.village')!.place as { x: number; y: number })
    const loom = (w.get('village.loom')!.place as { x: number; y: number })
    // as such a save has them: no plots, no loom, the statue where the loom stands now; the workshop's materials
    // already handed over (the steward's build set its fact, but there was no plot to rise on)
    eng.author(() => {
      for (const e of [...plots.map((x) => w.get(x.id)!), w.get('village.loom')!]) w.destroy(e)
      w.place(w.get('wp.village')!, { on: 'tile', map: 'meadow', x: loom.x, y: loom.y })
      w.setFact('haven.build.workshop', 1)
    })
    expect(w.state.loadedMaps).toEqual(expect.arrayContaining(['haven', 'meadow']))
    eng.author(() => migratePlots(g, [chunk('haven'), chunk('meadow')]))
    expect(w.fact(PLOTS_LAYOUT)).toBe(true)
    for (const p of plots) expect([p.id, w.get(p.id)?.type, w.get(p.id)?.place]).toEqual([p.id, p.type, p.place])
    expect(w.get('village.loom')).toMatchObject({ type: 'fixture/craft/loom', place: { map: 'meadow', x: loom.x, y: loom.y } })
    expect(w.get('wp.village')!.place).toMatchObject({ map: 'meadow', x: statue.x, y: statue.y })
    // the plot paid for becomes its building at its next look
    eng.author(() => eng.teleport(w.player, { map: 'haven', x: 24, y: 22 }))
    for (let i = 0; i < 60 && w.get('haven.plot.workshop')!.type !== 'fixture/craft/workbench'; i++) eng.tick()
    expect(w.get('haven.plot.workshop')!.type).toBe('fixture/craft/workbench')
    expect(w.get('haven.plot.kitchen')!.type).toBe('fixture/build/plot/kitchen')
  })

  it('a map the save has not been to is left to come as it is built; a save marked as the world is now is left alone', () => {
    const { g, chunk, eng, w } = game()
    eng.author(() => {
      w.destroy(w.get('haven.plot.loom')!)
      w.destroy(w.get('village.loom')!)
      w.state.loadedMaps = w.state.loadedMaps.filter((m) => m !== 'meadow')
    })
    eng.author(() => migratePlots(g, [chunk('haven'), chunk('meadow')]))
    expect([!!w.get('haven.plot.loom'), !!w.get('village.loom')]).toEqual([true, false])
    eng.author(() => w.destroy(w.get('haven.plot.loom')!))
    eng.author(() => migratePlots(g, [chunk('haven')]))
    expect(w.get('haven.plot.loom')).toBeUndefined()
  })
})

describe('the merchants of an older save', () => {
  it('one who traded before keeps what it sold and sells what it sells now (every kind, at least as many); its next restock brings them', () => {
    const { g, index, eng, w } = game()
    const marta = w.get('npc.marta')!
    const tobin = w.get('npc.tobin')!
    const now = { marta: w.prop(marta, 'stock'), tobin: w.prop(tobin, 'stock') }
    // as their records were kept before every person traded (fb7bb3a): Marta's bread, Tobin's four things (one firework),
    // and something a save may hold that the world never gave (kept)
    eng.author(() => {
      w.setProp(marta, 'stock', 'item/food/bread*6')
      w.setProp(tobin, 'stock', 'item/vessel/flask/oil*2|item/clothing/hood*1|item/tool/lockpick*2|item/misc/firework*1|item/misc/dice*1')
      for (const id of [...(marta.contents ?? [])]) if (w.get(id)?.type === 'item/food/pie') w.destroy(w.get(id)!)
    })
    eng.author(() => migrateStock(g, index))
    expect(w.fact(STOCK_LAYOUT)).toBe(true)
    expect(w.prop(marta, 'stock')).toBe(now.marta)
    const tobins = new Map(String(w.prop(tobin, 'stock')).split('|').map((p) => p.split('*') as [string, string]))
    for (const part of String(now.tobin).split('|')) {
      const [type, n] = part.split('*')
      expect([type, tobins.get(type)]).toEqual([type, n])
    }
    expect(tobins.get('item/misc/dice')).toBe('1')
    // the next morning's restock (or asked to trade) fills to the list: pies again
    const s = socialOf(eng)
    expect(s.stock(marta).some((e) => e.type === 'item/food/pie')).toBe(false)
    const at = w.posOf(marta)!
    eng.author(() => (w.setProp(marta, 'restocked', -1), eng.travel(w.player, { map: at.map, x: at.x, y: at.y + 1 })))
    eng.controls.talk(marta.id, 'trade')
    expect(s.stock(marta).filter((e) => e.type === 'item/food/pie').length).toBe(2)
  })
})

describe('the forged sets\' pieces of an older save', () => {
  it('each piece takes its slot\'s set (the armour, the trinkets, none for the weapon and the off hand): a helmet with jewels, a blade and a parrier is not the armour\'s six', () => {
    const { g, index, chunks, eng, w } = game()
    const p = w.player
    const set = SET_DEFS.find((s) => s.id === 'shadowfang')!
    const worn = ['head', 'neck', 'ear', 'ring', 'weapon', 'arm']
    // as they were forged before a profession's gear was two sets (134c875): every piece its profession's one set
    const pieces: Entity[] = eng.author(() => {
      w.setProp(p, 'profession', 'assassin')
      return worn.map((slot) => {
        const piece = set.pieces.find((x) => x.slot === slot)!
        const e = w.create(piece.type, { on: 'inside', holder: p.id }, { props: { set: set.id, ...(piece.props ?? {}) } })
        w.setProp(p, `wear:${slot}`, e.id)
        return e
      })
    })
    expect(w.worn(p).length).toBe(6)
    // the armour's six pieces' bonus (each hit draws a health) from one helmet and five that are not armour
    expect(w.stat(p, 'lifesteal')).toBe(1)
    const loaded = Game.load(structuredClone(g.save()), index, onto, lib(), GAME.upgradeSave)
    for (const c of chunks) loaded.loadChunk(decodeChunk(c))
    const lw = loaded.engine.world
    expect(pieces.map((e) => lw.get(e.id)!.props?.set)).toEqual(['shadowfang', 'shadowfang_trinkets', 'shadowfang_trinkets', 'shadowfang_trinkets', undefined, undefined])
    expect(lw.stat(lw.player, 'lifesteal')).toBe(0)
    // the trinkets, three of three, give theirs
    const t3 = set.trinkets.find((b) => b.pieces === 3)!
    expect(lw.stat(lw.player, 'holdFast')).toBeCloseTo(t3.props.holdFast ?? 0, 5)
  })
})

describe('the warrior gone and the mage\'s paths remade, in an older save (2026-11-05)', () => {
  it('a warrior\'s skills come back as points, their grants undone; it has no profession, to choose again; the bar lets go of what went; the Oathbrand is a sword like any other', () => {
    const { g, eng, w } = game()
    const p = w.player
    const [maxHp, atk] = [w.num(p, 'maxHp'), w.num(p, 'atk')]
    const sword = eng.author(() => {
      w.setProp(p, 'profession', 'warrior')
      w.setProp(p, 'path', 'berserker')
      w.setProp(p, 'advancement', 3)
      w.setProp(p, 'skillPoints', 1)
      // as such a save has them: the tags, and what Unbreakable, Iron Body and Weapon Master granted
      for (const id of ['vitality', 'warrior-arms', 'unbreakable', 'warlord', 'blood-rage', 'iron-body', 'weapon-master']) w.addTag(p, `skill:${id}`)
      w.setProp(p, 'maxHp', maxHp + 30)
      w.setProp(p, 'atk', atk + 3)
      p.skillbar = ['blood-rage', null, 'whirlwind']
      const it = w.create('item/weapon/blade/sword/oathbrand', { on: 'inside', holder: p.id }, { props: { relic: 'oathbrand', power: 9 } })
      w.setProp(p, MAINHAND, it.id)
      return it
    })
    eng.author(() => migrateProfessions(g))
    expect(w.fact(PROFESSIONS_LAYOUT)).toBe(true)
    // six skills gone, Warlord two points: seven back; Vitality (everyone's) kept
    expect([w.prop(p, 'profession'), w.prop(p, 'path'), w.num(p, 'skillPoints')]).toEqual([undefined, undefined, 8])
    expect([w.num(p, 'maxHp'), w.num(p, 'atk')]).toEqual([maxHp, atk])
    expect((p.tags ?? []).filter((t) => t.startsWith('skill:'))).toEqual(['skill:vitality'])
    expect(p.skillbar).toEqual([null, null, 'whirlwind'])
    expect([w.get(sword.id)?.type, w.prop(sword, 'relic'), w.num(sword, 'power'), w.prop(p, MAINHAND)]).toEqual(['item/weapon/blade/sword', undefined, 9, sword.id])
  })

  it('a Dawnbringer keeps the mage and chooses a path again; the shared mastery\'s skills come back as points; a shield (the Unfallen Wall too) is taken apart; the mage\'s tome is handed over', () => {
    const { g, eng, w } = game()
    const p = w.player
    const count = (type: string) => (p.contents ?? []).filter((id) => w.get(id)?.type === type).length
    const [wall, steel] = eng.author(() => {
      w.setProp(p, 'profession', 'mage')
      w.setProp(p, 'kit.mage', true)
      w.setProp(p, 'path', 'dawnbringer')
      w.setProp(p, 'advancement', 3)
      w.setProp(p, 'skillPoints', 0)
      for (const id of ['fireball', 'dawnlight', 'daybreak', 'arcane-mastery', 'mana-flow']) w.addTag(p, `skill:${id}`)
      w.setProp(p, 'cdr', 0.1)
      const it = w.create('item/armor/shield/unfallen', { on: 'inside', holder: p.id }, { props: { relic: 'unfallen', block: 0.15, slot: 'arm' } })
      w.setProp(p, OFFHAND, it.id)
      return [it, w.create('item/armor/shield', { on: 'inside', holder: p.id }, { tags: ['material:steel'], props: { slot: 'arm' } })]
    })
    const [planks, bars] = [count('item/material/plank'), count('item/material/steel_bar')]
    eng.author(() => migrateProfessions(g))
    expect([w.prop(p, 'profession'), w.prop(p, 'path'), w.num(p, 'advancement'), w.num(p, 'skillPoints'), w.num(p, 'cdr')]).toEqual(['mage', undefined, 3, 5, 0])
    expect((p.tags ?? []).filter((t) => t.startsWith('skill:'))).toEqual(['skill:fireball'])
    // the two shields gone: two planks each, two bars of the steel one's metal
    expect([w.get(wall.id), w.get(steel.id), count('item/material/plank') - planks, count('item/material/steel_bar') - bars]).toEqual([undefined, undefined, 4, 2])
    // the off hand freed, the mage's tome in it
    expect(w.get(w.prop(p, OFFHAND) as string)?.type).toBe('item/armor/tome')
    // (once is enough: a save marked as the world is now is left alone)
    eng.author(() => (w.setProp(p, 'path', 'dawnbringer'), migrateProfessions(g)))
    expect(w.prop(p, 'path')).toBe('dawnbringer')
  })
})

describe('the ranger\'s paths remade, in an older save (2026-11-12)', () => {
  it('a Trapper or a Beastmaster is a Hunter, a Sharpshooter the Sniper; every point of the old paths and the Master Archer comes back, the first tree kept; the bar lets go of them', () => {
    const { g, eng, w } = game()
    const p = w.player
    eng.author(() => {
      w.setProp(p, 'profession', 'ranger')
      w.setProp(p, 'path', 'beastmaster')
      w.setProp(p, 'advancement', 3)
      w.setProp(p, 'skillPoints', 1)
      // a Beastmaster's skills, its ultimate (two points), and the Master Archer's (Thousand Arrows two more)
      for (const id of ['ranger-archery', 'multishot', 'pack-bond', 'call-the-hound', 'the-pack', 'hawks-patience', 'thousand-arrows']) w.addTag(p, `skill:${id}`)
      p.skillbar = ['multishot', 'call-the-hound', 'thousand-arrows']
      // (as if the change before had been made already: only the ranger's is new)
      w.setFact(PROFESSIONS_LAYOUT, true)
    })
    eng.author(() => migrateProfessions(g))
    expect(w.fact(RANGER_LAYOUT)).toBe(true)
    expect([w.prop(p, 'profession'), w.prop(p, 'path'), w.num(p, 'advancement'), w.num(p, 'skillPoints')]).toEqual(['ranger', 'hunter', 3, 8])
    expect((p.tags ?? []).filter((t) => t.startsWith('skill:'))).toEqual(['skill:ranger-archery', 'skill:multishot'])
    expect(p.skillbar).toEqual(['multishot', null, null])
    // a Sharpshooter keeps its path, now the Sniper's, and is given back its points the same
    eng.author(() => {
      w.setFact(RANGER_LAYOUT, false)
      w.setProp(p, 'path', 'sharpshooter')
      w.setProp(p, 'skillPoints', 0)
      for (const id of ['eagle-eye', 'deadeye', 'heartseeker']) w.addTag(p, `skill:${id}`)
      migrateProfessions(g)
    })
    expect([w.prop(p, 'path'), w.num(p, 'skillPoints'), w.hasTag(p, 'skill:deadeye')]).toEqual(['sharpshooter', 4, false])
  })
})

