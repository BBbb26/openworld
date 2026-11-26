// The Held Ground's market day (docs/logs/0009): every third day Gisela, the pilgrim pedlar, comes through the thorn's
// way and keeps her pack open by Alberic's stall from seven to seven (tools/src/demo/people/gisela.ts: her schedule's
// `fact:haven.market`). The calendar keeps no weekdays (engine calendar.ts), so the story counts the days itself: each
// midnight (the story's `market` period, ontology.ts) one more, and on the third it is a market day. Only once the Held
// Ground is the player's (the knight felled).

import type { Cond, Effect, Rule, Tree } from '@openworld/engine'

const rule = (r: Omit<Rule, 'source'>): Rule => ({ ...r, source: { origin: 'base' } })
const DO = (...effects: Effect[]): Tree => ({ do: effects })
const IF = (cond: Cond, then: Tree, otherwise?: Tree): Tree => ({ if: cond, then, ...(otherwise !== undefined && { else: otherwise }) })

/** A market day every so many days. */
export const MARKET_EVERY = 3
export const MARKET_FACT = 'haven.market'
const DAYS = 'haven.marketDays'

export const MARKET_RULES: Rule[] = [
  rule({
    id: 'story/market-day',
    doc: 'Each midnight, once the Held Ground is the player\'s, the story counts a day: on every third it is a market day (`haven.market` 1, the pedlar comes), on the others not.',
    host: { type: 'resident/story' },
    on: 'time/period',
    tree: IF(
      { all: [{ param: { key: 'name', cmp: 'market' } }, { prop: { role: 'host', key: 'sins.defeated.alberic', cmp: { gte: 1 }, default: 0 } }] },
      IF(
        { prop: { role: 'host', key: DAYS, cmp: { gte: MARKET_EVERY - 1 }, default: 0 } },
        DO({ op: 'setProp', key: MARKET_FACT, value: 1 }, { op: 'setProp', key: DAYS, value: 0 }),
        DO({ op: 'setProp', key: MARKET_FACT, value: 0 }, { op: 'addProp', key: DAYS, delta: 1 }),
      ),
      'inherit',
    ),
  }),
]
