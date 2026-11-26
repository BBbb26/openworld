// The Held Ground's processing (docs/logs/0006): what the ground grows, made into more.
//
// - The millstone is a station (life.ts STATIONS: a hand on it opens its panel): wheat is ground into flour there,
//   five sheaves to two (`mill/flour`, LIFE_RECIPES). Flour is cooked into bread over a lit fire as raw food is (rules.ts use/cook: its
//   `cookedType`).
// - The cask is a machine that works by itself: fruit is put into it one by one (the fruit's own rule: `cask/load-<kind>`),
//   a hand on it seals it, and two days later what it makes comes out beside it — cider from apples, fruit wine from
//   berries. One kind at a time, up to what it holds; sealed, it takes nothing more until it is done.
//
// Rules write only their host (design.md §5.15): the fruit tells the cask it was put in (`load`) and is gone; the cask
// counts it and, when its clock runs out, makes what it makes.

import { TICKS_PER_DAY, type Cmp, type Cond, type Effect, type Rule, type Text, type Tree } from '@openworld/engine'

const L = (en: string, zh: string): Text => ({ en, zh })
const rule = (r: Omit<Rule, 'source'>): Rule => ({ ...r, source: { origin: 'base' } })
const DO = (...effects: Effect[]): Tree => ({ do: effects })
const IF = (cond: Cond, then: Tree, otherwise?: Tree): Tree => ({ if: cond, then, ...(otherwise !== undefined && { else: otherwise }) })
const param = (key: string, value: string): Cond => ({ param: { key, cmp: value } })
const log = (en: string, zh: string): Effect => ({ op: 'log', text: L(en, zh) })

export const MILLSTONE = 'fixture/machine/millstone'
export const CASK = 'fixture/machine/cask'
/** How long a sealed cask works (two game days). */
export const BREWS_FOR = 2 * TICKS_PER_DAY

/** What a machine that works by itself takes, one at a time, and what it makes of each (prices.ts prices it from this). */
export interface Process {
  machine: string
  takes: string
  makes: string
}
export const PROCESSES: Process[] = [
  { machine: CASK, takes: 'item/food/apple', makes: 'item/food/cider' },
  { machine: CASK, takes: 'item/food/berries', makes: 'item/food/fruit_wine' },
]

const slug = (type: string) => type.split('/').pop()!
const target = (key: string, cmp: Cmp): Cond => ({ prop: { role: 'target', key, cmp } })

/** One input's own rule: put into its machine (if the machine will take it), it tells the machine and is gone. */
const load = (p: Process): Rule =>
  rule({
    id: `cask/load-${slug(p.takes)}`,
    label: L('Put {instrument} into {target}', '把{instrument}放进{target}'),
    doc: `${slug(p.takes)} put into a cask that is not sealed, holds nothing else and has room: the cask is told (it will make ${slug(p.makes)} of it), and it is gone. Anything else it is used on is as before.`,
    host: { type: p.takes },
    on: 'act/use',
    tree: IF(
      { is: { role: 'target', sel: { type: p.machine } } },
      IF(
        { has: { role: 'target', status: 'brewing' } },
        DO(log('{target} is sealed. Wait until it is done.', '{target}已经封上了，等它酿好吧。')),
        IF(
          { not: { any: [target('makes', ''), target('makes', p.makes)] } },
          DO(log('{target} holds something else. One kind at a time.', '{target}里装着别的东西。一次只能酿一种。')),
          IF(
            { prop: { role: 'target', key: 'batch', bounds: { gte: { prop: 'holds', of: 'target' } } } },
            DO(log('{target} is full. Seal it.', '{target}已经满了，封上吧。')),
            DO({ op: 'emit', impulse: 'notify', to: 'target', params: { what: 'load', makes: p.makes } }, { op: 'destroy' }, { op: 'vfx', fx: 'dust', at: 'target' }),
          ),
        ),
      ),
      'inherit',
    ),
  })

export const PROCESSING_RULES: Rule[] = [
  ...PROCESSES.map(load),
  rule({
    id: 'cask/load',
    doc: 'A cask told something was put into it holds one more, and what it will make of it.',
    host: { type: CASK },
    on: 'impulse/notify',
    tree: IF(
      param('what', 'load'),
      DO({ op: 'addProp', key: 'batch', delta: 1 }, { op: 'setProp', key: 'makes', value: { param: 'makes' } }, log('{host} holds {host.batch}.', '{host}里装了{host.batch}份。')),
      'inherit',
    ),
  }),
  rule({
    id: 'cask/seal',
    label: L('Seal {target}', '封上{target}'),
    doc: 'A hand on a cask: with fruit in it, it is sealed and works for two days; sealed, it says it is working; empty, what it takes.',
    host: { type: CASK },
    on: 'impulse/handle',
    tree: IF(
      { has: { role: 'host', status: 'brewing' } },
      DO(log('{host} is sealed. It is still working.', '{host}封着，还在酿。')),
      IF(
        { prop: { role: 'host', key: 'batch', cmp: { gte: 1 } } },
        DO({ op: 'addStatus', status: 'brewing', duration: BREWS_FOR }, { op: 'vfx', fx: 'dust' }, log('You seal {host}. Give it two days.', '你把{host}封上了。等两天吧。')),
        DO(log('{host} is empty. Put apples or berries in it, then seal it.', '{host}是空的。先放进苹果或浆果，再封上。')),
      ),
    ),
  }),
  rule({
    id: 'cask/done',
    doc: 'A sealed cask\'s two days run out: what it made comes out beside it, one for each thing put in, and it is empty again.',
    host: { type: CASK },
    on: 'time/timer',
    tree: IF(
      param('status', 'brewing'),
      DO(
        { op: 'spawn', type: '@prop:host.makes', at: 'host', count: { prop: 'batch', of: 'host' } },
        { op: 'setProp', key: 'batch', value: 0 },
        { op: 'setProp', key: 'makes', value: '' },
        { op: 'vfx', fx: 'sparkle' },
        log('{host} is ready.', '{host}酿好了。'),
      ),
      'inherit',
    ),
  }),
]
