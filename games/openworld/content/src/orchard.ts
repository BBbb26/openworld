// The Held Ground's orchard (docs/logs/0006): an apple seedling bought at the stall is planted in any diggable ground
// that nothing stands on; it grows into an apple tree in two days (its stage), and the tree comes into fruit every day
// after (its stage again). A hand on a tree in fruit picks it — three apples, more for a Fruit Farmer (life.ts
// `harvest:fruit`) — and it is bare again. An orchard tree is not a crop: no watering, no seeds, no sickle. Felled, it
// gives what it is made of, as any built thing with durability does.

import type { Cond, Effect, Rule, Text, Tree } from '@openworld/engine'

const L = (en: string, zh: string): Text => ({ en, zh })
const rule = (r: Omit<Rule, 'source'>): Rule => ({ ...r, source: { origin: 'base' } })
const DO = (...effects: Effect[]): Tree => ({ do: effects })
const IF = (cond: Cond, then: Tree, otherwise?: Tree): Tree => ({ if: cond, then, ...(otherwise !== undefined && { else: otherwise }) })
const log = (en: string, zh: string): Effect => ({ op: 'log', text: L(en, zh) })

/** Open ground a tree can root in: diggable, with nothing built or growing on it. */
const OPEN_GROUND: Cond = {
  all: [
    { is: { role: 'target', sel: { type: 'tile', tags: ['diggable'] } } },
    { count: { role: 'target', in: 'tile', match: { type: 'fixture' }, cmp: { eq: 0 } } },
  ],
}

export const ORCHARD_RULES: Rule[] = [
  rule({
    id: 'orchard/plant',
    label: L('Plant {instrument}', '种下{instrument}'),
    doc: 'A tree seedling takes root in diggable ground that nothing stands on, and becomes a young tree there (its `cropType`).',
    host: { tags: ['tree-seed'] },
    on: 'act/use',
    tree: IF(OPEN_GROUND, DO(log('You plant {host}.', '你种下了{host}。'), { op: 'move', to: 'target' }, { op: 'transform', into: '@prop:cropType' }, { op: 'vfx', fx: 'dust' })),
  }),
  rule({
    id: 'orchard/pick',
    label: L('Pick {target}', '采摘{target}'),
    doc: 'A hand on an orchard tree in fruit picks it: its fruit (three; a Fruit Farmer two more) into the bag, and the tree is bare again until it bears the next day.',
    host: { type: 'fixture/orchard', tags: ['fruiting'] },
    on: 'impulse/handle',
    tree: DO(
      { op: 'spawn', type: '@prop:host.fruitType', at: 'actor', into: 'contents', count: { prop: 'fruit', of: 'host' } },
      { op: 'spawn', type: '@prop:host.fruitType', at: 'actor', into: 'contents', count: { prop: 'harvest:fruit', of: 'actor' } },
      log('You pick {host}.', '你摘下了{host}的果子。'),
      { op: 'transform', into: '@prop:bareType' },
      { op: 'vfx', fx: 'leaves' },
    ),
  }),
  rule({
    id: 'orchard/bare',
    label: L('Look at {target}', '看看{target}'),
    doc: 'A hand on an apple tree that is not in fruit: it bears again within a day.',
    host: { type: 'fixture/orchard/apple_tree' },
    on: 'impulse/handle',
    tree: DO(log('No fruit on {host} yet. It bears again within a day.', '{host}上还没有果子，一天之内会再结果。')),
  }),
]
