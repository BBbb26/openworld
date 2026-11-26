// The Held Ground's water (docs/logs/0004): a well one builds, a barrel that catches the rain, and a sprinkler that waters
// what grows round it each morning from the water poured into it. What a bucket does at them is the bucket's own (rules.ts
// use/fill, use/water: a bucket filled from the barrel tells it `draw`, a bucket poured into the sprinkler tells it `pour`);
// here is what the barrel and the sprinkler do themselves. The well is a water source as any well is.

import type { Cond, Effect, Rule, Text, Tree } from '@openworld/engine'

const L = (en: string, zh: string): Text => ({ en, zh })
const rule = (r: Omit<Rule, 'source'>): Rule => ({ ...r, source: { origin: 'base' } })
const DO = (...effects: Effect[]): Tree => ({ do: effects })
const IF = (cond: Cond, then: Tree, otherwise?: Tree): Tree => ({ if: cond, then, ...(otherwise !== undefined && { else: otherwise }) })
const param = (key: string, value: string): Cond => ({ param: { key, cmp: value } })
const log = (en: string, zh: string): Effect => ({ op: 'log', text: L(en, zh) })

export const RAIN_BARREL = 'fixture/farm/rain_barrel'
export const SPRINKLER = 'fixture/farm/sprinkler'
export const DUG_WELL = 'fixture/water/well/dug'
/** How far a sprinkler's spray reaches: two steps (the twelve cells of the diamond round it, emit's `area`). */
export const SPRINKLER_REACH = 2
/** What grows and still wants water this stage (life.ts farm/watered answers the sprinkler's notice as it does a Sprinkler's skill). */
const GROWING_DRY = { type: 'fixture', tags: ['crop', 'growing'], notStatus: ['watered'] }

export const WATER_RULES: Rule[] = [
  rule({
    id: 'water/rain-barrel',
    doc: 'A rain barrel out under the sky catches a bucketful in every hour of rain or storm, up to what it holds (three); under a roof, or in the dry, nothing.',
    host: { type: RAIN_BARREL },
    on: 'time/period',
    tree: IF(
      { all: [param('name', 'rain'), { weather: ['rain', 'storm'] }, { outdoors: true }, { prop: { role: 'host', key: 'stored', bounds: { lt: { prop: 'holds', of: 'host' } } } }] },
      DO({ op: 'addProp', key: 'stored', delta: 1, max: { prop: 'holds', of: 'host' } }, { op: 'vfx', fx: 'splash' }),
      'inherit',
    ),
  }),
  rule({
    id: 'water/barrel-draw',
    doc: 'A rain barrel told a bucket was filled from it (rules.ts use/fill, use/water) has a bucketful less.',
    host: { type: RAIN_BARREL },
    on: 'impulse/notify',
    tree: IF(param('what', 'draw'), DO({ op: 'addProp', key: 'stored', delta: -1, min: 0 }), 'inherit'),
  }),
  rule({
    id: 'water/barrel-look',
    label: L('Look into {target}', '看看{target}里面'),
    doc: 'A hand on a rain barrel: how much rain it holds.',
    host: { type: RAIN_BARREL },
    on: 'impulse/handle',
    tree: DO(log('{host} holds {host.stored} of {host.holds} bucketfuls of rain.', '{host}里接了{host.stored}桶雨水（最多{host.holds}桶）。')),
  }),
  rule({
    id: 'water/sprinkler-morning',
    doc: 'Each morning a sprinkler with water in it sprays the crops round it (two steps every way) that still want water this stage, and spends a day\'s water; dry, it does nothing. Kept: one set up on a ground one was away from sprays once when one comes back.',
    host: { type: SPRINKLER },
    on: 'time/period',
    tree: IF(
      { all: [param('name', 'morning'), { prop: { role: 'host', key: 'fill', cmp: { gte: 1 } } }] },
      DO(
        { op: 'emit', impulse: 'notify', to: { area: { radius: SPRINKLER_REACH } }, params: { what: 'water' }, filter: GROWING_DRY },
        { op: 'addProp', key: 'fill', delta: -1, min: 0 },
        { op: 'vfx', fx: 'splash' },
      ),
      'inherit',
    ),
  }),
  rule({
    id: 'water/sprinkler-pour',
    doc: 'A sprinkler told water was poured into it (rules.ts use/water) holds that many more days of it, up to what it holds (ten); what does not fit runs off.',
    host: { type: SPRINKLER },
    on: 'impulse/notify',
    tree: IF(
      param('what', 'pour'),
      DO({ op: 'addProp', key: 'fill', delta: { param: 'n' }, max: { prop: 'draughts', of: 'host' } }, log('{host} holds water for {host.fill} mornings.', '{host}里的水还够洒{host.fill}个早晨。')),
      'inherit',
    ),
  }),
  rule({
    id: 'water/sprinkler-look',
    label: L('Look at {target}', '看看{target}'),
    doc: 'A hand on a sprinkler: how many mornings of water it holds.',
    host: { type: SPRINKLER },
    on: 'impulse/handle',
    tree: IF(
      { prop: { role: 'host', key: 'fill', cmp: { gte: 1 } } },
      DO(log('{host} holds water for {host.fill} mornings.', '{host}里的水还够洒{host.fill}个早晨。')),
      DO(log('{host} is dry. Pour a bucket of water into it.', '{host}是干的。往里倒一桶水吧。')),
    ),
  }),
]
