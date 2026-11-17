// The advancements (docs/advancement.md, 2026-11-01): each profession's three paths (the second advancement, at level
// 10), each path's third (at 16: its own name and skills; the profession's mastery only names it before a path is
// chosen), and four more skills of its first tree. The classes module keeps who has advanced how far (`advancement`, `path`) and learns a
// path's skill only on that path (`SkillDef.path`), a mastery's only at the third tier (`tier: 3`). Most passives are
// data (`SkillDef.passive`, read by the module's combat: a condition and what it pays); the few that answer an event
// are talents there by id. What the new actives lay — the miasma, the snare, the spikes, the blast trap, briars, a wall
// of flame, frozen ground, holy ground, caltrops, a binding sigil — and the creatures they call (the beasts, the dead, a
// shadow double, the faithful and an angel) are this file's too, each with its rule.

import type { ActiveDef, Effect, Rule, SkillDef, SkillPassive, Text, TypeDef } from '@openworld/engine'
import type { PathDef } from '@openworld/modules'
import { DO } from './afflictions.ts'

const L = (en: string, zh: string): Text => ({ en, zh })
const rule = (r: Omit<Rule, 'source'>): Rule => ({ ...r, source: { origin: 'base', note: 'advancement' } })

// ------------------------------------------------------------------ what the actives lay and call

export const HAZARDS = {
  miasma: 'fixture/hazard/miasma',
  snare: 'fixture/hazard/snare',
  spikes: 'fixture/hazard/spikes',
  blast: 'fixture/hazard/blast_trap',
  briars: 'fixture/hazard/briar_line',
  flame: 'fixture/hazard/flame_wall',
  frost: 'fixture/hazard/frozen_ground',
  holy: 'fixture/hazard/holy_ground',
  caltrops: 'fixture/hazard/caltrops',
  sigil: 'fixture/hazard/binding_sigil',
} as const
export const SUMMONS = { hound: 'actor/summon/hound', wolf: 'actor/summon/wolf', skeleton: 'actor/summon/skeleton', hellguard: 'actor/summon/hell_guard', phantom: 'actor/summon/phantom', disciple: 'actor/summon/disciple', seraph: 'actor/summon/seraph' } as const

const hazard = (id: string, en: string, zh: string, lasts: number, tags: string[] = []): TypeDef => ({ id, name: L(en, zh), tags: ['hazard', ...tags], sprite: `fixture:${id.split('/').pop()}`, stage: { lasts } })

export const ADVANCEMENT_TYPES: TypeDef[] = [
  hazard(HAZARDS.miasma, 'miasma', '瘴气', 50, ['poison']),
  hazard(HAZARDS.snare, 'snare', '绊索', 600, ['trap']),
  hazard(HAZARDS.spikes, 'spikes', '尖刺', 200, ['trap', 'sharp']),
  hazard(HAZARDS.blast, 'blast trap', '爆炸陷阱', 600, ['trap']),
  { ...hazard(HAZARDS.briars, 'briars', '荆棘', 60, ['thorny']), sprite: 'fixture:briar' },
  hazard(HAZARDS.flame, 'wall of flame', '火墙', 50, ['hot']),
  hazard(HAZARDS.frost, 'frozen ground', '冻土', 60),
  hazard(HAZARDS.holy, 'holy ground', '圣域', 60, ['holy']),
  hazard(HAZARDS.caltrops, 'caltrops', '铁蒺藜', 60, ['sharp']),
  hazard(HAZARDS.sigil, 'binding sigil', '封魔阵', 80, ['holy']),
  // what a Beastmaster or a Necromancer calls: of the caster's side (faction ally), following them, fighting their foes,
  // gone in a while
  { id: 'actor/summon', name: L('called beast', '召唤兽'), tags: ['creature', 'living', 'faction:ally', 'summoned'], props: { hp: 20, maxHp: 20, atk: 3, def: 0, speed: 4, sight: 7, temper: 'aggressive', behaviour: 'melee' } },
  { id: SUMMONS.hound, name: L('hound', '猎犬'), sprite: 'creature:wolf', stage: { lasts: 400 }, props: { hp: 30, maxHp: 30, atk: 4 } },
  { id: SUMMONS.wolf, name: L('wolf of the pack', '狼群之狼'), sprite: 'creature:wolf', stage: { lasts: 200 }, props: { hp: 24, maxHp: 24, atk: 4 } },
  { id: SUMMONS.skeleton, name: L('raised skeleton', '亡者骷髅'), sprite: 'creature:skeleton', tags: ['bone'], stage: { lasts: 300 }, props: { hp: 22, maxHp: 22, atk: 4 } },
  { id: SUMMONS.hellguard, name: L('guard of hell', '冥狱守卫'), sprite: 'creature:skeleton_demon', tags: ['bone'], stage: { lasts: 400 }, props: { hp: 60, maxHp: 60, atk: 8, def: 2 } },
  // a Phantom's shadow of itself: quick and hard to strike, gone soon
  { id: SUMMONS.phantom, name: L('shadow double', '影分身'), sprite: 'creature:phantom', stage: { lasts: 150 }, props: { hp: 30, maxHp: 30, atk: 7 } },
  // what an Evangelist calls: the faithful who come to fight at their side, and an angel out of the gate of heaven
  { id: SUMMONS.disciple, name: L('one of the faithful', '信徒'), sprite: 'creature:disciple', stage: { lasts: 300 }, props: { hp: 26, maxHp: 26, atk: 4 } },
  { id: SUMMONS.seraph, name: L('angel', '天使'), sprite: 'creature:seraph', tags: ['holy'], stage: { lasts: 300 }, props: { hp: 50, maxHp: 50, atk: 7, def: 2 } },
]

/** Who steps onto a hazard and is not its owner (the caster: a trap is never one's own undoing) nor of the caster's side. */
const trodBy = { all: [{ param: { key: 'how', cmp: 'under' } }, { is: { role: 'other', sel: { type: 'actor', notTags: ['faction:ally', 'faction:folk', 'airborne'] } } }, { not: { owns: ['other', 'host'] } }] } as const
const strikeOther = (params: Record<string, string | number | boolean>): Effect => ({ op: 'emit', impulse: 'strike', to: 'other', params })
const goes = (id: string, host: string, fx: string): Rule =>
  rule({ id, doc: 'What a skill laid goes when its while is out.', host: { type: host }, on: 'time/timer', tree: { if: { param: { key: 'status', cmp: 'stage' } }, then: DO({ op: 'vfx', fx, at: 'tileOf:host' }, { op: 'destroy' }), else: 'inherit' } })

export const ADVANCEMENT_RULES: Rule[] = [
  rule({ id: 'adv/miasma', doc: 'A Necromancer\'s miasma poisons the foe that walks into it.', host: { type: HAZARDS.miasma }, on: 'contact/begin', tree: { if: trodBy as never, then: DO(strikeOther({ power: 1, edge: 'magic', afflict: 'poisoned', afflictFor: 50 })), else: 'inherit' } }),
  rule({ id: 'adv/snare', doc: 'A snare holds the first foe on it (webbed, 3 s), and is spent.', host: { type: HAZARDS.snare }, on: 'contact/begin', tree: { if: trodBy as never, then: DO(strikeOther({ power: 1, afflict: 'webbed', afflictFor: 30 }), { op: 'vfx', fx: 'hit', at: 'tileOf:host' }, { op: 'destroy' }), else: 'inherit' } }),
  rule({ id: 'adv/spikes', doc: 'Spikes cut the foe that crosses them (it bleeds) and mire it.', host: { type: HAZARDS.spikes }, on: 'contact/begin', tree: { if: trodBy as never, then: DO(strikeOther({ power: 2, edge: 'cut', bleed: 30, afflict: 'mired', afflictFor: 20 })), else: 'inherit' } }),
  rule({ id: 'adv/blast', doc: 'A blast trap bursts under the foe that steps on it (fire), and is spent.', host: { type: HAZARDS.blast }, on: 'contact/begin', tree: { if: trodBy as never, then: DO(strikeOther({ power: 8, element: 'fire', afflict: 'burning', afflictFor: 30 }), { op: 'vfx', fx: 'explosion', at: 'tileOf:host' }, { op: 'destroy' }), else: 'inherit' } }),
  rule({ id: 'adv/briars', doc: 'Briars make the foe that walks into them kneel.', host: { type: HAZARDS.briars }, on: 'contact/begin', tree: { if: trodBy as never, then: DO(strikeOther({ power: 1, edge: 'cut', afflict: 'knelt', afflictFor: 10 })), else: 'inherit' } }),
  rule({ id: 'adv/flame', doc: 'A wall of flame burns the foe that walks into it.', host: { type: HAZARDS.flame }, on: 'contact/begin', tree: { if: trodBy as never, then: DO(strikeOther({ power: 3, element: 'fire', afflict: 'burning', afflictFor: 30 })), else: 'inherit' } }),
  rule({ id: 'adv/frost', doc: 'A Cryomancer\'s frozen ground freezes the foe that walks onto it.', host: { type: HAZARDS.frost }, on: 'contact/begin', tree: { if: trodBy as never, then: DO(strikeOther({ power: 1, element: 'ice', afflict: 'frozen', afflictFor: 10 })), else: 'inherit' } }),
  rule({ id: 'adv/caltrops', doc: 'Caltrops prick and mire the foe that steps on them.', host: { type: HAZARDS.caltrops }, on: 'contact/begin', tree: { if: trodBy as never, then: DO(strikeOther({ power: 1, edge: 'cut', afflict: 'mired', afflictFor: 30 })), else: 'inherit' } }),
  rule({ id: 'adv/holy', doc: 'A Cleric\'s holy ground burns the undead that walk onto it.', host: { type: HAZARDS.holy }, on: 'contact/begin', tree: { if: { all: [trodBy, { is: { role: 'other', sel: { tags: ['undead'] } } }] } as never, then: DO(strikeOther({ power: 3, edge: 'magic' }), { op: 'vfx', fx: 'sparkle', at: 'tileOf:host' }), else: 'inherit' } }),
  rule({ id: 'adv/sigil', doc: 'A Demon Hunter\'s binding sigil hexes the foe that walks into it (weaker, softer, slower).', host: { type: HAZARDS.sigil }, on: 'contact/begin', tree: { if: trodBy as never, then: DO(strikeOther({ power: 1, edge: 'magic', afflict: 'hexed', afflictFor: 40 })), else: 'inherit' } }),
  goes('adv/miasma-thins', HAZARDS.miasma, 'smoke'),
  goes('adv/snare-rots', HAZARDS.snare, 'leaves'),
  goes('adv/spikes-sink', HAZARDS.spikes, 'dust'),
  goes('adv/blast-rusts', HAZARDS.blast, 'dust'),
  goes('adv/briars-wither', HAZARDS.briars, 'leaves'),
  goes('adv/flame-dies', HAZARDS.flame, 'smoke'),
  goes('adv/frost-thaws', HAZARDS.frost, 'frost'),
  goes('adv/holy-fades', HAZARDS.holy, 'sparkle'),
  goes('adv/caltrops-sink', HAZARDS.caltrops, 'dust'),
  goes('adv/sigil-fades', HAZARDS.sigil, 'sparkle'),
  // told to mend (a Cleric's Prayer, a Healing Light, a Psalm, a Crown of Glory: actives.ts), a called beast or one of
  // the faithful mends by as much (a person does so by body/stage)
  rule({ id: 'adv/summon-mends', doc: 'Told to mend, a called creature mends by as much.', host: { type: 'actor/summon' }, on: 'impulse/notify', tree: { if: { param: { key: 'what', cmp: 'mend' } }, then: DO({ op: 'heal', amount: { param: 'amount' } }, { op: 'vfx', fx: 'heal', at: 'tileOf:host' }), else: 'inherit' } }),
  rule({ id: 'adv/summon-goes', doc: 'A called beast, or the raised dead, goes back where it came from when its while is out.', host: { type: 'actor/summon' }, on: 'time/timer', tree: { if: { param: { key: 'status', cmp: 'stage' } }, then: DO({ op: 'vfx', fx: 'poof', at: 'tileOf:host' }, { op: 'destroy' }), else: 'inherit' } }),
]

// ------------------------------------------------------------------ the skills

const cd = (a: ActiveDef) => `${a.cooldown / 10}`
/** Where a skill stands: on a path, the mastery (`tier: 3`, on a path when the path's third is its own), the first tree. */
type Where = { path?: string | string[]; tier?: number }
/** An active skill of a path (or the mastery, `tier: 3`; or the first tree, neither). */
const A = (id: string, profession: string, where: Where, requires: string[], active: ActiveDef, en: string, zh: string, docEn: string, docZh: string, cost = 1): SkillDef => ({
  id, branch: where.tier ? 'mastery' : where.path ? 'path' : 'profession', profession, ...(where.path && { path: where.path }), ...(where.tier && { tier: where.tier }),
  icon: id, requires, ability: true, active, ...(cost > 1 && { cost }), name: L(en, zh),
  doc: L(`${cost > 1 ? 'Ultimate: ' : ''}${docEn} Cooldown ${cd(active)} s.`, `${cost > 1 ? '终极：' : ''}${docZh}冷却 ${cd(active)} 秒。`),
})
/** A passive: in data (`passive`), a number granted (`grant`), or a talent the module answers by its id (neither). */
const T = (id: string, profession: string, where: Where, requires: string[], en: string, zh: string, docEn: string, docZh: string, extra: { passive?: SkillPassive; grant?: Record<string, number>; modifies?: SkillDef['modifies']; cost?: number } = {}): SkillDef => ({
  id, branch: where.tier ? 'mastery' : where.path ? 'path' : 'profession', profession, ...(where.path && { path: where.path }), ...(where.tier && { tier: where.tier }),
  icon: id, requires, ...(extra.grant || extra.modifies ? {} : { ability: true }), ...extra, name: L(en, zh), doc: L(`${(extra.cost ?? 1) > 1 ? 'Capstone: ' : ''}${docEn}`, `${(extra.cost ?? 1) > 1 ? '终极天赋：' : ''}${docZh}`),
})

const OWN = { weapon: 'own' } as const

// --- the assassin
const NE = { path: 'necromancer' }
const SD = { path: 'shadowdancer' }
const DH = { path: 'demonhunter' }
/** Each path's third its own: Hell Sovereign, Phantom, Ghostwail. */
const HS = { path: 'necromancer', tier: 3 }
const PH = { path: 'shadowdancer', tier: 3 }
const GW = { path: 'demonhunter', tier: 3 }
/** What the Demon Hunter's lore reads as a foe afflicted. */
const AFFLICTED = ['hexed', 'poisoned', 'bleeding', 'burning', 'frozen', 'stunned', 'mired', 'webbed', 'knelt']
const ASSASSIN: SkillDef[] = [
  // (the Necromancer stands back: the dead it raises and the poison do the killing — an arm of each, an army at the end)
  T('grave-pact', 'assassin', NE, [], 'Grave Pact', '亡者契约', 'The dead you raise have half again their health and strike 30% harder.', '你唤起的亡者生命 +50%，伤害 +30%。'),
  A('raise-dead', 'assassin', NE, ['grave-pact'], { kind: 'summon', creature: SUMMONS.skeleton, cooldown: 400, count: 2 }, 'Raise Dead', '亡者复苏', 'Two skeletons climb out of the ground and fight at your side for 30 s.', '两具骷髅从地下爬出，在你身边战斗 30 秒。'),
  A('miasma', 'assassin', NE, ['grave-pact'], { kind: 'field', leaves: HAZARDS.miasma, pattern: 'square', cooldown: 160 }, 'Miasma', '瘴气', 'A poison cloud on the 3×3 two cells ahead for 5 s: the foes in it are poisoned.', '在前方两格处的 3×3 范围放出毒雾，持续 5 秒：进入的敌人中毒。'),
  A('drive-the-dead', 'assassin', NE, ['raise-dead'], { kind: 'command', cooldown: 120, power: 1.5, range: 6, count: 4, afflict: 'poisoned', ticks: 30 }, 'Drive the Dead', '驱使亡者', 'Up to four of the dead you raised leap on the first foe ahead within 6 cells, each striking it (×1.5 of its own), and poison it.', '离你最近的至多四个亡者扑向前方 6 格内的第一个敌人，各按自身攻击打 1.5 倍，并让它中毒。'),
  T('grave-toxin', 'assassin', NE, ['raise-dead'], 'Grave Toxin', '尸毒', 'Every blow of the dead you raise poisons the struck for 3 s.', '你唤起的亡者每次攻击都会让目标中毒 3 秒。'),
  T('corpse-burst', 'assassin', NE, ['miasma'], 'Corpse Burst', '尸爆', 'A poisoned foe felled by you or the dead you raise bursts: every foe within 2 cells is struck (×0.6) and poisoned.', '你或你唤起的亡者击倒中毒的敌人时，尸体会爆开：2 格内的敌人受到攻击（0.6 倍伤害）并中毒。'),
  A('toxic-burst', 'assassin', NE, ['miasma'], { kind: 'detonate', status: 'poisoned', cooldown: 140, power: 2, range: 5 }, 'Toxic Burst', '毒爆', 'The poison in every foe within 5 cells bursts (×2.0): the poison in it is spent.', '5 格内所有中毒的敌人体内的毒爆开（2.0 倍伤害），毒随之耗尽。'),
  T('bone-ward', 'assassin', NE, ['drive-the-dead'], 'Bone Ward', '骨盾', 'With a companion near: combat damage taken −15%.', '有同伴在身边时，受到的战斗伤害 −15%。', { passive: { when: { companion: true }, taken: -0.15 } }),
  T('raise-dead-plus', 'assassin', NE, ['grave-toxin'], 'Raise Dead: Mastery', '亡者复苏·精通', 'Raise Dead: one more skeleton, cooldown −5 s.', '亡者复苏：多唤起一具骷髅，冷却 −5 秒。', { modifies: { skill: 'raise-dead', count: 1, cooldown: -50 } }),
  T('rot', 'assassin', NE, ['corpse-burst'], 'Rot', '腐毒', 'You and the companions within 6 cells: damage +20% against the poisoned.', '你和身边 6 格内的同伴对中毒的敌人伤害 +20%。', { passive: { party: true, when: { target: { status: ['poisoned'] } }, damage: 0.2 } }),
  T('toxic-burst-plus', 'assassin', NE, ['toxic-burst'], 'Toxic Burst: Mastery', '毒爆·精通', 'Toxic Burst: reach +2 cells, damage +0.5×.', '毒爆：范围 +2 格，伤害 +0.5 倍。', { modifies: { skill: 'toxic-burst', range: 2, power: 0.5 } }),
  A('army-of-the-dead', 'assassin', NE, ['raise-dead-plus', 'rot'], { kind: 'summon', creature: SUMMONS.skeleton, cooldown: 500, count: 4, power: 0.6, radius: 2, afflict: 'poisoned', ticks: 50 }, 'Army of the Dead', '亡者大军', 'The ground opens round you: every foe within 2 cells is struck (×0.6) and poisoned, and four skeletons climb out to fight at your side for 30 s.', '你周围的地面裂开：2 格内的敌人受到攻击（0.6 倍伤害）并中毒，四具骷髅爬出来，在你身边战斗 30 秒。', 2),

  // (the Shadowdancer: the veil and the back on one arm, the dodge and the critical on the other, a thousand shadows at the end)
  T('shadow-poise', 'assassin', SD, [], 'Shadow Poise', '影舞', 'With a dagger: dodge +8%, critical chance +5%; a Backstab deals 30% more.', '持匕首时闪避 +8%，暴击率 +5%；背刺伤害再 +30%。', { passive: { when: OWN, dodge: 0.08, crit: 0.05 } }),
  A('umbral-step', 'assassin', SD, ['shadow-poise'], { kind: 'veil', cooldown: 140, ticks: 20, sure: true }, 'Umbral Step', '影遁', 'Vanish for 2 s: no creature sees you, and your next blow is a sure critical.', '隐去身形 2 秒：怪物看不见你，下一击必定暴击。'),
  A('blur', 'assassin', SD, ['shadow-poise'], { kind: 'buff', cooldown: 240, ticks: 40, buff: { dodge: 0.35, moveHaste: 0.2 } }, 'Blur', '残影', 'For 4 s: dodge +35%, movement speed +20%.', '4 秒内闪避 +35%，移动速度 +20%。'),
  A('shade-stab', 'assassin', SD, ['umbral-step'], { kind: 'shadow-strike', cooldown: 160, power: 2.5, range: 5, count: 1, bleed: 40 }, 'Shade Stab', '影刺', 'Step behind the nearest foe within 5 cells and stab it (×2.5): it bleeds.', '闪到 5 格内最近敌人的背后刺出一击（2.5 倍伤害），使其流血。'),
  T('unseen', 'assassin', SD, ['umbral-step'], 'Unseen', '无形', 'The first blow you strike from a veil (Umbral Step, Smoke Bomb) deals 50% more.', '从隐匿中（影遁、烟雾弹）打出的第一击伤害 +50%。'),
  T('riposte', 'assassin', SD, ['blur'], 'Riposte', '还击', 'A dodged blow readies your next: +80% damage within 2 s.', '闪避一次攻击后，2 秒内的下一击伤害 +80%。'),
  A('shadow-dance', 'assassin', SD, ['blur'], { kind: 'buff', cooldown: 300, ticks: 60, buff: { attackHaste: 0.3, crit: 0.15 } }, 'Shadow Dance', '暗影之舞', 'For 6 s: attack speed +30%, critical chance +15%.', '6 秒内攻击速度 +30%，暴击率 +15%。'),
  T('night-veil', 'assassin', SD, ['shade-stab'], 'Night Veil', '夜幕', 'At night: dodge +10%, critical chance +10%.', '入夜后闪避 +10%，暴击率 +10%。', { passive: { when: { night: true }, dodge: 0.1, crit: 0.1 } }),
  T('umbral-step-plus', 'assassin', SD, ['unseen'], 'Umbral Step: Mastery', '影遁·精通', 'Umbral Step: cooldown −4 s, the veil 1 s longer.', '影遁：冷却 −4 秒，隐身多 1 秒。', { modifies: { skill: 'umbral-step', cooldown: -40, ticks: 10 } }),
  T('deadly-grace', 'assassin', SD, ['riposte'], 'Deadly Grace', '致命优雅', 'With a dagger: dodge +5%, critical damage +25%.', '持匕首时闪避 +5%，暴击伤害 +25%。', { passive: { when: OWN, dodge: 0.05, critDamage: 0.25 } }),
  T('blur-plus', 'assassin', SD, ['shadow-dance'], 'Blur: Mastery', '残影·精通', 'Blur: cooldown −6 s, 1 s longer.', '残影：冷却 −6 秒，多持续 1 秒。', { modifies: { skill: 'blur', cooldown: -60, ticks: 10 } }),
  A('thousand-shadows', 'assassin', SD, ['umbral-step-plus', 'deadly-grace'], { kind: 'shadow-strike', cooldown: 300, power: 1.4, range: 4, count: 5 }, 'Thousand Shadows', '千影', 'Step behind up to five foes within 4 cells, one after another, striking each (×1.4).', '依次闪到 4 格内至多五个敌人背后，各攻击一次（1.4 倍伤害）。', 2),

  // (the Demon Hunter: sigils and holds on one arm, hexes and the hunt's call on the other, a prison at the end)
  T('hunters-lore', 'assassin', DH, [], "Hunter's Lore", '猎魔学识', 'Damage +15% against a foe under an affliction (hexed, poisoned, bleeding, burning, frozen, stunned, mired, webbed, kneeling).', '对处于负面状态（咒印、中毒、流血、着火、冰冻、眩晕、迟滞、缠丝、跪地）的敌人伤害 +15%。', { passive: { when: { target: { status: AFFLICTED } }, damage: 0.15 } }),
  A('binding-sigil', 'assassin', DH, ['hunters-lore'], { kind: 'field', leaves: HAZARDS.sigil, pattern: 'square', cooldown: 180 }, 'Binding Sigil', '封魔阵', 'Draw a binding sigil on the 3×3 two cells ahead for 8 s: a foe who walks in is hexed for 4 s (attack −2, defence −3, slower).', '在前方两格处的 3×3 范围画下封魔阵，持续 8 秒：走进去的敌人被打上咒印 4 秒（攻击 −2，防御 −3，移动变慢）。'),
  A('hunt-call', 'assassin', DH, ['hunters-lore'], { kind: 'buff', cooldown: 300, ticks: 60, buff: { party: true, damage: 0.2, attackHaste: 0.15 } }, 'Call of the Hunt', '狩魔号令', 'For 6 s, you and the companions within 6 cells: damage +20%, attack speed +15%.', '6 秒内，你和身边 6 格内的同伴伤害 +20%，攻击速度 +15%。'),
  A('chains-of-binding', 'assassin', DH, ['binding-sigil'], { kind: 'chain', cooldown: 180, power: 0.8, range: 6, count: 3, afflict: 'webbed', ticks: 20 }, 'Chains of Binding', '缚魔锁链', 'A chain at the first foe ahead that leaps on to 2 more nearby (×0.8 each), binding each for 2 s.', '一道锁链射向前方第一个敌人，再弹向附近的另外 2 个（每个 0.8 倍伤害），各缠住 2 秒。'),
  T('hex-edge', 'assassin', DH, ['binding-sigil'], 'Hexing Edge', '咒刃', 'With a dagger: one blow in five hexes the struck for 4 s.', '持匕首攻击时，有五分之一的几率给目标打上咒印 4 秒。'),
  T('hunters-vigil', 'assassin', DH, ['hunt-call'], "Hunter's Vigil", '猎魔守望', 'You and the companions within 6 cells take 10% less combat damage.', '你和身边 6 格内的同伴受到的战斗伤害 −10%。', { passive: { party: true, taken: -0.1 } }),
  A('hex-wave', 'assassin', DH, ['hunt-call'], { kind: 'nova', cooldown: 220, power: 0.5, range: 3, afflict: 'hexed', ticks: 40 }, 'Hex Wave', '咒缚', 'Every foe within 3 cells is struck (×0.5) and hexed for 4 s.', '周围 3 格内的敌人受到攻击（0.5 倍伤害）并被打上咒印 4 秒。'),
  T('chains-plus', 'assassin', DH, ['chains-of-binding'], 'Chains of Binding: Mastery', '缚魔锁链·精通', 'Chains of Binding: 2 more foes, each bound 1 s longer.', '缚魔锁链：多弹 2 个敌人，各多缠住 1 秒。', { modifies: { skill: 'chains-of-binding', count: 2, ticks: 10 } }),
  T('judgement', 'assassin', DH, ['hex-edge'], 'Judgement', '断罪', 'Critical chance +15% against the held, the stunned, the mired and the hexed.', '攻击被缠住、眩晕、迟滞或被打上咒印的敌人时，暴击率 +15%。', { passive: { when: { target: { status: ['webbed', 'stunned', 'mired', 'hexed'] } }, crit: 0.15 } }),
  T('hunt-call-plus', 'assassin', DH, ['hunters-vigil'], 'Call of the Hunt: Mastery', '狩魔号令·精通', 'Call of the Hunt: cooldown −5 s, 3 s longer.', '狩魔号令：冷却 −5 秒，多持续 3 秒。', { modifies: { skill: 'hunt-call', cooldown: -50, ticks: 30 } }),
  T('deep-hex', 'assassin', DH, ['hex-wave'], 'Deep Hex', '深咒', 'You and the companions within 6 cells: damage +15% against the hexed.', '你和身边 6 格内的同伴对被打上咒印的敌人伤害 +15%。', { passive: { party: true, when: { target: { status: ['hexed'] } }, damage: 0.15 } }),
  A('demon-prison', 'assassin', DH, ['judgement', 'hunt-call-plus'], { kind: 'field', leaves: HAZARDS.sigil, pattern: 'ring', cooldown: 380, power: 1, radius: 2, afflict: 'stunned', ticks: 15 }, 'Demon Prison', '镇魔结界', 'Every foe within 2 cells is struck (×1.0) and stunned for 1.5 s, and a ring of binding sigils is drawn round you.', '周围 2 格内的敌人受到攻击（1.0 倍伤害）并眩晕 1.5 秒，同时在你周围画下一圈封魔阵。', 2),

  // Hell Sovereign (the Necromancer's third): the dead stronger, a guard of hell, a plague round one, the gate of the Styx
  T('hell-pact', 'assassin', HS, [], 'Hell Pact', '地狱契约', 'The dead you raise have 30% more health and strike 30% harder again; you and your companions within 6 cells draw back 1 health with each blow.', '你唤起的亡者生命、伤害再 +30%；你和身边 6 格内的同伴每次命中吸取 1 点生命。', { passive: { party: true, drain: 1 } }),
  A('hell-guard', 'assassin', HS, ['hell-pact'], { kind: 'summon', creature: SUMMONS.hellguard, cooldown: 600, count: 1 }, 'Guard of Hell', '冥狱守卫', 'A guard of hell steps out of the ground, far stronger than a skeleton, and fights at your side for 40 s.', '一名冥狱守卫从地下走出，比骷髅强得多，在你身边战斗 40 秒。'),
  A('pestilence', 'assassin', HS, ['hell-pact'], { kind: 'rain', pattern: 'around', cooldown: 360, power: 0.4, count: 5, radius: 2, afflict: 'poisoned', ticks: 30 }, 'Pestilence', '瘟疫降临', 'A plague falls on the 5×5 round you, once a second for 5 s (×0.4 each), poisoning.', '在你周围 5×5 范围降下瘟疫，每秒一轮，持续 5 秒（每轮 0.4 倍伤害），并让敌人中毒。'),
  T('soul-harvest', 'assassin', HS, ['hell-guard'], 'Soul Harvest', '灵魂收割', 'Whenever the dead you raise fell a foe: you mend 3 health, and every skill is a second nearer.', '你唤起的亡者每击倒一个敌人，你恢复 3 点生命，所有技能冷却缩短 1 秒。'),
  T('plague-lord', 'assassin', HS, ['pestilence'], 'Plague Lord', '瘟疫领主', 'You and the companions within 6 cells: critical chance +15% against the poisoned.', '你和身边 6 格内的同伴攻击中毒的敌人时暴击率 +15%。', { passive: { party: true, when: { target: { status: ['poisoned'] } }, crit: 0.15 } }),
  A('gate-of-the-styx', 'assassin', HS, ['soul-harvest', 'plague-lord'], { kind: 'summon', creature: SUMMONS.hellguard, cooldown: 600, count: 2, power: 1, radius: 3, afflict: 'poisoned', ticks: 50 }, 'Gate of the Styx', '冥河之门', 'The gate of the Styx opens beside you: every foe within 3 cells is struck (×1.0) and poisoned, and two guards of hell step out to fight at your side for 40 s.', '冥河之门在你身边打开：3 格内的敌人受到攻击（1.0 倍伤害）并中毒，两名冥狱守卫走出来，在你身边战斗 40 秒。', 2),
  T('dominion-of-hell', 'assassin', HS, ['gate-of-the-styx'], 'Dominion of Hell', '地狱支配', 'You and the companions within 6 cells: damage +25%, attack speed +15%.', '你和身边 6 格内的同伴伤害 +25%，攻击速度 +15%。', { passive: { party: true, damage: 0.25, attackHaste: 0.15 }, cost: 2 }),

  // Phantom (the Shadowdancer's third): a double of oneself, a dodge that fades one out, the assassination
  T('lethality', 'assassin', PH, [], 'Lethality', '致命', 'With a dagger: critical damage +30%.', '持匕首时暴击伤害 +30%。', { passive: { when: OWN, critDamage: 0.3 } }),
  A('shadow-double', 'assassin', PH, ['lethality'], { kind: 'summon', creature: SUMMONS.phantom, cooldown: 400, count: 1 }, 'Shadow Double', '影分身', 'A shadow of yourself steps out of yours and fights at your side for 15 s.', '一道你自己的影子从你身上分出来，在你身边战斗 15 秒。'),
  T('ghost', 'assassin', PH, ['lethality'], 'Ghost', '幽灵', 'Dodge +8%.', '闪避 +8%。', { passive: { dodge: 0.08 } }),
  T('fade', 'assassin', PH, ['ghost'], 'Fade', '消隐', 'Each blow you dodge melts you into the dark for 1 s: no creature sees you, and your next blow is a sure critical.', '每闪避一次攻击，你就隐入黑暗 1 秒：怪物看不见你，下一击必定暴击。'),
  T('shadow-double-plus', 'assassin', PH, ['shadow-double'], 'Shadow Double: Mastery', '影分身·精通', 'Shadow Double: two shadows, cooldown −10 s.', '影分身：分出两道影子，冷却 −10 秒。', { modifies: { skill: 'shadow-double', count: 1, cooldown: -100 } }),
  A('assassinate', 'assassin', PH, ['fade', 'shadow-double-plus'], { kind: 'shadow-strike', cooldown: 360, power: 5, range: 6, count: 1, sure: true }, 'Assassinate', '刺杀', 'Step behind the nearest foe within 6 cells and strike once (×5), a sure critical.', '闪到 6 格内最近敌人的背后刺出一击（5 倍伤害），必定暴击。', 2),
  T('shadow-lord', 'assassin', PH, ['assassinate'], 'Shadow Lord', '影之主', 'Every fifth blow you strike is a critical.', '每第五次攻击必定暴击。', { cost: 2 }),

  // Ghostwail (the Demon Hunter's third): the hunter of the night's things, a sanctum for its company, the wail, the hex spread
  T('exorcist', 'assassin', GW, [], 'Exorcist', '驱魔师', 'Damage +25% against the undead, the night\'s creatures and the bosses.', '对亡灵、夜行生物和首领伤害 +25%。', { passive: { when: { target: { tag: ['undead', 'nightborn', 'boss'] } }, damage: 0.25 } }),
  A('death-mark', 'assassin', GW, ['exorcist'], { kind: 'mark', cooldown: 200, range: 6, ticks: 80, buff: { damage: 0.3 } }, 'Death Mark', '死亡印记', 'Mark the nearest foe within 6 cells: it takes 30% more from you for 8 s; if it falls marked, every skill is ready again.', '标记 6 格内最近的敌人：8 秒内它受到你的伤害 +30%；它在标记中倒下时，你的所有技能立即冷却完毕。'),
  A('hunters-sanctum', 'assassin', GW, ['exorcist'], { kind: 'field', leaves: HAZARDS.sigil, pattern: 'around', cooldown: 400, ticks: 80, buff: { party: true, damage: 0.2, taken: -0.15 } }, "Hunter's Sanctum", '猎魔圣域', 'Binding sigils on the 3×3 round you; for 8 s you and the companions within 6 cells deal 20% more and take 15% less.', '在你周围 3×3 画下封魔阵；8 秒内你和身边 6 格内的同伴伤害 +20%，受到的伤害 −15%。'),
  T('death-mark-plus', 'assassin', GW, ['death-mark'], 'Death Mark: Mastery', '死亡印记·精通', 'Death Mark: 4 s longer, reach +2 cells.', '死亡印记：多持续 4 秒，距离 +2 格。', { modifies: { skill: 'death-mark', ticks: 40, range: 2 } }),
  T('undying-hunt', 'assassin', GW, ['hunters-sanctum'], 'Undying Hunt', '不灭狩猎', 'You and the companions within 6 cells: at half health or less, combat damage taken −20%.', '你和身边 6 格内的同伴生命不高于一半时，受到的战斗伤害 −20%。', { passive: { party: true, when: { wounded: 0.5 }, taken: -0.2 } }),
  A('ghost-howl', 'assassin', GW, ['death-mark-plus', 'undying-hunt'], { kind: 'nova', cooldown: 420, power: 1.5, range: 4, afflict: 'stunned', ticks: 20 }, 'Ghost Howl', '鬼哭', 'A howl that makes the ghosts weep: every foe within 4 cells is struck (×1.5) and stunned for 2 s.', '一声让鬼也落泪的长嚎：周围 4 格内的敌人受到攻击（1.5 倍伤害）并眩晕 2 秒。', 2),
  T('hex-plague', 'assassin', GW, ['ghost-howl'], 'Hex Plague', '咒疫', 'A hexed foe felled by you or a companion passes its hex on: every foe within 3 cells is struck lightly (×0.2) and hexed, and your skills come 2 s nearer.', '你或同伴击倒被打上咒印的敌人时，咒印会传开：3 格内的敌人受到轻微攻击（0.2 倍伤害）并被打上咒印，你所有技能的冷却缩短 2 秒。', { cost: 2 }),

  A('garrote', 'assassin', {}, ['backstab'], { kind: 'bash', cooldown: 120, power: 2, afflict: 'stunned', ticks: 10 }, 'Garrote', '锁喉', 'Seize the foe ahead (×2; Backstab applies) and stun it for 1 s.', '扼住前方的敌人（2 倍伤害，可触发背刺）并使其眩晕 1 秒。'),
  A('caltrops', 'assassin', {}, ['ambush'], { kind: 'field', leaves: HAZARDS.caltrops, pattern: 'square', cooldown: 160 }, 'Caltrops', '铁蒺藜', 'Scatter caltrops on the 3×3 two cells ahead for 6 s: foes who step on them are pricked and mired.', '在前方两格处的 3×3 范围撒下铁蒺藜，持续 6 秒：踩上去的敌人被刺伤并陷足。'),
  T('light-step', 'assassin', {}, ['assassin-training'], 'Light Step', '轻步', 'With a dagger: movement speed +8%.', '持匕首时移动速度 +8%。', { passive: { when: OWN, moveHaste: 0.08 } }),
  T('cut-deep', 'assassin', {}, ['envenom'], 'Cut Deep', '深切', 'Damage +10% against the bleeding.', '对流血中的敌人伤害 +10%。', { passive: { when: { target: { status: ['bleeding'] } }, damage: 0.1 } }),
]

// --- the ranger (2026-11-12: the Hunter, the Sniper, the Skirmisher, each with a third of its own)
const HU = { path: 'hunter' }
const SN = { path: 'sharpshooter' }
const SK = { path: 'skirmisher' }
/** Each path's third its own: Greenwood Dawn, Hawkeye, Skywing. */
const GREENWOOD = { path: 'hunter', tier: 3 }
const HAWKEYE = { path: 'sharpshooter', tier: 3 }
const SKYWING = { path: 'skirmisher', tier: 3 }
/** The held, the mired and the stunned: what a Hunter's traps and nets leave. */
const CAUGHT = { target: { status: ['webbed', 'mired', 'stunned'] } }
/** A Hunter's prey (Mark Prey, the Dawn Flight): slower, and struck harder by the Hunter and their companions. */
const HUNTED = { target: { status: ['hunted'] } }
/** How far an arrow flies on a Hawkeye's bow: as far as the map goes (the first body or wall stops it). */
const MAP_WIDE = 200
const RANGER: SkillDef[] = [
  // (the Hunter: snares and spikes on one arm, the hound and the mark on the other, a field of blast traps at the end)
  T('ambusher', 'ranger', HU, [], 'Ambusher', '伏击者', 'Damage +30% against the held, the mired and the stunned.', '对被缠住、陷足或眩晕的敌人伤害 +30%。', { passive: { when: CAUGHT, damage: 0.3 } }),
  A('snare-trap', 'ranger', HU, ['ambusher'], { kind: 'field', leaves: HAZARDS.snare, pattern: 'cell', cooldown: 120 }, 'Snare Trap', '绊索', 'Lay a snare on the cell ahead: the first foe to step on it is held for 3 s.', '在前方一格布下绊索：第一个踩上去的敌人被缠住 3 秒。'),
  A('call-the-hound', 'ranger', HU, ['ambusher'], { kind: 'summon', creature: SUMMONS.hound, cooldown: 450, count: 1 }, 'Call the Hound', '唤犬', 'A hound comes to your whistle and fights at your side for 40 s.', '一只猎犬应哨而来，在你身边战斗 40 秒。'),
  A('spike-trap', 'ranger', HU, ['snare-trap'], { kind: 'field', leaves: HAZARDS.spikes, pattern: 'line', range: 3, cooldown: 160 }, 'Spike Trap', '尖刺陷阱', 'Lay spikes down the 3 cells ahead for 20 s: foes crossing them bleed and are mired.', '在前方 3 格布下尖刺，持续 20 秒：经过的敌人流血并陷足。'),
  T('tripwire', 'ranger', HU, ['snare-trap'], 'Tripwire', '绊线', 'Against the held: critical chance +25%.', '攻击被缠住的敌人时，暴击率 +25%。', { passive: { when: { target: { status: ['webbed'] } }, crit: 0.25 } }),
  {
    ...A('mark-prey', 'ranger', HU, ['call-the-hound'], { kind: 'mark', cooldown: 150, range: 7, ticks: 100, power: 0.3, afflict: 'hunted' }, 'Mark Prey', '标记猎物', 'Mark the nearest foe within 7 cells as your prey for 10 s (×0.3): it is slowed, and you and your companions within 6 cells deal it 20% more.', '把 7 格内最近的敌人标记为猎物 10 秒（0.3 倍伤害）：它移动变慢，你和身边 6 格内的同伴对它伤害 +20%。'),
    passive: { party: true, when: HUNTED, damage: 0.2 },
  },
  A('sic', 'ranger', HU, ['call-the-hound'], { kind: 'command', cooldown: 80, power: 2, range: 6, bleed: 40 }, 'Sic', '撕咬', 'Your beast leaps on the first foe ahead and bites (×2 of its own), and the foe bleeds.', '你的野兽扑向前方第一个敌人撕咬（其自身 2 倍伤害），并使敌人流血。'),
  T('spike-trap-plus', 'ranger', HU, ['spike-trap'], 'Spike Trap: Mastery', '尖刺陷阱·精通', 'Spike Trap: 2 cells longer, cooldown −4 s.', '尖刺陷阱：长度 +2 格，冷却 −4 秒。', { modifies: { skill: 'spike-trap', range: 2, cooldown: -40 } }),
  T('hunting-ground', 'ranger', HU, ['tripwire'], 'Hunting Ground', '猎场', 'Critical damage +30% against the held, the mired and the stunned.', '攻击被缠住、陷足或眩晕的敌人时，暴击伤害 +30%。', { passive: { when: CAUGHT, critDamage: 0.3 } }),
  T('pack-bond', 'ranger', HU, ['sic'], 'Pack Bond', '兽群羁绊', 'A beast you call has half again its health and strikes 30% harder.', '你召唤的野兽生命 +50%，伤害 +30%。'),
  T('pack-hunter', 'ranger', HU, ['mark-prey'], 'Pack Hunter', '群猎者', 'With a companion near: damage +15%.', '有同伴在身边时，伤害 +15%。', { passive: { when: { companion: true }, damage: 0.15 } }),
  A('killing-field', 'ranger', HU, ['spike-trap-plus', 'pack-bond'], { kind: 'field', leaves: HAZARDS.blast, pattern: 'ring', cooldown: 340 }, 'Killing Field', '杀戮场', 'Lay blast traps in a ring round you: each bursts under the foe that steps on it (fire).', '在你周围布下一圈爆炸陷阱：敌人踩上去就会爆炸（火焰）。', 2),

  // (the Sniper: the kill shot on one arm, the pin and the held breath on the other, the arrow through the heart at the end)
  T('eagle-eye', 'ranger', SN, [], 'Sure Eye', '准星', 'With a bow: critical chance +5%, damage +10%.', '持弓时暴击率 +5%，伤害 +10%。', { passive: { when: OWN, crit: 0.05, damage: 0.1 } }),
  A('deadeye', 'ranger', SN, ['eagle-eye'], { kind: 'shot', missile: 'arrow', cooldown: 160, power: 3.5, range: 7 }, 'Deadeye', '致命一击', 'One arrow, drawn to the ear, at the first foe ahead within 7 cells (×3.5).', '满弓一箭，射向 7 格内的第一个敌人（3.5 倍伤害）。'),
  A('pinning-shot', 'ranger', SN, ['eagle-eye'], { kind: 'shot', missile: 'arrow', cooldown: 140, power: 1.5, range: 7, afflict: 'webbed', ticks: 20 }, 'Pinning Shot', '钉射', 'An arrow that pins the first foe ahead within 7 cells where it stands (×1.5): it is held for 2 s.', '一箭把 7 格内的第一个敌人钉在原地（1.5 倍伤害）：缠住 2 秒。'),
  T('weak-point', 'ranger', SN, ['deadeye'], 'Weak Point', '弱点', 'With a bow, against a foe below half health: critical chance +15%.', '持弓攻击生命低于一半的敌人时，暴击率 +15%。', { passive: { when: { ...OWN, target: { wounded: 0.5 } }, crit: 0.15 } }),
  T('patience', 'ranger', SN, ['deadeye'], 'Patience', '耐心', 'With a bow: each second you stand still, +10% damage, up to +40%.', '持弓时，每站定 1 秒伤害 +10%，最多 +40%。'),
  A('hold-breath', 'ranger', SN, ['pinning-shot'], { kind: 'buff', cooldown: 260, ticks: 50, buff: { crit: 0.25, critDamage: 0.3 } }, 'Hold Breath', '屏息', 'Hold your breath for 5 s: critical chance +25%, critical damage +30%.', '屏住呼吸 5 秒：暴击率 +25%，暴击伤害 +30%。'),
  T('long-shot', 'ranger', SN, ['pinning-shot'], 'Long Shot', '远射', 'With a bow: arrows reach 2 cells farther, and strike 5% harder for each cell they fly beyond the second (up to +40%).', '持弓时射程 +2 格；箭每多飞 1 格（从第 3 格算起）伤害 +5%，最多 +40%。'),
  T('killshot', 'ranger', SN, ['weak-point'], 'Killshot', '绝杀', 'With a bow, against a foe below a quarter of its health: damage +50%.', '持弓攻击生命低于四分之一的敌人时，伤害 +50%。', { passive: { when: { ...OWN, target: { wounded: 0.25 } }, damage: 0.5 } }),
  T('deadeye-plus', 'ranger', SN, ['patience'], 'Deadeye: Mastery', '致命一击·精通', 'Deadeye: damage +1.0×, cooldown −4 s.', '致命一击：伤害 +1.0 倍，冷却 −4 秒。', { modifies: { skill: 'deadeye', power: 1, cooldown: -40 } }),
  T('hold-breath-plus', 'ranger', SN, ['hold-breath'], 'Hold Breath: Mastery', '屏息·精通', 'Hold Breath: 2 s longer, cooldown −5 s.', '屏息：多持续 2 秒，冷却 −5 秒。', { modifies: { skill: 'hold-breath', ticks: 20, cooldown: -50 } }),
  T('pinning-shot-plus', 'ranger', SN, ['long-shot'], 'Pinning Shot: Mastery', '钉射·精通', 'Pinning Shot: holds 1 s longer, damage +0.5×.', '钉射：多缠住 1 秒，伤害 +0.5 倍。', { modifies: { skill: 'pinning-shot', ticks: 10, power: 0.5 } }),
  A('heartseeker', 'ranger', SN, ['deadeye-plus', 'pinning-shot-plus'], { kind: 'pierce', cooldown: 320, power: 3, range: 8, sure: true }, 'Heartseeker', '穿心箭', 'An arrow through every foe in its line, up to 8 cells (×3), each a sure critical.', '一箭贯穿 8 格内直线上的所有敌人（3 倍伤害），必定暴击。', 2),

  // (the Skirmisher: the flit and the gust on one arm, quick arrows on the other, a dance of the gale at the end)
  T('wind-step', 'ranger', SK, [], 'Wind Step', '风步', 'With a bow: movement speed +10%, attack speed +10%.', '持弓时移动速度 +10%，攻击速度 +10%。', { passive: { when: OWN, moveHaste: 0.1, attackHaste: 0.1 } }),
  A('flit', 'ranger', SK, ['wind-step'], { kind: 'blink', cooldown: 60, range: 4 }, 'Flit', '掠影', 'Flit up to 4 cells ahead, through foes.', '向前掠出至多 4 格，可以穿过敌人。'),
  A('arrow-flurry', 'ranger', SK, ['wind-step'], { kind: 'shot', missile: 'arrow', cooldown: 60, power: 0.45, range: 6, count: 4 }, 'Arrow Flurry', '连珠箭', 'Four quick arrows at the first foe ahead within 6 cells (×0.45 each).', '向 6 格内的第一个敌人连射 4 箭（每箭 0.45 倍伤害）。'),
  T('lay-of-the-land', 'ranger', SK, ['flit'], 'Lay of the Land', '熟知地形', 'Movement speed +8%, dodge +8%.', '移动速度 +8%，闪避 +8%。', { passive: { moveHaste: 0.08, dodge: 0.08 } }),
  A('crosswind', 'ranger', SK, ['flit'], { kind: 'nova', cooldown: 140, power: 0.6, range: 2, afflict: 'mired', ticks: 20 }, 'Crosswind', '横风', 'A gust off your bow: every foe within 2 cells is struck (×0.6) and mired for 2 s.', '弓上卷起一阵风：周围 2 格内的敌人受到攻击（0.6 倍伤害）并陷足 2 秒。'),
  T('rapid-fire', 'ranger', SK, ['arrow-flurry'], 'Rapid Fire', '速射', 'With a bow: attack speed +15%.', '持弓时攻击速度 +15%。', { passive: { when: OWN, attackHaste: 0.15 } }),
  A('ricochet', 'ranger', SK, ['arrow-flurry'], { kind: 'chain', cooldown: 100, power: 1.1, range: 6, count: 3 }, 'Ricochet', '跳弹', 'An arrow that strikes the first foe ahead and leaps on to 2 more nearby (×1.1 each).', '一箭射中前方第一个敌人，再弹向附近的另外 2 个（每次 1.1 倍伤害）。'),
  T('flit-plus', 'ranger', SK, ['lay-of-the-land'], 'Flit: Mastery', '掠影·精通', 'Flit: 2 cells farther, cooldown −2 s.', '掠影：距离 +2 格，冷却 −2 秒。', { modifies: { skill: 'flit', range: 2, cooldown: -20 } }),
  T('crosswind-plus', 'ranger', SK, ['crosswind'], 'Crosswind: Mastery', '横风·精通', 'Crosswind: reach +1 cell, mired 1 s longer.', '横风：范围 +1 格，陷足多 1 秒。', { modifies: { skill: 'crosswind', range: 1, ticks: 10 } }),
  T('arrow-flurry-plus', 'ranger', SK, ['rapid-fire'], 'Arrow Flurry: Mastery', '连珠箭·精通', 'Arrow Flurry: 2 more arrows.', '连珠箭：多射 2 箭。', { modifies: { skill: 'arrow-flurry', count: 2 } }),
  T('running-fight', 'ranger', SK, ['ricochet'], 'Running Fight', '游斗', 'With a bow, on the move: damage +15%, critical chance +8%.', '持弓移动中：伤害 +15%，暴击率 +8%。', { passive: { when: { ...OWN, moving: true }, damage: 0.15, crit: 0.08 } }),
  A('gale-dance', 'ranger', SK, ['flit-plus', 'arrow-flurry-plus'], { kind: 'shadow-strike', cooldown: 300, power: 1.2, range: 5, count: 5 }, 'Gale Dance', '疾风之舞', 'Flit to up to five foes within 5 cells, one after another, loosing an arrow into each at arm\'s length (×1.2).', '依次掠到 5 格内至多五个敌人身边，贴身各射一箭（1.2 倍伤害）。', 2),

  // Greenwood Dawn (the Hunter's third): the forest sea's heart, the pack, the net, the birds rising at dawn, the hunt passed on
  T('greenwood-heart', 'ranger', GREENWOOD, [], 'Heart of the Greenwood', '森海之心', 'You and the companions within 6 cells, against your prey: damage +20%, critical chance +10%.', '你和身边 6 格内的同伴攻击猎物时，伤害 +20%，暴击率 +10%。', { passive: { party: true, when: HUNTED, damage: 0.2, crit: 0.1 } }),
  A('the-pack', 'ranger', GREENWOOD, ['greenwood-heart'], { kind: 'summon', creature: SUMMONS.wolf, cooldown: 500, count: 3 }, 'The Pack', '狼群', 'Three wolves answer your howl and fight at your side for 20 s.', '三只狼应你的长嚎而来，在你身边战斗 20 秒。'),
  A('hunting-net', 'ranger', GREENWOOD, ['greenwood-heart'], { kind: 'rain', cooldown: 200, power: 0.5, range: 6, count: 1, radius: 1, afflict: 'webbed', ticks: 30 }, 'Hunting Net', '捕网', 'A net thrown over the 3×3 round the first foe ahead within 6 cells (×0.5): every foe under it is held for 3 s.', '向 6 格内第一个敌人周围 3×3 范围抛出捕网（0.5 倍伤害）：网下的敌人都被缠住 3 秒。'),
  T('feral-instinct', 'ranger', GREENWOOD, ['the-pack'], 'Feral Instinct', '野性本能', 'You and the companions within 6 cells: attack speed +15%, dodge +8%.', '你和身边 6 格内的同伴攻击速度 +15%，闪避 +8%。', { passive: { party: true, attackHaste: 0.15, dodge: 0.08 } }),
  T('hunting-net-plus', 'ranger', GREENWOOD, ['hunting-net'], 'Hunting Net: Mastery', '捕网·精通', 'Hunting Net: the 5×5, cooldown −4 s.', '捕网：范围扩大到 5×5，冷却 −4 秒。', { modifies: { skill: 'hunting-net', radius: 1, cooldown: -40 } }),
  A('dawn-flight', 'ranger', GREENWOOD, ['feral-instinct', 'hunting-net-plus'], { kind: 'nova', cooldown: 420, power: 1.5, range: 4, afflict: 'hunted', ticks: 100 }, 'Dawn Flight', '万鸟飞霞', 'The birds of the forest sea rise like clouds at dawn and fall on your foes: every foe within 4 cells is struck (×1.5) and made your prey for 10 s.', '森海里的鸟像朝霞一样飞起，扑向你的敌人：周围 4 格内的敌人受到攻击（1.5 倍伤害），并成为你的猎物 10 秒。', 2),
  T('lord-of-the-hunt', 'ranger', GREENWOOD, ['dawn-flight'], 'Lord of the Hunt', '狩猎之王', 'Your prey felled by you or a companion passes the mark to the nearest foe within 4 cells, and brings every skill 2 s nearer.', '你或同伴击倒猎物时，猎物的印记会传给 4 格内最近的敌人，你所有技能的冷却缩短 2 秒。', { cost: 2 }),

  // Hawkeye (the Sniper's third): the hawk's sight — as far as the map goes, slower and twice as hard —, the arrow through
  // the sun, the sighted foe, one shot, one kill
  T('hawks-sight', 'ranger', HAWKEYE, [], "Hawk's Sight", '鹰视', 'With a bow: your arrows fly until they strike something, as far as the map goes; you shoot 40% slower, and every arrow strikes twice as hard.', '持弓时，箭一直飞到射中东西为止，射程覆盖整张地图；射速 −40%，伤害翻倍。', { passive: { when: OWN, damage: 1, attackHaste: -0.4 } }),
  A('sunpiercer', 'ranger', HAWKEYE, ['hawks-sight'], { kind: 'pierce', cooldown: 300, power: 5, range: MAP_WIDE }, 'Sunpiercer', '贯日', 'An arrow through every foe in its line, as far as the map goes (×5.0).', '一箭贯穿直线上的所有敌人，一直飞到地图尽头（5.0 倍伤害）。'),
  A('sight-lock', 'ranger', HAWKEYE, ['hawks-sight'], { kind: 'mark', cooldown: 200, range: 20, ticks: 100, buff: { damage: 0.4 } }, 'Sighted', '锁定', 'Sight the nearest foe within 20 cells: for 10 s it takes 40% more from you.', '锁定 20 格内最近的敌人：10 秒内它受到你的伤害 +40%。'),
  T('still-as-stone', 'ranger', HAWKEYE, ['sunpiercer'], 'Still as Stone', '如山', 'With a bow, standing still: damage +20%, critical damage +30%.', '持弓站定时，伤害 +20%，暴击伤害 +30%。', { passive: { when: { ...OWN, standing: true }, damage: 0.2, critDamage: 0.3 } }),
  T('sight-lock-plus', 'ranger', HAWKEYE, ['sight-lock'], 'Sighted: Mastery', '锁定·精通', 'Sighted: 5 s longer, cooldown −5 s.', '锁定：多持续 5 秒，冷却 −5 秒。', { modifies: { skill: 'sight-lock', ticks: 50, cooldown: -50 } }),
  A('one-shot', 'ranger', HAWKEYE, ['still-as-stone', 'sight-lock-plus'], { kind: 'shot', missile: 'arrow', cooldown: 600, power: 10, range: MAP_WIDE, sure: true }, 'One Shot, One Kill', '一箭封喉', 'One arrow at the first foe ahead, as far as the map goes (×10.0), a sure critical.', '一箭射向前方的第一个敌人，一直飞到地图尽头（10.0 倍伤害），必定暴击。', 2),
  T('unblinking', 'ranger', HAWKEYE, ['one-shot'], 'Unblinking', '不瞬', 'From 6 cells or farther, every arrow of your bow is a sure critical.', '在 6 格及以外，你弓上射出的每一箭都必定暴击。', { cost: 2 }),

  // Skywing (the Skirmisher's third): the sky's heart, the wingbeat, the flying feathers, ten thousand feathers falling, a
  // sky no blow can touch
  T('sky-heart', 'ranger', SKYWING, [], 'Heart of the Sky', '苍穹之心', 'With a bow: attack speed +20%, movement speed +10%, dodge +8%; your arrows strike 15% lighter.', '持弓时攻击速度 +20%，移动速度 +10%，闪避 +8%；箭的伤害 −15%。', { passive: { when: OWN, attackHaste: 0.2, moveHaste: 0.1, dodge: 0.08, damage: -0.15 } }),
  A('wingbeat', 'ranger', SKYWING, ['sky-heart'], { kind: 'buff', cooldown: 240, ticks: 50, buff: { attackHaste: 0.3, moveHaste: 0.25 } }, 'Wingbeat', '振翼', 'For 5 s: attack speed +30%, movement speed +25%.', '5 秒内攻击速度 +30%，移动速度 +25%。'),
  A('flying-feathers', 'ranger', SKYWING, ['sky-heart'], { kind: 'multishot', cooldown: 100, power: 0.5, range: 6, count: 5, afflict: 'mired', ticks: 15 }, 'Flying Feathers', '飞羽', 'Five arrows side by side, each striking the first foe in its line (×0.5) and miring it for 1.5 s.', '并排射出 5 支箭，各自命中所在直线上的第一个敌人（0.5 倍伤害），并使其陷足 1.5 秒。'),
  T('ride-the-wind', 'ranger', SKYWING, ['wingbeat'], 'Ride the Wind', '乘风', 'Each arrow of your bow that lands brings every skill 0.3 s nearer.', '你弓上射出的每一箭命中时，所有技能的冷却缩短 0.3 秒。'),
  T('flying-feathers-plus', 'ranger', SKYWING, ['flying-feathers'], 'Flying Feathers: Mastery', '飞羽·精通', 'Flying Feathers: 2 more arrows, cooldown −2 s.', '飞羽：多射 2 支箭，冷却 −2 秒。', { modifies: { skill: 'flying-feathers', count: 2, cooldown: -20 } }),
  A('falling-feathers', 'ranger', SKYWING, ['ride-the-wind', 'flying-feathers-plus'], { kind: 'rain', missile: 'arrow', pattern: 'around', cooldown: 420, power: 0.6, count: 5, radius: 2, ticks: 50, buff: { dodge: 0.3, moveHaste: 0.2 } }, 'Ten Thousand Feathers', '万羽天坠', 'Arrows fall like feathers on the 5×5 round you, once a second for 5 s (×0.6 each); for those 5 s you dodge 30% more and move 20% faster.', '箭像羽毛一样落在你周围 5×5 范围，每秒一轮，持续 5 秒（每轮 0.6 倍伤害）；这 5 秒内你闪避 +30%，移动速度 +20%。', 2),
  T('sky-walker', 'ranger', SKYWING, ['falling-feathers'], 'Sky Walker', '天行者', 'Each blow you dodge brings every skill 1 s nearer, and your next blow is a sure critical.', '每闪避一次攻击，你所有技能的冷却缩短 1 秒，下一击必定暴击。', { cost: 2 }),

  // the first tree's four more
  A('volley', 'ranger', {}, ['ranger-archery'], { kind: 'rain', missile: 'arrow', cooldown: 90, power: 1, range: 6, count: 1 }, 'Volley', '齐射', 'One volley on the 3×3 round the first foe ahead (×1.0).', '向前方第一个敌人周围 3×3 范围齐射一轮（1.0 倍伤害）。'),
  A('disengage', 'ranger', {}, ['fleet-archer'], { kind: 'leap-shot', cooldown: 140, power: 0.8, range: 6, count: 3, afflict: 'mired', ticks: 30 }, 'Disengage', '脱身', 'Leap 3 cells back and loose an arrow ahead (×0.8) that mires the foe it strikes.', '向后跃 3 格，同时向前射出一箭（0.8 倍伤害），使命中的敌人陷足。'),
  T('keen-arrows', 'ranger', {}, ['steady-aim'], 'Keen Arrows', '锐箭', 'With a bow: critical damage +15%.', '持弓时暴击伤害 +15%。', { passive: { when: OWN, critDamage: 0.15 } }),
  T('fleet-foot', 'ranger', {}, ['fleet-archer'], 'Fleet Foot', '疾足', 'Movement speed +5%, dodge +5%.', '移动速度 +5%，闪避 +5%。', { passive: { moveHaste: 0.05, dodge: 0.05 } }),
]

// --- the mage (2026-11-05: a path an element, each with a third of its own)
const CR = { path: 'cryomancer' }
const PY = { path: 'pyromancer' }
const ST = { path: 'stormcaller' }
/** Each path's third its own: Everwinter, Worldfire, Wrath of Heaven. */
const WINTER = { path: 'cryomancer', tier: 3 }
const WORLDFIRE = { path: 'pyromancer', tier: 3 }
const WRATH = { path: 'stormcaller', tier: 3 }
const FROZEN = { target: { status: ['frozen'] } }
const BURNING = { target: { status: ['burning'] } }
const SHOCKED = { target: { status: ['electrified'] } }
const MAGE: SkillDef[] = [
  // (the Cryomancer: the lance and the shatter on one arm, the prison and the frozen ground on the other, a blizzard at the end)
  T('rime', 'mage', CR, [], 'Rime', '霜寒', 'Damage +30% against the frozen.', '对冰冻中的敌人伤害 +30%。', { passive: { when: { target: { status: ['frozen'] } }, damage: 0.3 } }),
  A('ice-lance', 'mage', CR, ['rime'], { kind: 'pierce', element: 'ice', cooldown: 110, power: 1.6, range: 6, afflict: 'frozen', ticks: 10, missile: 'ice' }, 'Ice Lance', '冰枪', 'A lance of ice through every foe in its line (×1.6), freezing each for 1 s.', '一道冰枪贯穿直线上的所有敌人（1.6 倍伤害），并各冻结 1 秒。'),
  A('glacial-prison', 'mage', CR, ['rime'], { kind: 'shot', element: 'ice', cooldown: 220, power: 0.5, range: 6, afflict: 'frozen', ticks: 40 }, 'Glacial Prison', '冰牢', 'Freeze the first foe ahead solid for 4 s (×0.5).', '将前方第一个敌人冻成冰块 4 秒（0.5 倍伤害）。'),
  A('ice-spikes', 'mage', CR, ['ice-lance'], { kind: 'quake', element: 'ice', cooldown: 120, power: 1.3, afflict: 'frozen', ticks: 10 }, 'Ice Spikes', '冰刺', 'Spikes of ice burst from the ground on the 3×3 two cells ahead (×1.3), freezing each struck for 1 s.', '前方两格处的 3×3 范围冒出冰刺（1.3 倍伤害），被刺中的敌人冻结 1 秒。'),
  T('shatter', 'mage', CR, ['ice-lance'], 'Shatter', '碎冰', 'A blow on the frozen breaks the ice and deals double.', '攻击冰冻中的敌人会打碎冰块，造成双倍伤害。'),
  T('frost-armour', 'mage', CR, ['glacial-prison'], 'Frost Armour', '霜甲', 'Whoever strikes you hand to hand is frozen a moment, one time in five.', '近身击中你的敌人有五分之一的几率被短暂冻结。'),
  A('frozen-ground', 'mage', CR, ['glacial-prison'], { kind: 'field', leaves: HAZARDS.frost, pattern: 'square', cooldown: 180 }, 'Frozen Ground', '冻土', 'The 3×3 two cells ahead freezes over for 6 s: a foe who walks onto it is frozen for 1 s.', '前方两格处的 3×3 范围冻成冰面，持续 6 秒：走上去的敌人冻结 1 秒。'),
  T('permafrost', 'mage', CR, ['ice-spikes'], 'Permafrost', '永冻', 'What you freeze stays frozen half again as long.', '你造成的冰冻持续时间 +50%。'),
  T('ice-lance-plus', 'mage', CR, ['shatter'], 'Ice Lance: Mastery', '冰枪·精通', 'Ice Lance: reach +2 cells, damage +0.4×.', '冰枪：距离 +2 格，伤害 +0.4 倍。', { modifies: { skill: 'ice-lance', range: 2, power: 0.4 } }),
  T('deep-chill', 'mage', CR, ['frost-armour'], 'Deep Chill', '彻骨', 'Critical chance +15% against the frozen.', '攻击冰冻中的敌人时暴击率 +15%。', { passive: { when: FROZEN, crit: 0.15 } }),
  T('frozen-ground-plus', 'mage', CR, ['frozen-ground'], 'Frozen Ground: Mastery', '冻土·精通', 'Frozen Ground: cooldown −6 s.', '冻土：冷却 −6 秒。', { modifies: { skill: 'frozen-ground', cooldown: -60 } }),
  A('blizzard', 'mage', CR, ['ice-lance-plus', 'deep-chill'], { kind: 'rain', element: 'ice', pattern: 'around', cooldown: 380, power: 0.6, count: 5, radius: 2, afflict: 'frozen', ticks: 10 }, 'Blizzard', '暴风雪', 'Ice falls on the 5×5 round you, once a second for 5 s (×0.6 each), freezing.', '在你周围 5×5 范围降下冰雹，每秒一轮，持续 5 秒（每轮 0.6 倍伤害），并冻结敌人。', 2),

  // (the Pyromancer: the wall and the breath on one arm, the burst and the great bolt on the other, an inferno at the end)
  T('kindling', 'mage', PY, [], 'Kindling', '引燃', 'Your fire sets the struck burning one time in three.', '你的火焰有三分之一的几率点燃目标。'),
  A('flame-wall', 'mage', PY, ['kindling'], { kind: 'field', leaves: HAZARDS.flame, pattern: 'line', range: 5, cooldown: 180 }, 'Flame Wall', '火墙', 'Flames down the 5 cells ahead for 5 s: a foe who walks into them burns.', '在前方 5 格燃起火墙，持续 5 秒：走进去的敌人会着火。'),
  A('combustion', 'mage', PY, ['kindling'], { kind: 'detonate', status: 'burning', cooldown: 180, power: 2.5, range: 5 }, 'Combustion', '自燃', 'Every burning foe within 5 cells bursts (×2.5): the fire in it is spent.', '5 格内所有着火的敌人爆燃（2.5 倍伤害），身上的火就此烧尽。'),
  A('dragons-breath', 'mage', PY, ['flame-wall'], { kind: 'pierce', element: 'fire', range: 4, cooldown: 120, power: 1.4, afflict: 'burning', ticks: 30 }, "Dragon's Breath", '龙息', 'Breathe fire down the 4 cells ahead: every foe in the line is struck (×1.4) and set burning.', '向前方 4 格喷出火焰：直线上的敌人都受到攻击（1.4 倍伤害）并着火。'),
  T('conflagration', 'mage', PY, ['flame-wall'], 'Conflagration', '燎原', 'Damage +25% against the burning.', '对着火的敌人伤害 +25%。', { passive: { when: { target: { status: ['burning'] } }, damage: 0.25 } }),
  T('ember-heart', 'mage', PY, ['combustion'], 'Ember Heart', '余烬之心', 'Fire skills rest 20% less.', '火焰技能冷却 −20%。'),
  A('pyroblast', 'mage', PY, ['combustion'], { kind: 'shot', element: 'fire', range: 6, cooldown: 150, power: 3 }, 'Pyroblast', '炎爆术', 'A great bolt of fire at the first foe ahead within 6 cells (×3.0).', '向 6 格内的第一个敌人射出一团巨大的火球（3.0 倍伤害）。'),
  T('wildfire', 'mage', PY, ['dragons-breath'], 'Wildfire', '野火', 'A burning foe you fell spreads its fire: every foe within 2 cells is struck lightly (×0.3) and set burning.', '你击倒着火的敌人时，火会烧开：2 格内的敌人受到轻微攻击（0.3 倍伤害）并着火。'),
  T('flame-wall-plus', 'mage', PY, ['conflagration'], 'Flame Wall: Mastery', '火墙·精通', 'Flame Wall: 2 cells longer, cooldown −4 s.', '火墙：长度 +2 格，冷却 −4 秒。', { modifies: { skill: 'flame-wall', range: 2, cooldown: -40 } }),
  T('combustion-plus', 'mage', PY, ['ember-heart'], 'Combustion: Mastery', '自燃·精通', 'Combustion: reach +2 cells, damage +0.5×.', '自燃：范围 +2 格，伤害 +0.5 倍。', { modifies: { skill: 'combustion', range: 2, power: 0.5 } }),
  T('searing', 'mage', PY, ['pyroblast'], 'Searing', '炽焰', 'Critical chance +10% against the burning.', '攻击着火的敌人时暴击率 +10%。', { passive: { when: BURNING, crit: 0.1 } }),
  A('inferno', 'mage', PY, ['flame-wall-plus', 'searing'], { kind: 'rain', element: 'fire', cooldown: 360, power: 0.9, range: 5, count: 4, radius: 2 }, 'Inferno', '炼狱', 'Fire falls on the 5×5 round the first foe ahead, once a second for 4 s (×0.9 each).', '在前方第一个敌人周围 5×5 范围降下烈火，每秒一轮，持续 4 秒（每轮 0.9 倍伤害）。', 2),

  // (the Stormcaller: the bolt and the spear on one arm, the thunderclap and the lightning's step on the other, a prison of
  // lightning at the end)
  T('static', 'mage', ST, [], 'Static', '静电', 'Your lightning electrifies the struck one time in four (held a moment).', '你的雷电有四分之一的几率让目标感电（短暂定住）。'),
  A('lightning-bolt', 'mage', ST, ['static'], { kind: 'shot', element: 'lightning', range: 6, cooldown: 80, power: 2 }, 'Lightning Bolt', '落雷', 'A bolt of lightning on the first foe ahead within 6 cells (×2.0).', '一道落雷劈向 6 格内的第一个敌人（2.0 倍伤害）。'),
  A('thunderclap', 'mage', ST, ['static'], { kind: 'nova', element: 'lightning', range: 2, cooldown: 140, power: 0.9, afflict: 'electrified', ticks: 10 }, 'Thunderclap', '雷震', 'Thunder breaks round you: every foe within 2 cells is struck (×0.9) and electrified for 1 s.', '你周围炸响一声雷：2 格内的敌人受到攻击（0.9 倍伤害）并感电 1 秒。'),
  A('thunder-spear', 'mage', ST, ['lightning-bolt'], { kind: 'pierce', element: 'lightning', range: 6, cooldown: 110, power: 1.5 }, 'Thunder Spear', '雷枪', 'A spear of lightning through every foe in its line, up to 6 cells (×1.5).', '一道雷枪贯穿 6 格内直线上的所有敌人（1.5 倍伤害）。'),
  T('overload', 'mage', ST, ['lightning-bolt'], 'Overload', '过载', 'Damage +25% against the electrified.', '对感电中的敌人伤害 +25%。', { passive: { when: SHOCKED, damage: 0.25 } }),
  A('lightning-step', 'mage', ST, ['thunderclap'], { kind: 'dash-strike', element: 'lightning', range: 4, cooldown: 120, power: 1.2 }, 'Lightning Step', '雷步', 'Become lightning and pass up to 4 cells ahead, striking every foe on the way (×1.2).', '化作一道雷光向前穿过至多 4 格，沿途的敌人都受到攻击（1.2 倍伤害）。'),
  T('quickening', 'mage', ST, ['thunderclap'], 'Quickening', '迅雷', 'Attack speed +10%, movement speed +8%.', '攻击速度 +10%，移动速度 +8%。', { passive: { attackHaste: 0.1, moveHaste: 0.08 } }),
  T('thunder-spear-plus', 'mage', ST, ['thunder-spear'], 'Thunder Spear: Mastery', '雷枪·精通', 'Thunder Spear: reach +2 cells, damage +0.4×.', '雷枪：距离 +2 格，伤害 +0.4 倍。', { modifies: { skill: 'thunder-spear', range: 2, power: 0.4 } }),
  T('high-voltage', 'mage', ST, ['overload'], 'High Voltage', '高压', 'Critical chance +15% against the electrified.', '攻击感电中的敌人时暴击率 +15%。', { passive: { when: SHOCKED, crit: 0.15 } }),
  T('lightning-step-plus', 'mage', ST, ['lightning-step'], 'Lightning Step: Mastery', '雷步·精通', 'Lightning Step: 2 cells farther, cooldown −3 s.', '雷步：距离 +2 格，冷却 −3 秒。', { modifies: { skill: 'lightning-step', range: 2, cooldown: -30 } }),
  T('storm-spirit', 'mage', ST, ['quickening'], 'Storm Spirit', '雷灵', 'Lightning skills rest 20% less.', '雷电技能冷却 −20%。'),
  A('thunder-prison', 'mage', ST, ['thunder-spear-plus', 'storm-spirit'], { kind: 'rain', element: 'lightning', range: 6, cooldown: 380, power: 0.9, count: 5, radius: 2, afflict: 'electrified', ticks: 5 }, 'Thunder Prison', '雷狱', 'Lightning cages the 5×5 round the first foe ahead, once a second for 5 s (×0.9 each), electrifying.', '雷电把前方第一个敌人周围 5×5 范围围成牢笼，每秒一轮，持续 5 秒（每轮 0.9 倍伤害），并让敌人感电。', 2),

  // Everwinter (the Cryomancer's third): a heart of winter, the glacier, the cold wave, a winter without end, time stilled
  T('heart-of-winter', 'mage', WINTER, [], 'Heart of Winter', '冬之心', 'Your ice skills strike 20% harder.', '你的冰霜技能伤害 +20%。'),
  A('glacier', 'mage', WINTER, ['heart-of-winter'], { kind: 'slam', element: 'ice', range: 5, cooldown: 220, power: 2, afflict: 'frozen', ticks: 15 }, 'Glacier', '冰川', 'A glacier slides down the 5×3 ahead (×2.0), freezing each struck for 1.5 s.', '一道冰川沿前方 5×3 范围推过去（2.0 倍伤害），被推到的敌人冻结 1.5 秒。'),
  A('cold-wave', 'mage', WINTER, ['heart-of-winter'], { kind: 'nova', element: 'ice', range: 3, cooldown: 200, power: 1, afflict: 'frozen', ticks: 20 }, 'Cold Wave', '寒潮', 'Cold rolls out from you: every foe within 3 cells is struck (×1.0) and frozen for 2 s.', '寒气从你身上涌出：3 格内的敌人受到攻击（1.0 倍伤害）并冻结 2 秒。'),
  T('frostbite', 'mage', WINTER, ['glacier'], 'Frostbite', '霜噬', 'Each blow on the frozen draws back 2 health.', '每次击中冰冻中的敌人，吸取 2 点生命。', { passive: { when: FROZEN, drain: 2 } }),
  T('cold-wave-plus', 'mage', WINTER, ['cold-wave'], 'Cold Wave: Mastery', '寒潮·精通', 'Cold Wave: reach +1 cell, cooldown −5 s.', '寒潮：范围 +1 格，冷却 −5 秒。', { modifies: { skill: 'cold-wave', range: 1, cooldown: -50 } }),
  A('endless-winter', 'mage', WINTER, ['frostbite', 'cold-wave-plus'], { kind: 'rain', element: 'ice', pattern: 'around', cooldown: 480, power: 0.8, count: 6, radius: 3, afflict: 'frozen', ticks: 10 }, 'Endless Winter', '永冬降临', 'Winter falls on the 7×7 round you, once a second for 6 s (×0.8 each), freezing.', '冬天降临在你周围 7×7 范围，每秒一轮，持续 6 秒（每轮 0.8 倍伤害），并冻结敌人。', 2),
  T('still-time', 'mage', WINTER, ['endless-winter'], 'Still Time', '凝时', 'A Shatter deals triple instead of double, and each brings every skill 1 s nearer.', '碎冰改为造成三倍伤害，每次碎冰让所有技能的冷却缩短 1 秒。', { cost: 2 }),

  // Worldfire (the Pyromancer's third): a heart of fire, the body set alight, the earth scorched, the fire that ends a world
  T('kalpa-heart', 'mage', WORLDFIRE, [], 'Heart of the Worldfire', '劫火之心', 'Your fire skills strike 20% harder.', '你的火焰技能伤害 +20%。'),
  A('immolate', 'mage', WORLDFIRE, ['kalpa-heart'], { kind: 'buff', cooldown: 300, ticks: 80, buff: { damage: 0.2 } }, 'Immolate', '焚身', 'Wreathe yourself in fire for 8 s: damage +20%, and whoever strikes you hand to hand catches fire.', '让火焰裹住自己 8 秒：伤害 +20%，近身击中你的敌人会着火。'),
  A('scorched-earth', 'mage', WORLDFIRE, ['kalpa-heart'], { kind: 'slam', element: 'fire', range: 5, cooldown: 220, power: 2, afflict: 'burning', ticks: 30 }, 'Scorched Earth', '焚原', 'Fire rolls down the 5×3 ahead (×2.0), setting every foe it reaches burning.', '烈火沿前方 5×3 范围卷过去（2.0 倍伤害），烧到的敌人都着火。'),
  T('burnout', 'mage', WORLDFIRE, ['immolate'], 'Burnout', '燃尽', 'Combustion no longer spends the fire: the foes it bursts go on burning.', '自燃不再烧尽敌人身上的火：被引爆的敌人继续燃烧。'),
  T('scorched-earth-plus', 'mage', WORLDFIRE, ['scorched-earth'], 'Scorched Earth: Mastery', '焚原·精通', 'Scorched Earth: 2 cells deeper, damage +0.4×.', '焚原：距离 +2 格，伤害 +0.4 倍。', { modifies: { skill: 'scorched-earth', range: 2, power: 0.4 } }),
  A('worldfire', 'mage', WORLDFIRE, ['burnout', 'scorched-earth-plus'], { kind: 'fireball', element: 'fire', range: 6, radius: 3, cooldown: 480, power: 3.5, afflict: 'burning', ticks: 40 }, 'Worldfire', '劫火燎原', 'The fire that ends a world falls on the first foe ahead within 6 cells: the 7×7 round it burns (×3.5).', '终结一个世界的火落在 6 格内的第一个敌人身上：它周围 7×7 范围都烧起来（3.5 倍伤害）。', 2),
  T('all-is-kindling', 'mage', WORLDFIRE, ['worldfire'], 'All Is Kindling', '万物为薪', 'Each foe that falls to you burning brings every skill 2 s nearer.', '每有一个着火的敌人被你击倒，所有技能的冷却缩短 2 秒。', { cost: 2 }),

  // Wrath of Heaven (the Stormcaller's third): heaven's might, the bolt of judgement, a shroud of thunder, the storm without end
  T('heavens-might', 'mage', WRATH, [], "Heaven's Might", '天威', 'Your lightning skills strike 20% harder.', '你的雷电技能伤害 +20%。'),
  A('judgement-bolt', 'mage', WRATH, ['heavens-might'], { kind: 'shot', element: 'lightning', range: 7, cooldown: 240, power: 4, sure: true }, 'Bolt of Judgement', '天雷', 'A bolt from heaven on the first foe ahead within 7 cells (×4.0), a sure critical.', '一道天雷劈在 7 格内的第一个敌人身上（4.0 倍伤害），必定暴击。'),
  A('thunder-shroud', 'mage', WRATH, ['heavens-might'], { kind: 'buff', cooldown: 300, ticks: 80, buff: { attackHaste: 0.2, dodge: 0.1 } }, 'Thunder Shroud', '雷霆护体', 'For 8 s: attack speed +20%, dodge +10%, and whoever strikes you hand to hand is electrified.', '8 秒内攻击速度 +20%，闪避 +10%，近身击中你的敌人会感电。'),
  T('thunderstrike', 'mage', WRATH, ['judgement-bolt'], 'Thunderstrike', '雷殛', 'Every critical you strike electrifies the struck.', '你的每次暴击都会让目标感电。'),
  T('thunder-shroud-plus', 'mage', WRATH, ['thunder-shroud'], 'Thunder Shroud: Mastery', '雷霆护体·精通', 'Thunder Shroud: 3 s longer, cooldown −5 s.', '雷霆护体：多持续 3 秒，冷却 −5 秒。', { modifies: { skill: 'thunder-shroud', ticks: 30, cooldown: -50 } }),
  A('wrath-of-heaven', 'mage', WRATH, ['thunderstrike', 'thunder-shroud-plus'], { kind: 'rain', element: 'lightning', pattern: 'around', cooldown: 480, power: 1.2, count: 4, radius: 3, afflict: 'electrified', ticks: 5 }, 'Wrath of Heaven', '天罚降临', "Heaven's wrath falls on the 7×7 round you, once a second for 4 s (×1.2 each), electrifying.", '天罚降在你周围 7×7 范围，每秒一轮，持续 4 秒（每轮 1.2 倍伤害），并让敌人感电。', 2),
  T('storm-unending', 'mage', WRATH, ['wrath-of-heaven'], 'Storm Unending', '九天雷动', 'Each lightning skill you cast brings every other skill 1 s nearer.', '每施放一个雷电技能，其他所有技能的冷却缩短 1 秒。', { cost: 2 }),

  A('arcane-missiles', 'mage', {}, ['mage-focus'], { kind: 'shot', cooldown: 60, power: 0.6, range: 5, count: 3 }, 'Arcane Missiles', '奥术飞弹', 'Three bolts at the first foe ahead (×0.6 each).', '向前方第一个敌人连射三发飞弹（每发 0.6 倍伤害）。'),
  A('mana-ward', 'mage', {}, ['mana-shield'], { kind: 'ward', cooldown: 300, power: 0.3, ticks: 60 }, 'Mana Ward', '法力结界', 'A ward that takes the next 30% of your max health in harm before you do, for 6 s.', '一道结界，6 秒内替你承受至多 30% 生命上限的伤害。'),
  T('focus', 'mage', {}, ['mage-focus'], 'Focus', '凝神', 'Every skill\'s cooldown −5%.', '所有技能冷却 −5%。', { grant: { cdr: 0.05 } }),
  T('spell-power', 'mage', {}, ['elemental-attunement'], 'Spell Power', '法术强化', 'Active skills strike 10% harder.', '主动技能伤害 +10%。', { passive: { skillDamage: 0.1 } }),
]

// --- the swordsman (2026-11-03): three paths, each with a third of its own
const SS = { path: 'swordsaint' }
const SC = { path: 'sacrificer' }
const SB = { path: 'spellblade' }
const SHEART = { path: 'swordsaint', tier: 3 }
const AVATAR = { path: 'sacrificer', tier: 3 }
const SDEMON = { path: 'spellblade', tier: 3 }
const SWORDSMAN: SkillDef[] = [
  // (the Sword Saint: the draw and the cut on one arm, the dance of the blade and the feet on the other, one flash at the end)
  T('iaido-stance', 'swordsman', SS, [], 'Iaido Stance', '居合之心', 'Standing your ground (no step this second) with a katana: damage +30%.', '站定不动满 1 秒、持太刀时，伤害 +30%。', { passive: { when: { standing: true, weapon: 'own' }, damage: 0.3 } }),
  A('iaido', 'swordsman', SS, ['iaido-stance'], { kind: 'dash-strike', cooldown: 120, power: 2.2, range: 4 }, 'Iaido', '拔刀斩', 'One flash of the drawn blade: through the foes in up to 4 cells ahead, each you pass struck (×2.2).', '拔刀一闪：穿过前方最多 4 格的敌人，沿途每个敌人受到攻击（2.2 倍伤害）。'),
  A('phantom-sword-dance', 'swordsman', SS, ['iaido-stance'], { kind: 'arc', cooldown: 180, power: 0.7, count: 5 }, 'Phantom Sword Dance', '幻影剑舞', 'Phantom blades beside yours: five cuts across the three cells ahead (×0.7 each).', '化出剑影，对前方 3 格连斩五刀（每刀 0.7 倍伤害）。'),
  A('swallow-return', 'swordsman', SS, ['iaido'], { kind: 'dash-strike', cooldown: 160, power: 1.6, range: 3, count: 2 }, 'Swallow Return', '燕返', 'A cut forward through the foes, then back the way you came, as a swallow turns (×1.6 each way).', '向前斩出一刀，再像燕子回身一样斩回来（来回各 1.6 倍伤害）。'),
  T('zanshin', 'swordsman', SS, ['iaido'], 'Zanshin', '残心', 'With a katana, against a foe at half its health or less: critical chance +20%.', '持太刀攻击生命不高于一半的敌人时，暴击率 +20%。', { passive: { when: { weapon: 'own', target: { wounded: 0.5 } }, crit: 0.2 } }),
  T('flowing-water', 'swordsman', SS, ['phantom-sword-dance'], 'Flowing Water', '流水', 'On the move (a step this second): attack speed +15%, dodge +6%.', '移动中（这一秒内走过一步）攻击速度 +15%，闪避 +6%。', { passive: { when: { moving: true }, attackHaste: 0.15, dodge: 0.06 } }),
  A('flash-step', 'swordsman', SS, ['phantom-sword-dance'], { kind: 'blink', cooldown: 100, range: 4 }, 'Shukuchi', '缩地', 'One step that covers up to 4 cells ahead.', '一步踏出，最多 4 格。'),
  T('swallow-plus', 'swordsman', SS, ['swallow-return'], 'Swallow Return: Mastery', '燕返·精通', 'Swallow Return: once more there and back, cooldown −2 s.', '燕返：多来回一次，冷却 −2 秒。', { modifies: { skill: 'swallow-return', count: 1, cooldown: -20 } }),
  T('iaido-plus', 'swordsman', SS, ['zanshin'], 'Iaido: Mastery', '拔刀斩·精通', 'Iaido: power +0.5, cooldown −3 s.', '拔刀斩：伤害倍率 +0.5，冷却 −3 秒。', { modifies: { skill: 'iaido', power: 0.5, cooldown: -30 } }),
  T('dance-plus', 'swordsman', SS, ['flowing-water'], 'Phantom Sword Dance: Mastery', '幻影剑舞·精通', 'Phantom Sword Dance: two cuts more.', '幻影剑舞：多斩两刀。', { modifies: { skill: 'phantom-sword-dance', count: 2 } }),
  T('wind-blade', 'swordsman', SS, ['flash-step'], 'Wind Blade', '风之刃', 'With a katana: critical damage +25%.', '持太刀时暴击伤害 +25%。', { passive: { when: OWN, critDamage: 0.25 } }),
  A('issen', 'swordsman', SS, ['iaido-plus', 'dance-plus'], { kind: 'slam', cooldown: 360, power: 3, range: 6, sure: true }, 'Issen', '一闪', 'One flash: everything in the 6 cells ahead, three wide, is cut (×3), a sure critical.', '一闪：斩开前方 6 格、3 格宽的一切（3 倍伤害），必定暴击。', 2),

  // Sword Heart (the Sword Saint's third): the still mind, the cut through the air, the draw farther, ten thousand swords
  T('sword-heart', 'swordsman', SHEART, [], 'Sword Heart', '剑心通明', 'With a katana: critical chance +10%, critical damage +20%.', '持太刀时暴击率 +10%，暴击伤害 +20%。', { passive: { when: OWN, crit: 0.1, critDamage: 0.2 } }),
  A('mirror-stance', 'swordsman', SHEART, ['sword-heart'], { kind: 'buff', cooldown: 300, ticks: 40, buff: { front: 0.6, crit: 0.2 } }, 'Still Water', '明镜止水', 'For 4 s: six blows in ten from the way you face are turned aside, critical chance +20%.', '4 秒内来自正面的攻击六成被格开，暴击率 +20%。'),
  A('void-slash', 'swordsman', SHEART, ['sword-heart'], { kind: 'pierce', missile: 'wave', cooldown: 140, power: 2, range: 6 }, 'Void Slash', '空斩', 'A cut that leaves the blade and flies: through every foe in its line, up to 6 cells (×2.0).', '一刀斩出剑气，贯穿直线上 6 格内的所有敌人（2.0 倍伤害）。'),
  T('no-mind', 'swordsman', SHEART, ['mirror-stance'], 'No Mind', '无念', 'Standing your ground (no step this second): critical chance +10%, skills rest 10% less.', '站定不动满 1 秒时，暴击率 +10%，技能冷却 −10%。', { passive: { when: { standing: true }, crit: 0.1, cdr: 0.1 } }),
  T('iaido-mastery', 'swordsman', SHEART, ['void-slash'], 'Iaido: Perfection', '拔刀斩·极', 'Iaido: 2 cells farther, and back again with a second cut.', '拔刀斩：多 2 格，并折回再斩一次。', { modifies: { skill: 'iaido', range: 2, count: 1 } }),
  A('ten-thousand-swords', 'swordsman', SHEART, ['no-mind', 'iaido-mastery'], { kind: 'rain', pattern: 'around', missile: 'knife', cooldown: 400, power: 1, count: 4, radius: 2 }, 'Ten Thousand Swords', '万剑归宗', 'Swords rain on the 5×5 round you, once a second for 4 s (×1.0 each).', '你周围 5×5 落下剑雨，每秒一轮，持续 4 秒（每轮 1.0 倍伤害）。', 2),
  T('sword-god', 'swordsman', SHEART, ['ten-thousand-swords'], 'Sword God', '剑神', 'With a katana: damage +25%, attack speed +15%.', '持太刀时伤害 +25%，攻击速度 +15%。', { passive: { when: OWN, damage: 0.25, attackHaste: 0.15 }, cost: 2 }),

  // (the Sacrificer: "suffering brings one near to god" taken at its word — health paid on one arm, blood drunk on the other, a sixth suffering at the end)
  T('pain-pact', 'swordsman', SC, [], 'Pain Pact', '痛苦契约', 'With a katana: the more you are hurt, the harder you cut, up to +40% at the last of your health.', '持太刀时受伤越重，伤害越高：生命将尽时最多 +40%。'),
  A('blood-offering', 'swordsman', SC, ['pain-pact'], { kind: 'buff', cost: 0.2, cooldown: 300, ticks: 80, buff: { damage: 0.5, crit: 0.1 } }, 'Blood Offering', '血祭', 'Pay 20% of your health: for 8 s damage +50%, critical chance +10%.', '付出 20% 生命：8 秒内伤害 +50%，暴击率 +10%。'),
  A('crimson-whirl', 'swordsman', SC, ['pain-pact'], { kind: 'whirlwind', cooldown: 120, power: 0.9, count: 2, bleed: 40 }, 'Crimson Whirl', '血旋', 'Turn twice where you stand: every foe round you is cut twice (×0.9 each) and bleeds.', '原地旋身两圈：周围的敌人各受到两次攻击（每次 0.9 倍伤害）并流血。'),
  A('rending-sacrifice', 'swordsman', SC, ['blood-offering'], { kind: 'arc', cost: 0.1, cooldown: 140, power: 3 }, 'Rending Sacrifice', '舍身斩', 'Pay 10% of your health: one cut across the three cells ahead (×3.0).', '付出 10% 生命：横斩前方 3 格（3.0 倍伤害）。'),
  T('agony', 'swordsman', SC, ['blood-offering'], 'Agony', '苦痛', 'Each blow you take is a stack of agony (ten at most, 5 s): each stack, damage +3%.', '每受到一次伤害，获得 1 层苦痛（最多 10 层，持续 5 秒）；每层伤害 +3%。'),
  T('blood-drinker', 'swordsman', SC, ['crimson-whirl'], 'Blood Drinker', '饮血', 'At half your health or less: each blow that lands draws back 2 health.', '生命不高于一半时，每次命中吸取 2 点生命。', { passive: { when: { wounded: 0.5 }, drain: 2 } }),
  A('frenzy', 'swordsman', SC, ['crimson-whirl'], { kind: 'buff', cooldown: 260, ticks: 60, buff: { attackHaste: 0.3, moveHaste: 0.15, taken: 0.15 } }, 'Frenzy', '狂乱', 'For 6 s: attack speed +30%, movement speed +15%, but you take 15% more.', '6 秒内攻击速度 +30%，移动速度 +15%，但受到的伤害 +15%。'),
  T('numbness', 'swordsman', SC, ['rending-sacrifice'], 'Numbness', '痛觉麻痹', 'At half your health or less: combat damage taken −20%.', '生命不高于一半时，受到的战斗伤害 −20%。', { passive: { when: { wounded: 0.5 }, taken: -0.2 } }),
  T('offering-plus', 'swordsman', SC, ['agony'], 'Blood Offering: Mastery', '血祭·精通', 'Blood Offering: 3 s longer.', '血祭：多持续 3 秒。', { modifies: { skill: 'blood-offering', ticks: 30 } }),
  T('undying-rage', 'swordsman', SC, ['blood-drinker'], 'Undying Rage', '不死之怒', 'At a fifth of your health or less: mend 2 health a second.', '生命不高于两成时，每秒恢复 2 点生命。', { passive: { when: { wounded: 0.2 }, regen: 2 } }),
  T('crimson-whirl-plus', 'swordsman', SC, ['frenzy'], 'Crimson Whirl: Mastery', '血旋·精通', 'Crimson Whirl: one turn more.', '血旋：多转一圈。', { modifies: { skill: 'crimson-whirl', count: 1 } }),
  A('sixth-suffering', 'swordsman', SC, ['offering-plus', 'undying-rage'], { kind: 'buff', cost: 0.3, cooldown: 480, ticks: 80, buff: { damage: 0.6, attackHaste: 0.25, drain: 3 } }, 'The Sixth Suffering', '第六苦', 'A suffering past the Five, laid on yourself: pay 30% of your health, and for 8 s damage +60%, attack speed +25%, each blow that lands drawing back 3.', '给自己加上五苦之外的一苦，付出 30% 生命：8 秒内伤害 +60%，攻击速度 +25%，每次命中吸取 3 点生命。', 2),

  // Mad Martyr (the Sacrificer's third): flesh given to the blade, the pain spread, the last offering, a body that will not fall
  T('pain-vessel', 'swordsman', AVATAR, [], 'Vessel of Pain', '痛之容器', 'At half your health or less: damage +20%, critical chance +10%.', '生命不高于一半时伤害 +20%，暴击率 +10%。', { passive: { when: { wounded: 0.5 }, damage: 0.2, crit: 0.1 } }),
  A('flesh-for-blade', 'swordsman', AVATAR, ['pain-vessel'], { kind: 'buff', cost: 0.1, cooldown: 240, ticks: 60, buff: { skillDamage: 0.5 } }, 'Flesh for the Blade', '血肉献刃', 'Pay 10% of your health: for 6 s your skills strike 50% harder.', '付出 10% 生命：6 秒内技能伤害 +50%。'),
  A('pain-spread', 'swordsman', AVATAR, ['pain-vessel'], { kind: 'nova', cost: 0.1, cooldown: 220, power: 1.5, range: 3, bleed: 40 }, 'Pain Spread', '痛苦扩散', 'Pay 10% of your health: every foe within 3 cells is struck (×1.5) and bleeds.', '付出 10% 生命：周围 3 格内的敌人受到攻击（1.5 倍伤害）并流血。'),
  T('feed-on-pain', 'swordsman', AVATAR, ['flesh-for-blade'], 'Feed on Pain', '以痛为食', 'At seven tenths of your health or less: every skill rests 15% less.', '生命不高于七成时，所有技能冷却 −15%。', { passive: { when: { wounded: 0.7 }, cdr: 0.15 } }),
  T('sixth-suffering-plus', 'swordsman', AVATAR, ['pain-spread'], 'The Sixth Suffering: Mastery', '第六苦·精通', 'The Sixth Suffering: 3 s longer.', '第六苦：多持续 3 秒。', { modifies: { skill: 'sixth-suffering', ticks: 30 } }),
  A('final-offering', 'swordsman', AVATAR, ['feed-on-pain', 'sixth-suffering-plus'], { kind: 'slam', cost: 0.25, cooldown: 420, power: 4, range: 5 }, 'Final Offering', '终末献祭', 'Pay 25% of your health: everything in the 5 cells ahead, three wide, is cut (×4).', '付出 25% 生命：斩开前方 5 格、3 格宽的一切（4 倍伤害）。', 2),
  T('undying-avatar', 'swordsman', AVATAR, ['final-offering'], 'Undying Body', '不灭之躯', 'Every 40 s, a blow that would fell you does not, and you mend to half your health.', '每 40 秒一次：本会让你倒下的一击落空，并让你回到一半生命。', { cost: 2 }),

  // (the Spellblade: blade and spell together — the elements laid on the blade on one arm, spells cut off it on the other;
  // a cast readies the next blow, a blow brings the next cast nearer; the three elements at the end)
  T('blade-and-spell', 'swordsman', SB, [], 'Blade and Spell', '剑法相生', 'With a katana: after you cast a skill, your next blow within 3 s strikes 50% harder and carries the skill\'s element.', '持太刀时，施放技能后 3 秒内的下一次普通攻击伤害 +50%，并带上该技能的元素。'),
  A('flame-enchant', 'swordsman', SB, ['blade-and-spell'], { kind: 'buff', cooldown: 300, ticks: 100, buff: { imbue: 'fire', damage: 0.1 } }, 'Flame Enchantment', '烈焰附魔', 'Fire laid on the blade for 10 s: your katana\'s blows carry fire and strike 10% harder, one in four setting the struck burning.', '给刀身附上火焰，持续 10 秒：太刀的攻击带火焰，伤害 +10%，有 25% 的几率让敌人燃烧。'),
  A('frost-enchant', 'swordsman', SB, ['flame-enchant'], { kind: 'buff', cooldown: 300, ticks: 100, buff: { imbue: 'ice', crit: 0.1 } }, 'Frost Enchantment', '寒霜附魔', 'Ice laid on the blade for 10 s: your katana\'s blows carry ice, critical chance +10%, one in five freezing the struck for 1 s.', '给刀身附上寒霜，持续 10 秒：太刀的攻击带冰霜，暴击率 +10%，有 20% 的几率冻结敌人 1 秒。'),
  A('thunder-enchant', 'swordsman', SB, ['flame-enchant'], { kind: 'buff', cooldown: 300, ticks: 100, buff: { imbue: 'lightning', attackHaste: 0.15 } }, 'Thunder Enchantment', '雷霆附魔', 'Lightning laid on the blade for 10 s: your katana\'s blows carry lightning, attack speed +15%, one in five stunning the struck a moment.', '给刀身附上雷霆，持续 10 秒：太刀的攻击带雷电，攻击速度 +15%，有 20% 的几率让敌人感电 0.5 秒。'),
  T('arcane-edge', 'swordsman', SB, ['frost-enchant'], 'Arcane Edge', '魔刃', 'With a katana: a blow that carries an element (an enchantment\'s, a skill\'s, the katana\'s own) strikes 20% harder.', '持太刀时，带元素的攻击（附魔、元素技能、带元素的太刀）伤害 +20%。'),
  T('mana-tempered', 'swordsman', SB, ['thunder-enchant'], 'Mana-Tempered Steel', '魔力淬刃', 'With a katana: damage +10%, active skills strike 15% harder.', '持太刀时伤害 +10%，主动技能伤害 +15%。', { passive: { when: OWN, damage: 0.1, skillDamage: 0.15 } }),
  A('flame-slash', 'swordsman', SB, ['blade-and-spell'], { kind: 'arc', cooldown: 80, power: 1.6, element: 'fire', afflict: 'burning', ticks: 30 }, 'Flame Slash', '炎斩', 'A cut of fire across the three cells ahead (×1.6, fire), setting the struck burning for 3 s.', '带火的一刀，横斩前方 3 格（1.6 倍火焰伤害），让敌人燃烧 3 秒。'),
  A('thunder-thrust', 'swordsman', SB, ['flame-slash'], { kind: 'pierce', cooldown: 110, power: 1.8, range: 4, element: 'lightning' }, 'Thunder Thrust', '雷光突', 'A thrust that looses lightning off the point: through every foe in its line, up to 4 cells (×1.8, lightning).', '一记突刺，雷光从刀尖射出，贯穿直线上 4 格内的所有敌人（1.8 倍雷电伤害）。'),
  A('frost-ring', 'swordsman', SB, ['flame-slash'], { kind: 'whirlwind', cooldown: 140, power: 1, element: 'ice', afflict: 'frozen', ticks: 15 }, 'Frost Ring', '霜环斩', 'One turn where you stand, ice on the blade: every foe round you is struck (×1.0, ice) and frozen for 1.5 s.', '刀带寒霜，原地旋身一圈：周围的敌人受到攻击（1.0 倍冰霜伤害）并被冻结 1.5 秒。'),
  T('thunder-thrust-plus', 'swordsman', SB, ['thunder-thrust'], 'Thunder Thrust: Mastery', '雷光突·精通', 'Thunder Thrust: 2 cells farther, power +0.4.', '雷光突：距离 +2 格，伤害倍率 +0.4。', { modifies: { skill: 'thunder-thrust', range: 2, power: 0.4 } }),
  T('blade-channel', 'swordsman', SB, ['frost-ring'], 'Channeling Blade', '剑引', 'Each blow of your katana that lands brings every skill 0.3 s nearer.', '太刀的普通攻击每命中一次，所有技能的冷却缩短 0.3 秒。'),
  A('trinity-cut', 'swordsman', SB, ['arcane-edge', 'blade-channel'], { kind: 'arc', cooldown: 360, power: 1.6, count: 3, element: 'all' }, 'Trinity Cut', '三元斩', 'Three cuts across the three cells ahead, fire, ice and lightning in turn (×1.6 each): the struck burn, freeze and are stunned.', '对前方 3 格连斩三刀，火、冰、雷依次落下（每刀 1.6 倍伤害），让敌人燃烧、冻结、感电。', 2),

  // the Spellblade's third: blade and spell as one, the three elements on the blade at once, the lightning cut, a falling
  // star, ten thousand thunders, no gap left between blade and spell
  T('blade-spell-union', 'swordsman', SDEMON, [], 'Blade and Spell as One', '剑法合一', 'With a katana: damage +15%, every skill\'s cooldown −10%.', '持太刀时伤害 +15%，所有技能冷却 −10%。', { passive: { when: OWN, damage: 0.15, cdr: 0.1 } }),
  A('prism-enchant', 'swordsman', SDEMON, ['blade-spell-union'], { kind: 'buff', cooldown: 400, ticks: 120, buff: { imbue: 'all', damage: 0.2 } }, 'Prism Enchantment', '三相附魔', 'Fire, ice and lightning laid on the blade at once for 12 s: your katana\'s blows carry each in turn and strike 20% harder.', '给刀身同时附上火、冰、雷，持续 12 秒：太刀的攻击依次带上三种元素，伤害 +20%。'),
  A('raikiri', 'swordsman', SDEMON, ['blade-spell-union'], { kind: 'dash-strike', cooldown: 180, power: 2.6, range: 5, element: 'lightning', afflict: 'electrified', ticks: 8 }, 'Raikiri', '雷切', 'Lightning on the blade, through the foes in up to 5 cells ahead: each you pass is struck (×2.6, lightning) and stunned 0.8 s.', '刀身缠着雷光，穿过前方最多 5 格的敌人：沿途每个敌人受到攻击（2.6 倍雷电伤害）并感电 0.8 秒。'),
  T('ringing-blade', 'swordsman', SDEMON, ['prism-enchant'], 'Ringing Blade', '剑鸣', 'Blade and Spell: what a cast readies lasts 5 s and serves two blows.', '剑法相生：施法后的加成持续 5 秒，可用于两次普通攻击。'),
  A('meteor-cut', 'swordsman', SDEMON, ['raikiri'], { kind: 'leap', cooldown: 220, power: 2.4, range: 5, element: 'fire', afflict: 'burning', ticks: 40 }, 'Falling Star', '陨星斩', 'Leap at the first foe ahead (5 cells at most) and bring the blade down in fire on the 3×3 round you (×2.4, fire), setting it burning for 4 s.', '跃向前方 5 格内的第一个敌人，带火一刀劈下，波及周围 3×3（2.4 倍火焰伤害），让敌人燃烧 4 秒。'),
  A('ten-thousand-thunders', 'swordsman', SDEMON, ['ringing-blade', 'meteor-cut'], { kind: 'rain', pattern: 'around', element: 'lightning', cooldown: 420, power: 1.1, count: 4, radius: 2, afflict: 'electrified', ticks: 5 }, 'Ten Thousand Thunders', '雷霆万钧', 'Lightning falls on the 5×5 round you, once a second for 4 s (×1.1 each), each struck stunned a moment.', '你周围 5×5 降下落雷，每秒一轮，持续 4 秒（每轮 1.1 倍雷电伤害），被击中的敌人感电 0.5 秒。', 2),
  T('seamless', 'swordsman', SDEMON, ['ten-thousand-thunders'], 'Seamless', '剑法无间', 'Blade and Spell: the blow after a cast strikes 100% harder, not 50%, and each that lands brings every skill 1 s nearer.', '剑法相生：施法后的下一次普通攻击伤害改为 +100%，每命中一次，所有技能的冷却缩短 1 秒。', { cost: 2 }),

  // the first tree's four more
  A('sheath-cut', 'swordsman', {}, ['honed-blade'], { kind: 'buff', cooldown: 280, ticks: 30, buff: { crit: 0.5 } }, 'Noto', '纳刀', 'The blade back in its sheath, ready: for 3 s, critical chance +50%.', '收刀入鞘，蓄势待发：3 秒内暴击率 +50%。'),
  A('wind-cutter', 'swordsman', {}, ['cross-cut'], { kind: 'shot', cooldown: 90, power: 1.3, range: 5 }, 'Wind Cutter', '飞斩', 'A cut thrown off the blade at the first foe ahead within 5 cells (×1.3).', '挥出一道剑气，击中前方 5 格内的第一个敌人（1.3 倍伤害）。'),
  T('steady-breath', 'swordsman', {}, ['fleet-stance'], 'Steady Breath', '调息', 'Every skill\'s cooldown −5%.', '所有技能冷却 −5%。', { grant: { cdr: 0.05 } }),
  T('edge-discipline', 'swordsman', {}, ['clean-cut'], 'Edge Discipline', '刃之修', 'With a katana: critical damage +15%.', '持太刀时暴击伤害 +15%。', { passive: { when: OWN, critDamage: 0.15 } }),
]

// --- the cleric (2026-11-12): the Paladin, the Avenger, the Inquisitor, each with a third of its own
const PA = { path: 'paladin' }
const AV = { path: 'avenger' }
const IQ = { path: 'inquisitor' }
/** Each path's third its own: the Evangelist, the Sentence of Suffering, Doomsday. */
const EVANGELIST = { path: 'paladin', tier: 3 }
const SENTENCE = { path: 'avenger', tier: 3 }
const DOOMSDAY = { path: 'inquisitor', tier: 3 }
/** What an Avenger's lash and black flame leave. */
const WOUNDED = { target: { status: ['bleeding', 'burning'] } }
/** An Inquisitor's heretic: branded (Brand the Heretic, the Last Judgement). */
const BRANDED = { target: { status: ['branded'] } }
const CLERIC: SkillDef[] = [
  // (the Paladin: the healing light and the renewal on one arm, the guarding light and the radiant blow on the other, heaven
  // stepping in at the end)
  T('oath-of-light', 'cleric', PA, [], 'Oath of Light', '光之誓', 'Your mending is 25% stronger; combat damage taken −5%.', '你的治疗效果 +25%；受到的战斗伤害 −5%。', { passive: { mend: 0.25, taken: -0.05 } }),
  A('healing-light', 'cleric', PA, ['oath-of-light'], { kind: 'mend', cooldown: 180, power: 0.3, range: 6 }, 'Healing Light', '治愈之光', 'Light mends you and every companion within 6 cells: three tenths of each one\'s max health.', '圣光为你和身边 6 格内的每个同伴恢复各自生命上限十分之三的生命。'),
  A('guardian-light', 'cleric', PA, ['oath-of-light'], { kind: 'taunt', cooldown: 220, power: 0.4, range: 3, ticks: 50, buff: { taken: -0.3 } }, 'Guardian Light', '守护之光', 'A light that draws every foe within 3 cells to you: each is struck lightly (×0.4) and comes for you; for 5 s you take 30% less.', '一道把敌人引向你的光：周围 3 格内的敌人受到轻微攻击（0.4 倍伤害）并转而攻击你；5 秒内你受到的伤害 −30%。'),
  // (its picture its own: Second Wind's is `renew`)
  { ...A('renew', 'cleric', PA, ['healing-light'], { kind: 'buff', cooldown: 300, ticks: 100, buff: { party: true, regen: 2 } }, 'Renew', '复苏', 'For 10 s, you and your companions within 6 cells mend 2 a second.', '10 秒内，你和身边 6 格内的同伴每秒恢复 2 点生命。'), icon: 'cleric-renew' },
  T('blessed-hands', 'cleric', PA, ['healing-light'], 'Blessed Hands', '圣手', 'Your mending is 20% stronger.', '你的治疗效果 +20%。', { passive: { mend: 0.2 } }),
  A('radiant-blow', 'cleric', PA, ['guardian-light'], { kind: 'bash', cooldown: 120, power: 2.2, afflict: 'stunned', ticks: 10 }, 'Radiant Blow', '圣耀之击', 'A blow of the cross full of light on the cell ahead (×2.2): the foe is stunned for 1 s.', '用满是圣光的十字架砸向前方一格（2.2 倍伤害），使敌人眩晕 1 秒。'),
  T('iron-faith', 'cleric', PA, ['guardian-light'], 'Iron Faith', '铁信', 'Combat damage taken −12%.', '受到的战斗伤害 −12%。', { passive: { taken: -0.12 } }),
  T('healing-light-plus', 'cleric', PA, ['renew'], 'Healing Light: Mastery', '治愈之光·精通', 'Healing Light: mends a tenth more, cooldown −4 s.', '治愈之光：多恢复十分之一，冷却 −4 秒。', { modifies: { skill: 'healing-light', power: 0.1, cooldown: -40 } }),
  T('merciful', 'cleric', PA, ['blessed-hands'], 'Merciful', '慈悲', 'You and your companions within 6 cells, at half health or less: combat damage taken −20%.', '你和身边 6 格内的同伴生命不高于一半时，受到的战斗伤害 −20%。', { passive: { party: true, when: { wounded: 0.5 }, taken: -0.2 } }),
  T('radiant-blow-plus', 'cleric', PA, ['radiant-blow'], 'Radiant Blow: Mastery', '圣耀之击·精通', 'Radiant Blow: damage +0.6×, cooldown −2 s.', '圣耀之击：伤害 +0.6 倍，冷却 −2 秒。', { modifies: { skill: 'radiant-blow', power: 0.6, cooldown: -20 } }),
  T('shining-armour', 'cleric', PA, ['iron-faith'], 'Shining Armour', '光辉圣甲', 'While Guardian Light is up: you mend 3 a second.', '守护之光生效期间，你每秒恢复 3 点生命。', { passive: { when: { buff: 'guardian-light' }, regen: 3 } }),
  A('divine-intervention', 'cleric', PA, ['healing-light-plus', 'radiant-blow-plus'], { kind: 'buff', cooldown: 600, ticks: 60, buff: { party: true, taken: -0.5, regen: 3 } }, 'Divine Intervention', '神圣干预', 'Heaven steps in for 6 s: you and your companions within 6 cells take half harm and mend 3 a second.', '上天出手干预，持续 6 秒：你和身边 6 格内的同伴受到的伤害减半，每秒恢复 3 点生命。', 2),

  // (the Avenger: the lash and the wrath on one arm, the black flame and the torment on the other, a night of wrath at the end)
  T('vengeance', 'cleric', AV, [], 'Vengeance', '复仇', 'Against the one who struck you last, within 3 s: damage +30%.', '攻击 3 秒内打过你的那个敌人时，伤害 +30%。'),
  A('scourge', 'cleric', AV, ['vengeance'], { kind: 'arc', cooldown: 90, power: 1.1, count: 2, bleed: 30 }, 'Scourge', '鞭笞', 'Two lashes across the three cells ahead (×1.1 each): every foe struck bleeds.', '向前方 3 格抽打两下（每下 1.1 倍伤害）：被打中的敌人流血。'),
  A('black-flame', 'cleric', AV, ['vengeance'], { kind: 'shot', cooldown: 100, power: 1.4, range: 5, afflict: 'burning', ticks: 40 }, 'Black Flame', '黑焰', 'A black flame at the first foe ahead within 5 cells (×1.4): it burns for 4 s.', '向 5 格内的第一个敌人掷出一团黑色的火焰（1.4 倍伤害），使其燃烧 4 秒。'),
  A('wrath', 'cleric', AV, ['scourge'], { kind: 'buff', cooldown: 260, ticks: 80, buff: { damage: 0.3, drain: 2, taken: 0.1 } }, 'Wrath', '怒火', 'Let the wrath in for 8 s: damage +30%, each blow that lands draws back 2, but you take 10% more.', '放任怒火 8 秒：伤害 +30%，每次命中吸取 2 点生命，但受到的伤害 +10%。'),
  T('blood-for-blood', 'cleric', AV, ['scourge'], 'Blood for Blood', '以血还血', 'At half health or less: damage +10%, and each blow that lands draws back 2.', '生命不高于一半时，伤害 +10%，每次命中吸取 2 点生命。', { passive: { when: { wounded: 0.5 }, damage: 0.1, drain: 2 } }),
  A('torment', 'cleric', AV, ['black-flame'], { kind: 'detonate', status: 'bleeding', cooldown: 160, power: 2.2, range: 4 }, 'Torment', '折磨', 'Every bleeding foe within 4 cells is wracked (×2.2): the bleed in it is spent.', '4 格内所有流血的敌人被折磨（2.2 倍伤害），身上的血就此流尽。'),
  T('shared-suffering', 'cleric', AV, ['black-flame'], 'Shared Suffering', '同受其苦', 'Against the bleeding and the burning: damage +25%.', '对流血或燃烧中的敌人伤害 +25%。', { passive: { when: WOUNDED, damage: 0.25 } }),
  T('wrath-plus', 'cleric', AV, ['wrath'], 'Wrath: Mastery', '怒火·精通', 'Wrath: 3 s longer, cooldown −5 s.', '怒火：多持续 3 秒，冷却 −5 秒。', { modifies: { skill: 'wrath', ticks: 30, cooldown: -50 } }),
  T('eye-for-an-eye', 'cleric', AV, ['blood-for-blood'], 'An Eye for an Eye', '以眼还眼', 'Whoever strikes you hand to hand is struck back one time in three (×0.6 of your attack).', '近身打中你的敌人，有三分之一的几率被你打回去（你攻击力的 0.6 倍）。'),
  T('torment-plus', 'cleric', AV, ['torment'], 'Torment: Mastery', '折磨·精通', 'Torment: reach +2 cells, damage +0.5×.', '折磨：范围 +2 格，伤害 +0.5 倍。', { modifies: { skill: 'torment', range: 2, power: 0.5 } }),
  T('dark-zeal', 'cleric', AV, ['shared-suffering'], 'Dark Zeal', '黑暗狂热', 'Against the bleeding and the burning: critical chance +12%.', '攻击流血或燃烧中的敌人时，暴击率 +12%。', { passive: { when: WOUNDED, crit: 0.12 } }),
  A('night-of-wrath', 'cleric', AV, ['wrath-plus', 'torment-plus'], { kind: 'nova', cooldown: 380, power: 2.2, range: 3, bleed: 50, afflict: 'burning', ticks: 40 }, 'Night of Wrath', '怒夜', 'Black fire bursts out of you: every foe within 3 cells is struck (×2.2), bleeds and burns.', '黑色的火从你身上炸开：周围 3 格内的敌人受到攻击（2.2 倍伤害），流血并燃烧。', 2),

  // (the Inquisitor: the brand and the shackles on one arm, the stake and the purging fire on the other, the sentence at the end)
  T('zealotry', 'cleric', IQ, [], 'Zealotry', '狂信', 'Damage +20% against the branded, the kneeling and the held.', '对被打上异端烙印、跪地或被缠住的敌人伤害 +20%。', { passive: { when: { target: { status: ['branded', 'knelt', 'webbed'] } }, damage: 0.2 } }),
  A('brand-heretic', 'cleric', IQ, ['zealotry'], { kind: 'mark', cooldown: 160, range: 6, ticks: 80, power: 0.5, afflict: 'branded', buff: { damage: 0.3 } }, 'Brand the Heretic', '烙印异端', 'Brand the nearest foe within 6 cells a heretic for 8 s (×0.5): its defence −3, and it takes 30% more from you.', '给 6 格内最近的敌人打上异端烙印 8 秒（0.5 倍伤害）：它的防御 −3，受到你的伤害 +30%。'),
  A('burn-the-heretic', 'cleric', IQ, ['zealotry'], { kind: 'shot', element: 'fire', cooldown: 100, power: 1.6, range: 5, afflict: 'burning', ticks: 50 }, 'Burn the Heretic', '火刑', 'Set the first foe ahead within 5 cells alight (×1.6): it burns for 5 s.', '点燃 5 格内的第一个敌人（1.6 倍伤害），使其燃烧 5 秒。'),
  A('shackles', 'cleric', IQ, ['brand-heretic'], { kind: 'shot', cooldown: 140, power: 0.8, range: 5, afflict: 'webbed', ticks: 30 }, 'Shackles', '镣铐', 'Shackle the first foe ahead within 5 cells (×0.8): it is held for 3 s.', '给 5 格内的第一个敌人戴上镣铐（0.8 倍伤害），使其被缠住 3 秒。'),
  T('mark-of-heresy', 'cleric', IQ, ['brand-heretic'], 'Mark of Heresy', '异端之证', 'Against the branded: critical chance +15%.', '攻击被打上异端烙印的敌人时，暴击率 +15%。', { passive: { when: BRANDED, crit: 0.15 } }),
  A('purging-flame', 'cleric', IQ, ['burn-the-heretic'], { kind: 'fireball', element: 'fire', cooldown: 160, power: 1.8, range: 5, radius: 1, afflict: 'burning', ticks: 30 }, 'Purging Flame', '净罪之火', 'A ball of purging fire on the first foe ahead within 5 cells: the 3×3 round it burns (×1.8).', '向 5 格内的第一个敌人投出净罪之火：它周围 3×3 范围都烧起来（1.8 倍伤害）。'),
  T('the-stake', 'cleric', IQ, ['burn-the-heretic'], 'The Stake', '火刑柱', 'Against the burning: damage +25%.', '对燃烧中的敌人伤害 +25%。', { passive: { when: { target: { status: ['burning'] } }, damage: 0.25 } }),
  T('shackles-plus', 'cleric', IQ, ['shackles'], 'Shackles: Mastery', '镣铐·精通', 'Shackles: held 1 s longer, cooldown −3 s.', '镣铐：多缠住 1 秒，冷却 −3 秒。', { modifies: { skill: 'shackles', ticks: 10, cooldown: -30 } }),
  T('interrogation', 'cleric', IQ, ['mark-of-heresy'], 'Interrogation', '审讯', 'Against the held, the stunned and the kneeling: critical damage +40%.', '攻击被缠住、眩晕或跪地的敌人时，暴击伤害 +40%。', { passive: { when: { target: { status: ['webbed', 'stunned', 'knelt'] } }, critDamage: 0.4 } }),
  T('purging-flame-plus', 'cleric', IQ, ['purging-flame'], 'Purging Flame: Mastery', '净罪之火·精通', 'Purging Flame: damage +0.5×, cooldown −3 s.', '净罪之火：伤害 +0.5 倍，冷却 −3 秒。', { modifies: { skill: 'purging-flame', power: 0.5, cooldown: -30 } }),
  T('no-mercy', 'cleric', IQ, ['the-stake'], 'No Mercy', '绝不宽恕', 'With a cross, against a foe below half health: damage +25%.', '持十字架攻击生命低于一半的敌人时，伤害 +25%。', { passive: { when: { ...OWN, target: { wounded: 0.5 } }, damage: 0.25 } }),
  A('sentence', 'cleric', IQ, ['interrogation', 'purging-flame-plus'], { kind: 'shot', cooldown: 360, power: 5, range: 6, sure: true, afflict: 'stunned', ticks: 20 }, 'Sentence', '宣判', 'Sentence passed on the first foe ahead within 6 cells: struck ×5, a sure critical, and stunned for 2 s.', '对 6 格内的第一个敌人宣判：5 倍伤害，必定暴击，并眩晕 2 秒。', 2),

  // the Evangelist (the Paladin's third): the gospel, the faithful called, the psalm, the gate of heaven, a crown of glory
  T('gospel', 'cleric', EVANGELIST, [], 'Gospel', '福音', 'Your mending is 30% stronger; you and your companions within 6 cells: damage +10%.', '你的治疗效果 +30%；你和身边 6 格内的同伴伤害 +10%。', { passive: { party: true, mend: 0.3, damage: 0.1 } }),
  A('call-the-faithful', 'cleric', EVANGELIST, ['gospel'], { kind: 'summon', creature: SUMMONS.disciple, cooldown: 450, count: 2 }, 'Call the Faithful', '召集信众', 'Two of the faithful come at your call and fight at your side for 30 s.', '两名信徒应你的召唤而来，在你身边战斗 30 秒。'),
  A('psalm', 'cleric', EVANGELIST, ['gospel'], { kind: 'mend', cooldown: 300, power: 0.5, range: 8 }, 'Psalm', '圣咏', 'A psalm sung: you and every companion within 8 cells mend half of each one\'s max health.', '唱一段圣咏：你和身边 8 格内的每个同伴恢复各自生命上限一半的生命。'),
  T('apostles', 'cleric', EVANGELIST, ['call-the-faithful'], 'Apostles', '使徒', 'The faithful you call, and the angel, have half again their health and strike 30% harder.', '你召来的信徒和天使生命 +50%，伤害 +30%。'),
  T('psalm-plus', 'cleric', EVANGELIST, ['psalm'], 'Psalm: Mastery', '圣咏·精通', 'Psalm: reach +2 cells, cooldown −6 s.', '圣咏：范围 +2 格，冷却 −6 秒。', { modifies: { skill: 'psalm', range: 2, cooldown: -60 } }),
  A('gate-of-heaven', 'cleric', EVANGELIST, ['apostles', 'psalm-plus'], { kind: 'summon', creature: SUMMONS.seraph, cooldown: 600, count: 1, power: 1.5, radius: 3 }, 'Gate of Heaven', '天国之门', 'The gate of heaven opens beside you: every foe within 3 cells is struck (×1.5), and an angel comes down to fight at your side for 30 s.', '天国之门在你身边打开：3 格内的敌人受到攻击（1.5 倍伤害），一位天使降下，在你身边战斗 30 秒。', 2),
  T('crown-of-glory', 'cleric', EVANGELIST, ['gate-of-heaven'], 'Crown of Glory', '荣耀之冠', 'Each foe felled by you or a companion mends you and every companion within 6 cells 3, and brings every skill a second nearer.', '你或同伴每击倒一个敌人，你和身边 6 格内的同伴恢复 3 点生命，你所有技能的冷却缩短 1 秒。', { cost: 2 }),

  // the Sentence of Suffering (the Avenger's third): the Five Sufferings laid on the foe in turn — the crown, the scourge,
  // hunger, the nails, the lance (lore.md §4) —, a crown of thorns, the spear of sorrow, all five at once, atonement
  T('five-sufferings', 'cleric', SENTENCE, [], 'The Five Sufferings', '五苦', 'With a cross, your blows lay the Five on a foe in turn: the crown (it kneels a moment), the scourge (it bleeds), hunger (it is mired), the nails (it is held), the lance (a sure critical, 50% harder); then again from the crown.', '持十字架时，你的攻击会把五苦依次加在同一个敌人身上：戴冠（短暂跪地）、受鞭（流血）、受饥（陷足）、受钉（被缠住）、受枪（必定暴击，伤害 +50%），然后从戴冠重新开始。'),
  A('thorn-crown', 'cleric', SENTENCE, ['five-sufferings'], { kind: 'field', leaves: HAZARDS.briars, pattern: 'ring', cooldown: 260 }, 'Crown of Thorns', '荆冠', 'A crown of thorns round you: briars on the ring 2 cells out for 6 s; a foe who walks into them kneels.', '在你周围 2 格处长出一圈荆棘，持续 6 秒：走进去的敌人会跪下。'),
  A('spear-of-sorrow', 'cleric', SENTENCE, ['five-sufferings'], { kind: 'pierce', missile: 'blade', cooldown: 240, power: 3, range: 5, sure: true }, 'Spear of Sorrow', '哀恸之枪', 'A lance of dark light through every foe in the 5 cells ahead (×3), each a sure critical.', '一道黑暗的光枪贯穿前方 5 格内的所有敌人（3 倍伤害），必定暴击。'),
  T('nail-and-wood', 'cleric', SENTENCE, ['thorn-crown'], 'Nail and Wood', '钉与木', 'Against the held and the kneeling: damage +30%.', '对被缠住或跪地的敌人伤害 +30%。', { passive: { when: { target: { status: ['webbed', 'knelt'] } }, damage: 0.3 } }),
  T('spear-of-sorrow-plus', 'cleric', SENTENCE, ['spear-of-sorrow'], 'Spear of Sorrow: Mastery', '哀恸之枪·精通', 'Spear of Sorrow: reach +2 cells, cooldown −5 s.', '哀恸之枪：距离 +2 格，冷却 −5 秒。', { modifies: { skill: 'spear-of-sorrow', range: 2, cooldown: -50 } }),
  A('all-five', 'cleric', SENTENCE, ['nail-and-wood', 'spear-of-sorrow-plus'], { kind: 'nova', cooldown: 480, power: 3, range: 4, sure: true, bleed: 50, afflict: 'webbed', ticks: 20 }, 'All Five at Once', '五苦加身', 'The Five fall at once on every foe within 4 cells: each is struck (×3, a sure critical), bleeds, and is held for 2 s.', '五苦同时落在周围 4 格内的每个敌人身上：受到攻击（3 倍伤害，必定暴击），流血，并被缠住 2 秒。', 2),
  T('atonement', 'cleric', SENTENCE, ['all-five'], 'Atonement', '赎罪', 'Each time you lay the lance (the fifth Suffering), you mend a tenth of your max health and every skill comes 2 s nearer.', '每当你加上第五苦"受枪"，你恢复生命上限十分之一的生命，所有技能的冷却缩短 2 秒。', { cost: 2 }),

  // Doomsday (the Inquisitor's third): the last days, doom pronounced, the confession on one's knees, the Last Judgement, the
  // day of wrath
  T('last-days', 'cleric', DOOMSDAY, [], 'The Last Days', '末日', 'Against the branded: critical chance +15%, critical damage +30%.', '攻击被打上异端烙印的敌人时，暴击率 +15%，暴击伤害 +30%。', { passive: { when: BRANDED, crit: 0.15, critDamage: 0.3 } }),
  A('doom', 'cleric', DOOMSDAY, ['last-days'], { kind: 'doom', cooldown: 240, range: 6, power: 4, ticks: 50 }, 'Doom', '末日宣告', 'Pronounce doom on the nearest foe within 6 cells: in 5 s it is struck ×4, twice as hard if it is still branded.', '对 6 格内最近的敌人宣告末日：5 秒后它受到 4 倍伤害；那时它若仍带着异端烙印，伤害再翻倍。'),
  A('confess', 'cleric', DOOMSDAY, ['last-days'], { kind: 'nova', cooldown: 200, power: 0.8, range: 3, afflict: 'knelt', ticks: 20 }, 'Confess', '伏罪', 'Every foe within 3 cells is struck (×0.8) and forced to its knees for 2 s.', '周围 3 格内的敌人受到攻击（0.8 倍伤害），被迫跪地 2 秒。'),
  T('inevitable', 'cleric', DOOMSDAY, ['doom'], 'Inevitable', '劫数难逃', 'Doom falls 2 s sooner and strikes ×2.0 harder.', '末日宣告提前 2 秒落下，伤害 +2.0 倍。', { modifies: { skill: 'doom', ticks: -20, power: 2 } }),
  T('confess-plus', 'cleric', DOOMSDAY, ['confess'], 'Confess: Mastery', '伏罪·精通', 'Confess: reach +1 cell, the kneeling 1 s longer.', '伏罪：范围 +1 格，跪地多 1 秒。', { modifies: { skill: 'confess', range: 1, ticks: 10 } }),
  A('last-judgement', 'cleric', DOOMSDAY, ['inevitable', 'confess-plus'], { kind: 'mark', cooldown: 600, range: 8, ticks: 80, power: 8, sure: true, afflict: 'branded', buff: { damage: 0.3 } }, 'The Last Judgement', '最后的审判', 'The Last Judgement on the nearest foe within 8 cells: struck ×8, a sure critical, and branded for 8 s.', '对 8 格内最近的敌人降下最后的审判：8 倍伤害，必定暴击，并打上异端烙印 8 秒。', 2),
  T('dies-irae', 'cleric', DOOMSDAY, ['last-judgement'], 'Day of Wrath', '震怒之日', 'A branded foe below a fifth of its health is slain by your next blow (a boss is struck 50% harder instead).', '被打上异端烙印、生命低于五分之一的敌人，会被你的下一击直接处决（首领改为受到的伤害 +50%）。', { cost: 2 }),

  // the first tree's four more
  A('hammer-of-heaven', 'cleric', {}, ['smite'], { kind: 'quake', cooldown: 110, power: 1.4 }, 'Hammer of Heaven', '天锤', 'Light falls like a hammer on the 3×3 two cells ahead (×1.4).', '圣光像锤子一样砸在前方两格处的 3×3 范围（1.4 倍伤害）。'),
  A('ward-of-light', 'cleric', {}, ['prayer'], { kind: 'ward', cooldown: 240, power: 0.25, ticks: 60 }, 'Ward of Light', '光之护佑', 'A ward of light takes the next quarter of your health in harm, for 6 s.', '一层圣光护佑，在 6 秒内替你挡下相当于生命上限四分之一的伤害。'),
  T('pious', 'cleric', {}, ['steadfast'], 'Pious', '敬虔', 'Every skill\'s cooldown −5%.', '所有技能冷却 −5%。', { grant: { cdr: 0.05 } }),
  T('anointed', 'cleric', {}, ['blessed-arms'], 'Anointed', '受膏', 'With a cross: critical damage +15%.', '持十字架时暴击伤害 +15%。', { passive: { when: OWN, critDamage: 0.15 } }),
]

// ------------------------------------------------------------------ the colours their effects are drawn in

/** Each path's colours (ActiveDef.look: the renderer's skill effects), and a third's of its own (the Necromancer's hellfire). */
const PATH_LOOK: Record<string, string> = {
  necromancer: 'necro', shadowdancer: 'shadow', demonhunter: 'hex',
  hunter: 'beast', sharpshooter: 'steel', skirmisher: 'wind',
  cryomancer: 'frost', pyromancer: 'fire', stormcaller: 'storm',
  swordsaint: 'blade', sacrificer: 'pain', spellblade: 'arcane',
  paladin: 'holy', avenger: 'blood', inquisitor: 'fire',
}
const MASTERY_LOOK: Record<string, string> = { assassin: 'shadow', ranger: 'wind', mage: 'arcane', swordsman: 'blade', cleric: 'holy' }
const THIRD_LOOK: Record<string, string> = {
  necromancer: 'hell', shadowdancer: 'shadow', demonhunter: 'hex', swordsaint: 'blade', sacrificer: 'pain', spellblade: 'arcane',
  cryomancer: 'frost', pyromancer: 'fire', stormcaller: 'storm',
  hunter: 'thorn', sharpshooter: 'war', skirmisher: 'wind',
  paladin: 'holy', avenger: 'penance', inquisitor: 'doom',
}
/** A skill's own colours over its path's: the poison of a Necromancer, a mark's blood, a trap's earth. */
const OWN_LOOK: Record<string, string> = {
  miasma: 'poison', 'toxic-burst': 'poison', pestilence: 'poison',
  'death-mark': 'blood', garrote: 'blood', caltrops: 'steel',
  'snare-trap': 'earth', 'spike-trap': 'earth', 'killing-field': 'fire', 'hunting-net': 'earth', 'mark-prey': 'blood', 'sight-lock': 'blood',
  'mana-ward': 'arcane', 'arcane-missiles': 'arcane',
  // (a Spellblade's elements: each in its own)
  'flame-enchant': 'fire', 'frost-enchant': 'frost', 'thunder-enchant': 'storm', 'flame-slash': 'fire', 'thunder-thrust': 'storm',
  'frost-ring': 'frost', raikiri: 'storm', 'meteor-cut': 'fire', 'ten-thousand-thunders': 'storm',
  // (an Avenger's black flame; an Inquisitor's brand and shackles)
  'black-flame': 'penance', 'brand-heretic': 'hex', shackles: 'steel',
}
const looked = (s: SkillDef): SkillDef => {
  if (!s.active) return s
  const path = [s.path ?? []].flat()[0]
  const look = OWN_LOOK[s.id] ?? (s.tier === 3 ? THIRD_LOOK[path] ?? MASTERY_LOOK[s.profession ?? ''] : path ? PATH_LOOK[path] : undefined)
  return look ? { ...s, active: { ...s.active, look } } : s
}

/** Every skill the advancements add (and the first trees' four more each). */
export const ADVANCEMENT_SKILLS: SkillDef[] = [...ASSASSIN, ...RANGER, ...MAGE, ...SWORDSMAN, ...CLERIC].map(looked)

// ------------------------------------------------------------------ the paths and masteries, as the trainer offers them

const path = (id: string, en: string, zh: string, docEn: string, docZh: string, third?: [string, string, string?, string?]): PathDef => ({
  id, name: L(en, zh), doc: L(docEn, docZh), icon: `path-${id}`,
  ...(third && { third: { name: L(third[0], third[1]), icon: `mastery-${id}`, ...(third[2] && { doc: L(third[2], third[3]!) }) } }),
})

export const PATHS: Record<string, PathDef[]> = {
  assassin: [
    path('necromancer', 'Necromancer', '死灵术士', 'The dead and the poison: you stand back while the dead you raise fight for you, every blow of theirs poisoned, the poisoned fallen made to burst.', '召唤与毒：自己站在后面，唤起亡者替你厮杀，亡者的每一击都带着尸毒，中毒的敌人倒下时尸体爆开。', ['Hell Sovereign', '地狱支配者', 'The Necromancer\'s own third: the dead stronger again, a guard of hell, a plague round you, the gate of the Styx.', '死灵术士自己的第三转：亡者更强，唤出冥狱守卫，降下瘟疫，打开冥河之门。']),
    path('shadowdancer', 'Shadowdancer', '影舞者', 'The veil and the back: gone into shadow, the blow from behind, criticals, and hard to strike.', '隐匿与背刺：遁入阴影，从背后出手，刀刀暴击，很难被打中。', ['Phantom', '幻影', 'The Shadowdancer\'s own third: a double of yourself, a dodge that fades you out, the assassination, every fifth blow true.', '影舞者自己的第三转：分出影分身，闪避后隐入黑暗，刺杀，每第五击必中。']),
    path('demonhunter', 'Demon Hunter', '猎魔人', 'The sigil and the hex: binding circles drawn on the ground, foes hexed and held, companions roused.', '法阵与咒印：在地上画下封魔阵，给敌人打上咒印、把它定在原地，鼓舞身边的同伴。', ['Ghostwail', '鬼泣', 'The Demon Hunter\'s own third: the night\'s things hunted, the mark of death, a sanctum for your company, a howl that makes the ghosts weep, the hex spread.', '猎魔人自己的第三转：专猎夜里的东西，死亡印记，为同伴画下圣域，让鬼也落泪的长嚎，咒印四散。']),
  ],
  ranger: [
    path('hunter', 'Hunter', '猎人', 'Traps, the mark and the hound: the ground made deadly before the foe arrives, the foe marked as your prey, a hound at your side.', '陷阱、标记与猎犬：在敌人来到之前把地面变成杀场，把敌人标记成猎物，带着猎犬一起狩猎。', ['Greenwood Dawn', '森海飞霞', 'The Hunter\'s own third: the heart of the greenwood, the pack, the net, the birds rising at dawn, the mark passed from prey to prey.', '猎人自己的第三转：森海之心，狼群，捕网，万鸟飞霞，猎物的印记一个传一个。']),
    path('sharpshooter', 'Sniper', '狙击手', 'The one shot from afar: drawn slow, struck hard, the foe pinned where it stands.', '远处的致命一箭：拉弓慢，下手重，把敌人钉在原地。', ['Hawkeye', '鹰眼', 'The Sniper\'s own third: the hawk\'s sight — every arrow as far as the map goes, slower and twice as hard —, the arrow through the sun, the sighted foe, one shot, one kill.', '狙击手自己的第三转：鹰视——每一箭都能射到地图尽头，射得更慢，伤害翻倍——，贯日，锁定，一箭封喉。']),
    path('skirmisher', 'Skirmisher', '漫游射手', 'Never still: quick feet and quick arrows, light ones and many, a gust to keep the foe off, in and out like an assassin.', '从不停下：脚快，箭快，箭轻但多，用一阵风把敌人推开，像刺客一样进进出出。', ['Skywing', '天空之翼', 'The Skirmisher\'s own third: the heart of the sky, the wingbeat, the flying feathers, ten thousand feathers falling, a sky no blow can touch.', '漫游射手自己的第三转：苍穹之心，振翼，飞羽，万羽天坠，天行者。']),
  ],
  mage: [
    path('cryomancer', 'Cryomancer', '霜术师', 'Ice: foes frozen and then shattered, spikes of ice from the ground, the ground itself frozen.', '冰：冻住敌人再打碎，从地下冒出冰刺，把地面冻成冰。', ['Everwinter', '永冬', 'The Cryomancer\'s own third: a heart of winter, the glacier, the cold wave, a winter without end, time stilled.', '霜术师自己的第三转：冬之心，冰川，寒潮，永冬降临，凝时。']),
    path('pyromancer', 'Pyromancer', '炎术师', 'Fire: foes set burning and then burst, walls of flame, the dragon\'s breath.', '火：先点燃敌人，再让燃烧的敌人爆开；火墙、龙息烧过一片。', ['Worldfire', '劫火', 'The Pyromancer\'s own third: a heart of fire, the body set alight, the earth scorched, the fire that ends a world.', '炎术师自己的第三转：劫火之心，焚身，焚原，劫火燎原，万物为薪。']),
    path('stormcaller', 'Stormcaller', '雷术师', 'Lightning: the bolt and the spear, foes electrified and held a moment, quick feet.', '雷：落雷、雷枪，让敌人感电、短暂定住，身法轻快。', ['Wrath of Heaven', '天罚', 'The Stormcaller\'s own third: heaven\'s might, the bolt of judgement, a shroud of thunder, heaven\'s wrath, the storm without end.', '雷术师自己的第三转：天威，天雷，雷霆护体，天罚降临，九天雷动。']),
  ],
  cleric: [
    path('paladin', 'Paladin', '圣骑士', 'The light that mends: you and those who follow you healed, guarded and held up, the foe drawn onto you.', '治愈之光：治疗、守护你自己和身边的同伴，把敌人引到自己身上。', ['Evangelist', '福音传道者', 'The Paladin\'s own third: the gospel, the faithful called to your side, the psalm, the gate of heaven, a crown of glory.', '圣骑士自己的第三转：福音，召集信众，圣咏，天国之门，荣耀之冠。']),
    path('avenger', 'Avenger', '复仇者', 'The Church\'s dark hand: pain answered with pain, lashes that bleed, a black flame, a wrath that drinks.', '圣教的暗面：以痛还痛，鞭笞见血，黑色的火焰，饮血的怒火。', ['Sentence of Suffering', '苦痛断罪', 'The Avenger\'s own third: the Five Sufferings laid on the foe in turn — the crown, the scourge, hunger, the nails, the lance —, a crown of thorns, the spear of sorrow, all five at once, atonement.', '复仇者自己的第三转：把五苦依次加在敌人身上——戴冠、受鞭、受饥、受钉、受枪——，荆冠，哀恸之枪，五苦加身，赎罪。']),
    path('inquisitor', 'Inquisitor', '异端审判者', 'The heretic found, branded and judged: shackles and the kneeling, the stake, one foe brought down hard.', '找出异端，打上烙印，当场审判：镣铐与下跪，火刑，对单个敌人下重手。', ['Doomsday', '末日裁决', 'The Inquisitor\'s own third: the last days, doom pronounced, the kneeling, the Last Judgement, the day of wrath.', '异端审判者自己的第三转：末日，末日宣告，伏罪，最后的审判，震怒之日。']),
  ],
  swordsman: [
    path('swordsaint', 'Sword Saint', '剑圣', 'The cut and the way of the sword, nothing else: the draw, the swallow\'s return, the dance of phantom blades, feet never still.', '纯粹的斩击与剑道：拔刀一闪，燕返回斩，剑影连舞，步法飘忽。', ['Sword Heart', '剑心', 'The Sword Saint\'s own third: the still mind, the cut through the air, the draw farther, ten thousand swords.', '剑圣自己的第三转：明镜止水，空斩，拔刀斩更远，万剑归宗。']),
    path('sacrificer', 'Sacrificer', '献祭者', 'The Church teaches that suffering brings one near to god. The Sacrificer took it at its word and went past the Five: health paid for strength, the more hurt the stronger.', '圣教说苦难使人接近神。献祭者把这句话当了真，在五苦之外再给自己加刑：以生命换力量，伤得越重越强。', ['Mad Martyr', '狂殉者', 'The Sacrificer\'s own third: flesh given to the blade, the pain spread, the last offering, a body that will not fall.', '献祭者自己的第三转：血肉献刃，痛苦扩散，终末献祭，不灭之躯。']),
    path('spellblade', 'Spellblade', '魔剑', 'Blade and spell together: fire, ice and lightning laid on the katana, spells cut off the blade; each cast makes the next blow harder, each blow brings the next cast nearer.', '物法双修：给太刀附上火、冰、雷，借刀施放法术；每施一次法，下一刀更重，每砍中一刀，法术冷却得更快。', ['Nightbreaker', '破夜之刃', 'The Spellblade\'s own third: blade and spell as one, the three elements on the blade at once, the lightning cut, a falling star, ten thousand thunders.', '魔剑自己的第三转：剑法合一，三相附魔，雷切，陨星斩，雷霆万钧。']),
  ],
}

export const MASTERIES: Record<string, { name: Text; doc: Text; icon: string }> = {
  // (its name and its skills are the path's: Hell Sovereign, Phantom, Ghostwail; this one before a path is chosen)
  assassin: { name: L('Third Advancement', '三转'), doc: L('The assassin\'s third is the path\'s own: Hell Sovereign, Phantom or Ghostwail.', '刺客的第三转随分支：地狱支配者、幻影或鬼泣，各有自己的技能。'), icon: 'mastery-assassin' },
  // (its name and its skills are the path's: Greenwood Dawn, Hawkeye, Skywing; this one before a path is chosen)
  ranger: { name: L('Third Advancement', '三转'), doc: L('The ranger\'s third is the path\'s own: Greenwood Dawn, Hawkeye or Skywing.', '游侠的第三转随分支：森海飞霞、鹰眼或天空之翼，各有自己的技能。'), icon: 'mastery' },
  // (its name and its skills are the path's: Everwinter, Worldfire, Wrath of Heaven; this one before a path is chosen)
  mage: { name: L('Third Advancement', '三转'), doc: L('The mage\'s third is the path\'s own: Everwinter, Worldfire or Wrath of Heaven.', '法师的第三转随分支：永冬、劫火或天罚，各有自己的技能。'), icon: 'mastery' },
  // (its name and its skills are the path's: Sword Heart, Mad Martyr, Nightbreaker; this one before a path is chosen)
  swordsman: { name: L('Third Advancement', '三转'), doc: L('The swordsman\'s third is the path\'s own: Sword Heart, Mad Martyr or Nightbreaker.', '剑客的第三转随分支：剑心、狂殉者或破夜之刃，各有自己的技能。'), icon: 'mastery' },
  // (its name and its skills are the path's: the Evangelist, the Sentence of Suffering, Doomsday; this one before a path is chosen)
  cleric: { name: L('Third Advancement', '三转'), doc: L('The cleric\'s third is the path\'s own: Evangelist, Sentence of Suffering or Doomsday.', '圣职者的第三转随分支：福音传道者、苦痛断罪或末日裁决，各有自己的技能。'), icon: 'mastery' },
}
