// The Held Ground's water and processing (docs/logs/0005, 0006): a bucket's draughts by its quality, the rain barrel,
// the sprinkler, the millstone and bread, the cask, the orchard and the sheep — each played through its rules in a sandbox.

import { describe, expect, it } from 'vitest'
import { OntologyIndex, RuleLibrary, SANDBOX_MAP, TICKS_PER_DAY, buildSandbox, madeOf, type Engine, type ScenarioEntity } from '@openworld/engine'
import { BASE_RULES, BREWS_FOR, RECIPE_BY_ID, TREE_GROWS, buildOntology, priceOf } from '../src/index.ts'

const onto = buildOntology()
const index = new OntologyIndex(onto)

/** A 5×5 patch of `ground` (water at the top-left corner), the player at `at` (else (2,2)) facing up, these things placed. */
function patch(entities: ScenarioEntity[] = [], ground = 'grass', at: [number, number] = [2, 2]): Engine {
  const terrain = Array.from({ length: 5 }, (_, y) => Array.from({ length: 5 }, (_, x) => (x === 0 && y === 0 ? 'water' : ground)))
  const eng = buildSandbox({ terrain, entities: [{ key: 'actor', type: 'actor/person/player', x: at[0], y: at[1] }, ...entities], event: {} }, onto, new RuleLibrary(BASE_RULES))
  eng.world.get('actor')!.facing = 'up'
  eng.controls.sync()
  return eng
}
const get = (eng: Engine, key: string) => eng.world.get(key)!
const period = (eng: Engine, key: string, name: string) => eng.queue({ kind: 'time/period', host: { e: key }, roles: {}, params: { name }, origin: 'world' })
const lying = (eng: Engine, type: string) => Object.values(eng.world.state.entities).filter((e) => e.type === type).length

describe('a bucket holds as many draughts as it is well made', () => {
  it('a master\'s bucket is made to hold fifteen, a crude one eight; a common one keeps its kind\'s ten and nothing of its own', () => {
    const made = (q: string) => madeOf(onto, index, 'item/vessel/bucket/empty', undefined, q).props?.draughts
    expect(made('masterwork')).toBe(15)
    expect(made('crude')).toBe(8)
    expect(made('common')).toBeUndefined()
  })

  it('filled, a master\'s bucket holds fifteen; part spent, topped up, fifteen again', () => {
    // (the player at (1,1): beside the water at (0,0), and the grass at (2,1) to splash)
    const eng = patch([{ key: 'pail', type: 'item/vessel/bucket/empty', x: 1, y: 1, heldBy: 'actor' }], 'grass', [1, 1])
    const w = eng.world
    eng.author(() => Object.assign(get(eng, 'pail'), madeOf(onto, index, 'item/vessel/bucket/empty', undefined, 'masterwork'), { type: 'item/vessel/bucket/empty' }))
    eng.act('use', 'actor', w.cellRef(SANDBOX_MAP, 0, 0))
    expect(get(eng, 'pail').type).toBe('item/vessel/bucket/water')
    expect(w.num(get(eng, 'pail'), 'fill')).toBe(15)
    eng.act('use', 'actor', w.cellRef(SANDBOX_MAP, 2, 1))
    expect(w.num(get(eng, 'pail'), 'fill')).toBe(14)
    eng.act('use', 'actor', w.cellRef(SANDBOX_MAP, 0, 0))
    expect(w.num(get(eng, 'pail'), 'fill')).toBe(15)
  })
})

describe('the rain barrel', () => {
  const barrel = (stored = 0): ScenarioEntity => ({ key: 'barrel', type: 'fixture/farm/rain_barrel', x: 2, y: 1, props: { stored } })

  it('catches a bucketful in each hour of rain, up to three; nothing in the dry', () => {
    const eng = patch([barrel()])
    period(eng, 'barrel', 'rain')
    expect(eng.world.num(get(eng, 'barrel'), 'stored')).toBe(0)
    eng.world.weather = [{ day: eng.world.calendar().day, weather: 'rain' }]
    for (let i = 0; i < 5; i++) period(eng, 'barrel', 'rain')
    expect(eng.world.num(get(eng, 'barrel'), 'stored')).toBe(3)
  })

  it('fills an empty bucket and has a bucketful less; dry, it gives nothing', () => {
    const eng = patch([barrel(1), { key: 'pail', type: 'item/vessel/bucket/empty', x: 2, y: 2, heldBy: 'actor' }])
    eng.act('use', 'actor', { e: 'barrel' })
    expect(get(eng, 'pail').type).toBe('item/vessel/bucket/water')
    expect(eng.world.num(get(eng, 'barrel'), 'stored')).toBe(0)
    const dry = patch([barrel(0), { key: 'pail', type: 'item/vessel/bucket/empty', x: 2, y: 2, heldBy: 'actor' }])
    dry.act('use', 'actor', { e: 'barrel' })
    expect(get(dry, 'pail').type).toBe('item/vessel/bucket/empty')
  })
})

describe('the sprinkler', () => {
  it('takes a bucket poured into it, and each morning waters the growing crops two steps round it and spends a day', () => {
    const eng = patch([
      { key: 'sprinkler', type: 'fixture/farm/sprinkler', x: 2, y: 1 },
      { key: 'pail', type: 'item/vessel/bucket/water', x: 2, y: 2, heldBy: 'actor' },
      { key: 'near', type: 'fixture/crop/carrot/sprout', x: 3, y: 1 },
      { key: 'far', type: 'fixture/crop/carrot/sprout', x: 4, y: 3 },
    ], 'farmland')
    const w = eng.world
    period(eng, 'sprinkler', 'morning')
    expect(w.hasStatus({ e: 'near' }, 'watered')).toBe(false)
    eng.act('use', 'actor', { e: 'sprinkler' })
    expect(get(eng, 'pail').type).toBe('item/vessel/bucket/empty')
    expect(w.num(get(eng, 'sprinkler'), 'fill')).toBe(10)
    period(eng, 'sprinkler', 'morning')
    expect(w.hasStatus({ e: 'near' }, 'watered')).toBe(true)
    expect(w.hasStatus({ e: 'far' }, 'watered')).toBe(false)
    expect(w.num(get(eng, 'sprinkler'), 'fill')).toBe(9)
  })

  it('an empty flask filled at the water holds one draught, and poured into a sprinkler gives it one morning (docs/logs/0015)', () => {
    const eng = patch([
      { key: 'sprinkler', type: 'fixture/farm/sprinkler', x: 2, y: 1 },
      { key: 'vial', type: 'item/vessel/flask/empty', x: 1, y: 1, heldBy: 'actor' },
    ], 'grass', [1, 1])
    const w = eng.world
    eng.act('use', 'actor', w.cellRef(SANDBOX_MAP, 0, 0))
    expect(get(eng, 'vial').type).toBe('item/vessel/flask/water')
    // a flask holds no draughts: filled, it keeps no count of its own
    expect(get(eng, 'vial').props?.fill).toBeUndefined()
    eng.act('use', 'actor', { e: 'sprinkler' })
    expect(get(eng, 'vial').type).toBe('item/vessel/flask/empty')
    expect(w.num(get(eng, 'sprinkler'), 'fill')).toBe(1)
  })
})

describe('the millstone and the oven of a fire', () => {
  it('grinds five wheat into two flour at the millstone; flour over a lit fire is bread, and a loaf keeps its price', () => {
    const eng = patch([
      { key: 'mill', type: 'fixture/machine/millstone', x: 3, y: 2 },
      ...Array.from({ length: 5 }, (_, i) => ({ key: `wheat${i}`, type: 'item/material/wheat', x: 2, y: 2, inside: 'actor' })),
      { key: 'fire', type: 'fixture/light/campfire', x: 2, y: 1, statuses: ['lit'] },
    ])
    eng.controls.sync()
    // made at the millstone the act names (its panel, opened by a hand on it: life.ts STATIONS)
    eng.act('hands', 'actor', { e: 'mill' })
    expect(eng.world.fx).toContainEqual(expect.objectContaining({ t: 'panel', panel: 'station:mill', by: 'mill' }))
    expect(eng.controls.craft(RECIPE_BY_ID['mill/flour'], 'mill')).toBe(true)
    expect(eng.controls.count('item/material/flour')).toBe(2)
    expect(eng.controls.count('item/material/wheat')).toBe(0)
    const flour = eng.world.ofType('item/material/flour')[0]
    eng.act('use', 'actor', { e: 'fire' }, { instrument: { e: flour.id } })
    expect(eng.controls.count('item/food/bread')).toBe(1)
    expect(Math.round(priceOf('item/food/bread'))).toBe(6)
  })
})

describe('the cask', () => {
  it('takes apples one by one, sealed works two days, and gives a cider for each; another kind waits until it is empty', () => {
    const eng = patch([
      { key: 'cask', type: 'fixture/machine/cask', x: 2, y: 1 },
      ...Array.from({ length: 3 }, (_, i) => ({ key: `apple${i}`, type: 'item/food/apple', x: 2, y: 2, inside: 'actor' })),
      { key: 'berries', type: 'item/food/berries', x: 2, y: 2, inside: 'actor' },
    ])
    const w = eng.world
    for (let i = 0; i < 3; i++) eng.act('use', 'actor', { e: 'cask' }, { instrument: { e: `apple${i}` } })
    expect(w.num(get(eng, 'cask'), 'batch')).toBe(3)
    expect(w.get('apple0')).toBeUndefined()
    eng.act('use', 'actor', { e: 'cask' }, { instrument: { e: 'berries' } })
    expect(w.get('berries')).toBeDefined()
    expect(w.num(get(eng, 'cask'), 'batch')).toBe(3)
    eng.act('hands', 'actor', { e: 'cask' })
    expect(w.hasStatus({ e: 'cask' }, 'brewing')).toBe(true)
    expect(get(eng, 'cask').statuses!.brewing - w.state.tick).toBeGreaterThan(BREWS_FOR - 10)
    eng.queue({ kind: 'time/timer', host: { e: 'cask' }, roles: {}, params: { status: 'brewing' }, origin: 'world' })
    expect(lying(eng, 'item/food/cider')).toBe(3)
    expect(w.num(get(eng, 'cask'), 'batch')).toBe(0)
    expect(w.prop(get(eng, 'cask'), 'makes')).toBe('')
  })
})

describe('the orchard', () => {
  it('a seedling planted grows into an apple tree, which bears; picked, three apples and it is bare again', () => {
    const eng = patch([{ key: 'seedling', type: 'item/seed/apple', x: 2, y: 2, heldBy: 'actor' }])
    const w = eng.world
    eng.act('use', 'actor', w.cellRef(SANDBOX_MAP, 2, 1))
    const tree = () => w.placedAt(SANDBOX_MAP, 2, 1).find((e) => e.type.startsWith('fixture/orchard/'))
    expect(tree()?.type).toBe('fixture/orchard/apple_sapling')
    // each stage's clock as its kind says (two days, then a day); its end played at once rather than waited for
    const ends = (lasts: number) => {
      const t = tree()!
      expect(t.statuses!.stage - w.state.tick).toBeGreaterThan(lasts - 10)
      eng.queue({ kind: 'time/timer', host: { e: t.id }, roles: {}, params: { status: 'stage' }, origin: 'world' })
    }
    ends(TREE_GROWS)
    expect(tree()?.type).toBe('fixture/orchard/apple_tree')
    ends(TICKS_PER_DAY)
    expect(tree()?.type).toBe('fixture/orchard/apple_fruiting')
    eng.act('hands', 'actor', { e: tree()!.id })
    expect(eng.controls.count('item/food/apple')).toBe(3)
    expect(tree()?.type).toBe('fixture/orchard/apple_tree')
  })
})

describe('the sheep', () => {
  const strike = (eng: Engine) =>
    eng.queue({ kind: 'impulse/strike', host: { e: 'sheep' }, roles: { actor: { e: 'actor' }, source: { e: 'actor' }, instrument: { e: 'sickle' } }, params: { power: 1 }, origin: 'world' })

  it('a fed sheep shorn with a sickle gives two wool and no wound; shorn, or unfed, it gives none', () => {
    const eng = patch([
      { key: 'sheep', type: 'actor/creature/animal/sheep', x: 2, y: 1 },
      { key: 'sickle', type: 'item/tool/sickle', x: 2, y: 2, heldBy: 'actor' },
    ])
    const w = eng.world
    strike(eng)
    expect(lying(eng, 'item/material/wool')).toBe(0)
    eng.queue({ kind: 'impulse/notify', host: { e: 'sheep' }, roles: { actor: { e: 'actor' } }, params: { what: 'fed' }, origin: 'world' })
    const hp = w.num(get(eng, 'sheep'), 'hp')
    strike(eng)
    expect(lying(eng, 'item/material/wool')).toBe(2)
    expect(w.hasStatus({ e: 'sheep' }, 'shorn')).toBe(true)
    expect(w.num(get(eng, 'sheep'), 'hp')).toBe(hp)
    strike(eng)
    expect(lying(eng, 'item/material/wool')).toBe(2)
  })
})

describe('the new things are priced from what they take', () => {
  it('flour from wheat, cider from apples, fruit wine from berries: none worth more than its makings and the work once', () => {
    expect(priceOf('item/material/flour')).toBeCloseTo((5 * priceOf('item/material/wheat') / 2) * 1.25)
    expect(priceOf('item/food/cider')).toBeCloseTo(priceOf('item/food/apple') * 1.25)
    expect(priceOf('item/food/fruit_wine')).toBeCloseTo(priceOf('item/food/berries') * 1.25)
  })
})
