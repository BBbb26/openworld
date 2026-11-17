// The warrior went (2026-11-05), and the mage's paths became the three elements': the Dawnbringer and the mage's shared
// mastery (Archmage) went with it, the Stormcaller came, and each path has a third of its own (docs/advancement.md). An
// older save's skills of what went come back as points (their grants undone, as a change of profession undoes them); a
// warrior has no profession, to choose one again at a trainer, and a Dawnbringer no path, to choose one again; the
// skill bar lets go of what went. The Oathbrand is a sword like any other, its power gone; the sword is anyone's now.
// And the shield went (the same day): every shield, the Unfallen Wall among them, is taken apart into what the anvil
// makes one of (two planks; and two bars of its metal, a metal one), where it was; and each profession has an off-hand
// piece of its own, handed over with its weapon — one who took a profession up before is handed it now.
// The ranger's paths were made again (2026-11-12): the Trapper and the Beastmaster became the Hunter, the Sharpshooter the
// Sniper (its id kept), the Skirmisher came, each path with a third of its own, and the shared mastery (the Master Archer)
// went. A ranger's every point in the old paths and the mastery comes back, to spend again on the path as it is now; a
// Trapper or a Beastmaster is a Hunter.

import { refundProfessionSkills } from '@openworld/modules'
import { OFFHAND, type Entity, type Game, type SkillDef } from '@openworld/engine'
import { SKILL_PROFESSIONS } from './skills.ts'

export const PROFESSIONS_LAYOUT = 'content.professions-v2'
export const RANGER_LAYOUT = 'content.ranger-paths-v2'

/** What went, with what each cost and granted (enough to give it back). */
const GONE: Pick<SkillDef, 'id' | 'cost' | 'grant'>[] = [
  // the warrior's first tree
  ...['warrior-arms', 'bulwark', 'retaliation', 'rampage', 'shield-bash', 'charge', 'war-cry', 'earthsplitter', 'wide-slash', 'iron-guard', 'bash-plus', 'charge-plus', 'war-cry-plus', 'quake-plus', 'slash-plus', 'shield-wall', 'bloodthirst', 'fortitude'].map((id) => ({ id })),
  { id: 'unbreakable', grant: { maxHp: 10 } },
  ...['warlord', 'heaven-splitter', 'undying-spirit'].map((id) => ({ id, cost: 2 })),
  // its paths (Sentinel, Berserker, Thornknight) and its mastery (Paragon)
  ...['shieldbearer', 'bastion', 'challenge', 'retort', 'unyielding', 'blood-fury', 'blood-rage', 'reaving-spin', 'carnage', 'pain-eater', 'thorned-mail', 'kneel', 'briar-line', 'crowns-due', 'hold-the-line', 'unbreakable-will', 'hamstring', 'sunder', 'battle-hardened', 'sword-mastery'].map((id) => ({ id })),
  { id: 'iron-body', grant: { maxHp: 20 } },
  { id: 'weapon-master', grant: { atk: 3 } },
  ...['aegis', 'leap-of-ruin', 'crown-of-thorns', 'godslayer', 'living-legend'].map((id) => ({ id, cost: 2 })),
  // the Dawnbringer and the mage's Archmage
  ...['dawnlight', 'sunburst', 'sanctuary', 'lantern-soul', 'mercy-of-dawn', 'arcane-mastery', 'time-warp'].map((id) => ({ id })),
  { id: 'mana-flow', grant: { cdr: 0.1 } },
  ...['daybreak', 'convergence', 'ascendance'].map((id) => ({ id, cost: 2 })),
]
const GONE_IDS = new Set(GONE.map((s) => s.id))
/** The ranger's old paths' skills (the Sharpshooter's, the Trapper's, the Beastmaster's) and its mastery's, with what each cost. */
const OLD_RANGER: Pick<SkillDef, 'id' | 'cost'>[] = [
  ...['eagle-eye', 'deadeye', 'ricochet', 'weak-point', 'patience', 'lay-of-the-land', 'snare-trap', 'spike-trap', 'ambusher', 'tripwire', 'pack-bond', 'call-the-hound', 'sic', 'feral-instinct', 'pack-hunter', 'hawks-patience', 'wind-arrow', 'fletcher'].map((id) => ({ id })),
  ...['heartseeker', 'killing-field', 'the-pack', 'thousand-arrows', 'eagles-grace'].map((id) => ({ id, cost: 2 })),
]
const OLD_RANGER_IDS = new Set(OLD_RANGER.map((s) => s.id))
/** Where an old path's ranger stands now. */
const RANGER_PATHS: Record<string, string> = { trapper: 'hunter', beastmaster: 'hunter' }
const LEGENDS: Record<string, string> = { 'item/weapon/blade/sword/oathbrand': 'item/weapon/blade/sword' }
const isShield = (type: string) => type === 'item/armor/shield' || type.startsWith('item/armor/shield/')
/** What a shield is taken apart into: its metal's bars (bronze answered with iron's), and the planks of every one. */
const BARS: Record<string, string> = { iron: 'item/material/iron_ingot', bronze: 'item/material/iron_ingot', steel: 'item/material/steel_bar' }

export function migrateProfessions(game: Game): void {
  const w = game.engine.world
  if (!w.fact(PROFESSIONS_LAYOUT)) professions(w)
  if (!w.fact(RANGER_LAYOUT)) rangers(w)
}

function professions(w: Game['engine']['world']): void {
  for (const e of Object.values(w.state.entities)) {
    if (isShield(e.type) && w.get(e.id)) {
      const holder = e.place.on === 'inside' || e.place.on === 'hand' ? w.get(e.place.holder) : undefined
      const metal = (e.tags ?? []).find((t) => t.startsWith('material:'))?.slice(9)
      const place = holder ? { on: 'inside' as const, holder: holder.id } : structuredClone(e.place)
      if (holder) for (const [key, id] of Object.entries(holder.props ?? {})) if (key.startsWith('wear:') && id === e.id) w.setProp(holder, key, undefined)
      w.destroy(e)
      for (const [type, n] of [['item/material/plank', 2], ...(metal && BARS[metal] ? [[BARS[metal], 2]] : [])] as [string, number][]) for (let i = 0; i < n; i++) w.create(type, place)
      continue
    }
    if (LEGENDS[e.type]) {
      w.transform(e, LEGENDS[e.type])
      w.setProp(e, 'relic', undefined)
      continue
    }
    if ((e.tags ?? []).some((t) => t.startsWith('skill:') && GONE_IDS.has(t.slice(6)))) refundProfessionSkills(w, e, GONE as SkillDef[], () => true)
    if (w.prop(e, 'profession') === 'warrior') (w.setProp(e, 'profession', undefined), w.setProp(e, 'path', undefined))
    if (w.prop(e, 'path') === 'dawnbringer') w.setProp(e, 'path', undefined)
    if (e.skillbar?.some((id) => id && GONE_IDS.has(id))) e.skillbar = e.skillbar.map((id) => (id && GONE_IDS.has(id) ? null : id))
  }
  // the off hand handed over to one who took its profession up before it had one (worn, if that hand is free)
  for (const e of Object.values(w.state.entities)) {
    const def = SKILL_PROFESSIONS.find((p) => p.id === w.prop(e, 'profession'))
    if (!def?.offhand || !w.prop(e, `kit.${def.id}`) || carries(w, e, def.offhand.type)) continue
    const piece = w.create(def.offhand.type, { on: 'inside', holder: e.id }, structuredClone(def.offhand))
    if (!w.prop(e, OFFHAND)) w.setProp(e, OFFHAND, piece.id)
  }
  w.setFact(PROFESSIONS_LAYOUT, true)
}

function rangers(w: Game['engine']['world']): void {
  for (const e of Object.values(w.state.entities)) {
    if ((e.tags ?? []).some((t) => t.startsWith('skill:') && OLD_RANGER_IDS.has(t.slice(6)))) refundProfessionSkills(w, e, OLD_RANGER as SkillDef[], () => true)
    const path = w.prop(e, 'path')
    if (typeof path === 'string' && RANGER_PATHS[path]) w.setProp(e, 'path', RANGER_PATHS[path])
    if (e.skillbar?.some((id) => id && OLD_RANGER_IDS.has(id))) e.skillbar = e.skillbar.map((id) => (id && OLD_RANGER_IDS.has(id) ? null : id))
  }
  w.setFact(RANGER_LAYOUT, true)
}

/** Whether one carries a thing of a kind (or a kind of it: a region's quiver is a quiver), in its bag or its hand. */
function carries(w: Game['engine']['world'], e: Entity, type: string): boolean {
  return Object.values(w.state.entities).some((x) => (x.place.on === 'inside' || x.place.on === 'hand') && x.place.holder === e.id && (x.type === type || x.type.startsWith(type + '/')))
}
