// The skill tree: each level brings a skill point (engine/src/progression.ts), and these nodes
// spend them. General combat and life hold four and three branches everyone shares; the profession direction holds
// the profession's own tree, its path and its mastery.
// Existing ids/grants remain save-compatible. Combat talents are automatic: moving, attacking
// and defeating creatures trigger them without introducing another input/hotbar.

import { Rng, onPath, type Entity, type SkillDef } from '@openworld/engine'
import { thirdOf, type ProfessionDef } from '@openworld/modules'
import { FORM_BY_ID, makeItem } from './items.ts'
import { LIFE_SKILLS } from './life.ts'
import { ADVANCEMENT_SKILLS, HAZARDS, MASTERIES, PATHS } from './advancement.ts'

export const SKILL_DIRECTIONS = [
  // the talents every fighter shares, whatever their profession
  { id: 'combat', icon: 'sword', name: { en: 'General Combat', zh: '战斗通用' } },
  // the profession's own tree, then its second and third advancements (docs/advancement.md): one's path, and the mastery
  { id: 'profession', icon: 'advance', name: { en: 'Profession', zh: '职业' } },
  { id: 'life', icon: 'pack', name: { en: 'Life', zh: '生活' } },
] as const

export type SkillDirection = (typeof SKILL_DIRECTIONS)[number]['id']

// (the profession's own tree grows up; its paths go on after it side by side, every one shown, each path's third over it:
// ui/skillLayout.ts)
export const SKILL_BRANCHES: { id: string; direction: SkillDirection; icon: string; name: { en: string; zh: string }; way?: 'left' | 'right' | 'up' | 'down'; after?: string; byPath?: boolean }[] = [
  { id: 'swiftness', direction: 'combat', icon: 'swift', name: { en: 'Swiftness', zh: '迅捷' } },
  { id: 'survival', direction: 'combat', icon: 'shield', name: { en: 'Survival', zh: '生存' } },
  { id: 'damage', direction: 'combat', icon: 'sweep', name: { en: 'Damage', zh: '伤害' } },
  { id: 'profession', direction: 'profession', icon: 'origin', name: { en: 'Profession', zh: '职业' }, way: 'up' },
  { id: 'path', direction: 'profession', icon: 'path', name: { en: 'Path (Second)', zh: '二转分支' }, after: 'profession', byPath: true },
  { id: 'mastery', direction: 'profession', icon: 'mastery', name: { en: 'Mastery (Third)', zh: '三转' }, after: 'path', byPath: true },
  { id: 'gathering', direction: 'life', icon: 'axe', name: { en: 'Gathering', zh: '采集' } },
  { id: 'agriculture', direction: 'life', icon: 'farming', name: { en: 'Agriculture', zh: '农业' } },
  { id: 'husbandry', direction: 'life', icon: 'ranching', name: { en: 'Animal Husbandry', zh: '牧业' } },
  { id: 'smithing', direction: 'life', icon: 'smithing', name: { en: 'Smithing', zh: '锻造' } },
]

/** A profession's starter weapon and off-hand piece (common, no element, no rolled extras), handed over the first time it is taken up. */
const kit = (form: string, material: string) => makeItem(new Rng(0), FORM_BY_ID[form], { material, quality: 'common', element: null, affixes: false })

/**
 * The professions a trainer teaches (docs/skill-tree.md), from level 5 (engine/src/profession.ts).
 * Every profession and skill has its own illustrated pixel-art PNG.
 */
export const SKILL_PROFESSIONS: (ProfessionDef & { icon: string; name: { en: string; zh: string } })[] = ([
  { id: 'assassin', icon: 'assassin', name: { en: 'Assassin', zh: '刺客' }, doc: { en: 'Daggers, theirs alone; openers from the quiet and from behind, combos that end in a finisher.', zh: '专精匕首；从暗处、从背后先手，连击收尾。' }, weapon: kit('item/weapon/blade/dagger', 'iron'), offhand: kit('item/armor/parrying_dagger', 'iron') },
  { id: 'ranger', icon: 'ranger', name: { en: 'Ranger', zh: '游侠' }, doc: { en: 'Bows, theirs alone; a steady aim from afar, quick feet between shots.', zh: '专精弓箭；站稳了打得准、打得远，射完就走。' }, weapon: kit('item/weapon/ranged/bow', 'wood'), offhand: kit('item/armor/quiver', 'leather') },
  { id: 'mage', icon: 'mage', name: { en: 'Mage', zh: '法师' }, doc: { en: 'Staves, theirs alone; elemental spells that echo, a shield of mana, strength drawn from the fallen.', zh: '专精法杖；元素法术会回响，法力护盾护身，击倒敌人回复生命。' }, weapon: kit('item/weapon/magic/staff', 'wood'), offhand: kit('item/armor/tome', 'leather') },
  { id: 'swordsman', icon: 'swordsman', name: { en: 'Swordsman', zh: '剑客' }, doc: { en: 'The katana, theirs alone, a scabbard at the hip; a quick draw, a true cut, the next cut on its heels.', zh: '专精太刀，腰挎刀鞘；拔刀快，出刀准，一刀紧接一刀。' }, weapon: kit('item/weapon/blade/katana', 'iron'), offhand: kit('item/armor/scabbard', 'wood') },
  { id: 'cleric', icon: 'cleric', name: { en: 'Cleric', zh: '圣职者' }, doc: { en: 'The cross, theirs alone, swung as a mace is, a rosary at the belt; blows that mend, light that burns the night\'s things.', zh: '专精十字架，像钉锤一样抡，腰挂念珠；打中敌人能回血，圣光专烧夜里的东西。' }, weapon: kit('item/weapon/blunt/cross', 'iron'), offhand: kit('item/armor/rosary', 'wood') },
  // each with its three paths and its mastery (advancement.ts, docs/advancement.md)
] as (ProfessionDef & { icon: string; name: { en: string; zh: string } })[]).map((p) => ({ ...p, paths: PATHS[p.id], mastery: MASTERIES[p.id] }))
export const PROFESSION_BY_ID: Record<string, (typeof SKILL_PROFESSIONS)[number]> = Object.fromEntries(SKILL_PROFESSIONS.map((p) => [p.id, p]))

/** Unknown professions keep the profession hub, but never fall back to assassin skills; the path's and the mastery's hubs under their own names (the mastery's under the path's name for it). */
export function branchesForProfession(profession: string, path?: string) {
  const role = SKILL_PROFESSIONS.find((p) => p.id === profession)
  const way = role?.paths?.find((x) => x.id === path)
  const third = thirdOf(role, path)
  return SKILL_BRANCHES.map((b) =>
    b.id === 'profession' && role ? { ...b, icon: role.icon, name: role.name }
    : b.id === 'path' && way ? { ...b, icon: way.icon ?? b.icon, name: way.name as { en: string; zh: string } }
    : b.id === 'mastery' && third ? { ...b, icon: third.icon ?? b.icon, name: third.name as { en: string; zh: string } }
    : b)
}

export const SKILLS: SkillDef[] = [
  { id: 'light-footed', branch: 'swiftness', icon: 'swift', grant: { moveHaste: 0.15 }, name: { en: 'Light Footed', zh: '轻盈步伐' }, doc: { en: 'Movement speed +15% on average. Does not cross blocked tiles.', zh: '平均移动速度 +15%，仍受地形和碰撞限制。' } },
  { id: 'quick-hands', branch: 'swiftness', icon: 'quick-hands', requires: ['light-footed'], grant: { attackHaste: 0.15 }, name: { en: 'Quick Hands', zh: '快手' }, doc: { en: 'Attack speed +15% on average.', zh: '平均攻击速度 +15%。' } },
  { id: 'battle-tempo', branch: 'swiftness', icon: 'battle-tempo', requires: ['quick-hands'], ability: true, name: { en: 'Battle Tempo', zh: '战斗节奏' }, doc: { en: 'Attacking within 0.6 seconds of a successful step gains another 10% attack speed.', zh: '成功移动后的 0.6 秒内攻击，额外获得 10% 攻击速度。' } },
  { id: 'evasive-step', branch: 'swiftness', icon: 'evasive-step', requires: ['light-footed'], ability: true, name: { en: 'Evasive Step', zh: '灵巧闪身' }, doc: { en: 'For 0.6 seconds after a successful step, direct combat damage taken is reduced by 25%. Minimum 1 damage; not hunger or environmental damage.', zh: '成功移动后的 0.6 秒内，受到的直接战斗伤害降低 25%，最低仍为 1；不减免饥饿或环境伤害。' } },
  { id: 'pursuit', branch: 'swiftness', icon: 'pursuit', requires: ['evasive-step'], ability: true, name: { en: 'Pursuit', zh: '乘胜追击' }, doc: { en: 'Defeating a creature with an attack grants 25% movement speed for 3 seconds. Refreshes, does not stack.', zh: '攻击击败生物后，移动速度额外 +25%，持续 3 秒；重复触发刷新时间，不叠加。' } },
  { id: 'windrunner', branch: 'swiftness', icon: 'windrunner', requires: ['battle-tempo', 'pursuit'], cost: 2, ability: true, name: { en: 'Windrunner', zh: '疾风连击' }, doc: { en: 'After 3 successful steps, your next primary melee hit deals 50% extra damage and consumes the charge. Sweep targets do not consume or gain it.', zh: '每成功移动 3 格，下一次近战主目标命中伤害 +50%，随后消耗蓄势；横扫的副目标不触发。' } },
  // swiftness, deeper (docs/skill-tree.md): dodge, and a dash (Q) with what it opens
  { id: 'nimble', branch: 'swiftness', icon: 'nimble', requires: ['light-footed'], grant: { dodge: 0.05 }, name: { en: 'Nimble', zh: '灵巧' }, doc: { en: 'Dodge +5%: a direct combat blow misses you entirely.', zh: '闪避 +5%：直接战斗攻击有几率完全落空。' } },
  { id: 'acrobat', branch: 'swiftness', icon: 'acrobat', requires: ['nimble'], grant: { dodge: 0.07 }, name: { en: 'Acrobat', zh: '杂技' }, doc: { en: 'Dodge +7% more (dodge is capped at 50%).', zh: '闪避再 +7%（闪避上限 50%）。' } },
  { id: 'dash', branch: 'swiftness', icon: 'dash', requires: ['light-footed'], ability: true, name: { en: 'Dash', zh: '冲刺' }, doc: { en: '{key:dash}: dash up to 3 tiles the way you face, past nothing solid. 4-second cooldown.', zh: '按 {key:dash}：朝面向冲刺最多 3 格，不能穿过实体障碍。冷却 4 秒。' } },
  { id: 'slipstream', branch: 'swiftness', icon: 'slipstream', requires: ['dash'], ability: true, name: { en: 'Slipstream', zh: '疾行' }, doc: { en: 'After a dash, movement speed +30% for 2 seconds.', zh: '冲刺后 2 秒内移动速度 +30%。' } },
  { id: 'tailwind', branch: 'swiftness', icon: 'tailwind', requires: ['slipstream'], ability: true, name: { en: 'Tailwind', zh: '顺风' }, doc: { en: 'Dash goes 1 tile farther, and its cooldown is 1.5 seconds shorter.', zh: '冲刺距离 +1 格，冷却缩短 1.5 秒。' } },
  { id: 'phantom-step', branch: 'swiftness', icon: 'phantom-step', requires: ['dash'], ability: true, name: { en: 'Phantom Step', zh: '幻影步' }, doc: { en: 'Dash passes through creatures, and nothing can hit you for 0.5 seconds after.', zh: '冲刺可以穿过生物，冲刺后 0.5 秒内不会受到攻击。' } },
  { id: 'untouchable', branch: 'swiftness', icon: 'untouchable', requires: ['acrobat', 'phantom-step'], cost: 2, grant: { dodge: 0.03 }, ability: true, name: { en: 'Untouchable', zh: '无影' }, doc: { en: 'Dodge +3%. After you dodge a blow, your next attack within 2 seconds is a guaranteed critical hit.', zh: '闪避再 +3%。闪避一次攻击后，2 秒内的下一次攻击必定暴击。' } },

  { id: 'strength', branch: 'damage', icon: 'sword', grant: { atk: 1 }, name: { en: 'Strength', zh: '力量' }, doc: { en: 'Attack +1.', zh: '攻击 +1。' } },
  { id: 'heavy-blows', branch: 'damage', icon: 'hammer', requires: ['strength'], grant: { atk: 2 }, name: { en: 'Heavy Blows', zh: '重击' }, doc: { en: 'Attack +2.', zh: '攻击 +2。' } },
  { id: 'sweep', branch: 'damage', icon: 'sweep', requires: ['heavy-blows'], ability: true, name: { en: 'Sweep', zh: '横扫' }, doc: { en: 'A melee blow also strikes the creatures on either side of the tile ahead.', zh: '近战攻击同时命中前方格子左右两侧的生物。' } },
  { id: 'keen-eye', branch: 'damage', icon: 'critical', requires: ['strength'], grant: { critChance: 0.1 }, name: { en: 'Keen Eye', zh: '洞察弱点' }, doc: { en: 'Attacks on actors gain 10% critical chance. Critical hits deal 1.5 times damage before defence.', zh: '攻击生物的暴击率 +10%；暴击造成防御计算前 1.5 倍伤害。' } },
  { id: 'executioner', branch: 'damage', icon: 'executioner', requires: ['keen-eye'], ability: true, name: { en: 'Executioner', zh: '斩杀' }, doc: { en: 'Attack damage +25% against actors at or below 30% health.', zh: '攻击生命值不高于 30% 的生物时，伤害 +25%。' } },
  { id: 'deadly-focus', branch: 'damage', icon: 'deadly-focus', requires: ['sweep', 'executioner'], cost: 2, grant: { critChance: 0.05 }, ability: true, name: { en: 'Deadly Focus', zh: '致命专注' }, doc: { en: 'Critical chance +5%; critical damage rises from 1.5 to 2 times damage before defence.', zh: '暴击率再 +5%；暴击伤害由防御计算前 1.5 倍提高至 2 倍。' } },
  // damage, deeper: raw attack, critical rate and critical damage, and how a fight builds
  { id: 'brute', branch: 'damage', icon: 'brute', requires: ['heavy-blows'], grant: { atk: 3 }, name: { en: 'Brute', zh: '蛮力' }, doc: { en: 'Attack +3.', zh: '攻击 +3。' } },
  { id: 'precision', branch: 'damage', icon: 'precision', requires: ['keen-eye'], grant: { critChance: 0.05 }, name: { en: 'Precision', zh: '精准' }, doc: { en: 'Critical chance +5%.', zh: '暴击率 +5%。' } },
  { id: 'hemorrhage', branch: 'damage', icon: 'hemorrhage', requires: ['precision'], ability: true, name: { en: 'Hemorrhage', zh: '撕裂' }, doc: { en: 'A critical hit makes the target bleed: 1 damage a second for 4 seconds (ignores defence).', zh: '暴击会让目标流血：4 秒内每秒受到 1 点伤害（无视防御）。' } },
  { id: 'lethal-edge', branch: 'damage', icon: 'lethal-edge', requires: ['keen-eye'], grant: { critDamage: 0.25 }, name: { en: 'Lethal Edge', zh: '致命锋芒' }, doc: { en: 'Critical damage +25% (×1.5 becomes ×1.75).', zh: '暴击伤害 +25%（1.5 倍变为 1.75 倍）。' } },
  { id: 'brutal', branch: 'damage', icon: 'brutal', requires: ['lethal-edge'], grant: { critDamage: 0.25 }, name: { en: 'Brutal', zh: '残暴' }, doc: { en: 'Critical damage +25% more.', zh: '暴击伤害再 +25%。' } },
  { id: 'first-strike', branch: 'damage', icon: 'first-strike', requires: ['strength'], ability: true, name: { en: 'First Strike', zh: '先发制人' }, doc: { en: 'Hits on an actor at full health deal 30% more damage.', zh: '攻击满血目标时伤害 +30%。' } },
  { id: 'momentum', branch: 'damage', icon: 'momentum', requires: ['first-strike'], ability: true, name: { en: 'Momentum', zh: '连击势头' }, doc: { en: 'Each hit that lands within 1.5 seconds of the last adds 5% damage, up to 25%.', zh: '每次命中若与上一击相隔不到 1.5 秒，伤害叠加 +5%，最多 +25%。' } },
  { id: 'berserker', branch: 'damage', icon: 'berserker', requires: ['brutal', 'momentum'], cost: 2, ability: true, name: { en: 'Berserker', zh: '狂战之魂' }, doc: { en: 'At or below half health: damage +25% and critical chance +10%.', zh: '生命值不高于一半时：伤害 +25%，暴击率 +10%。' } },

  { id: 'vitality', branch: 'survival', icon: 'heart', grant: { maxHp: 4 }, name: { en: 'Vitality', zh: '体魄' }, doc: { en: 'Max health +4.', zh: '生命上限 +4。' } },
  { id: 'toughness', branch: 'survival', icon: 'shield', requires: ['vitality'], grant: { def: 1 }, name: { en: 'Toughness', zh: '坚韧' }, doc: { en: 'Defence +1: every blow you take is one weaker.', zh: '防御 +1：受到的每次伤害减 1。' } },
  { id: 'hardy', branch: 'survival', icon: 'hardy', requires: ['toughness'], grant: { maxHp: 6 }, name: { en: 'Hardy', zh: '强健' }, doc: { en: 'Max health +6.', zh: '生命上限 +6。' } },
  { id: 'defiance', branch: 'survival', icon: 'defiance', requires: ['hardy'], ability: true, name: { en: 'Defiance', zh: '绝境韧性' }, doc: { en: 'At or below 30% health, direct combat damage taken is reduced by 25%. Minimum 1; not hunger or environmental damage.', zh: '生命值不高于 30% 时，直接战斗伤害降低 25%，最低仍为 1；不减免饥饿或环境伤害。' } },
  { id: 'iron-stomach', branch: 'survival', icon: 'drumstick', requires: ['vitality'], grant: { hungerEvery: 240 }, name: { en: 'Iron Stomach', zh: '耐饿' }, doc: { en: 'You grow hungry a third more slowly.', zh: '饥饿速度降低三分之一。' } },
  { id: 'second-wind', branch: 'survival', icon: 'renew', requires: ['iron-stomach'], ability: true, name: { en: 'Second Wind', zh: '自愈' }, doc: { en: 'You heal whenever your food bar is at least half full, not only when nearly full.', zh: '饱食度过半就会自动回血，而不必接近全满。' } },
  { id: 'last-stand', branch: 'survival', icon: 'last-stand', requires: ['defiance', 'second-wind'], cost: 2, ability: true, name: { en: 'Last Stand', zh: '不屈意志' }, doc: { en: 'A lethal direct combat hit leaves you at 1 health, once every 30 seconds. Does not save you from hunger or environmental damage.', zh: '致命的直接战斗伤害会使你保留 1 点生命，冷却 30 秒；不能抵御饥饿或环境造成的死亡。' } },
  // survival, deeper: health, defence, hunger, regeneration, and what saves you at the brink
  { id: 'iron-will', branch: 'survival', icon: 'iron-will', requires: ['hardy'], grant: { maxHp: 8 }, name: { en: 'Iron Will', zh: '钢铁意志' }, doc: { en: 'Max health +8.', zh: '生命上限 +8。' } },
  { id: 'thick-skin', branch: 'survival', icon: 'thick-skin', requires: ['toughness'], grant: { def: 1 }, name: { en: 'Thick Skin', zh: '厚皮' }, doc: { en: 'Defence +1.', zh: '防御 +1。' } },
  { id: 'fortress', branch: 'survival', icon: 'fortress', requires: ['thick-skin'], grant: { def: 2 }, name: { en: 'Fortress', zh: '坚城' }, doc: { en: 'Defence +2.', zh: '防御 +2。' } },
  { id: 'frugal', branch: 'survival', icon: 'frugal', requires: ['iron-stomach'], grant: { hungerEvery: 240 }, name: { en: 'Frugal', zh: '节食' }, doc: { en: 'You grow hungry more slowly still (fed, a point every 96 game minutes instead of 72).', zh: '饥饿速度进一步降低（吃饱时每 96 游戏分钟掉一点，而不是 72 分钟）。' } },
  { id: 'hearty-meals', branch: 'survival', icon: 'hearty-meals', requires: ['iron-stomach'], ability: true, name: { en: 'Hearty Meals', zh: '饱餐' }, doc: { en: 'Food fills you 50% more.', zh: '食物恢复的饱食度 +50%。' } },
  { id: 'regeneration', branch: 'survival', icon: 'regeneration', requires: ['second-wind'], ability: true, name: { en: 'Regeneration', zh: '再生' }, doc: { en: 'You heal whenever your food bar is at least a quarter full.', zh: '饱食度只要不少于四分之一就会自动回血。' } },
  { id: 'adrenaline', branch: 'survival', icon: 'adrenaline', requires: ['defiance'], ability: true, name: { en: 'Adrenaline', zh: '肾上腺素' }, doc: { en: 'When a blow leaves you at or below 30% health: movement speed +30% and 1 health a second for 5 seconds. Once a minute.', zh: '受到攻击后生命值不高于 30% 时：5 秒内移动速度 +30%，每秒恢复 1 点生命。每分钟最多一次。' } },
  { id: 'phoenix', branch: 'survival', icon: 'phoenix', requires: ['fortress', 'regeneration'], cost: 2, ability: true, name: { en: 'Phoenix', zh: '涅槃' }, doc: { en: 'Once a day, any lethal damage — blows, fire, hunger — leaves you at 30% health, untouchable for 3 seconds.', zh: '每天一次：任何致命伤害（攻击、火焰、饥饿）都会让你保留 30% 生命，并在 3 秒内免疫伤害。' } },

  { id: 'assassin-training', branch: 'profession', profession: 'assassin', icon: 'blade-mastery', ability: true, name: { en: 'Short-Blade Training', zh: '短兵精通' }, doc: { en: 'Dagger attacks gain +1 power. Like every assassin talent, it answers daggers only, never common weapons.', zh: '使用匕首攻击时威力 +1。刺客的所有天赋都只对匕首生效，通用武器无效。' } },
  { id: 'ambush', branch: 'profession', profession: 'assassin', icon: 'shadow', requires: ['assassin-training'], ability: true, name: { en: 'Ambush', zh: '暗影先手' }, doc: { en: 'After 4 seconds without attacking or taking combat damage, the next primary melee hit gains 50% damage. This is an opener, not invisibility.', zh: '连续 4 秒未攻击且未受到战斗伤害后，下一次近战主目标命中伤害 +50%；这是先手蓄势，不是隐身。' } },
  { id: 'relentless', branch: 'profession', profession: 'assassin', icon: 'combo', requires: ['ambush'], ability: true, name: { en: 'Relentless', zh: '连环刺击' }, doc: { en: 'Every third primary melee hit on the same actor gains 60% damage. Each hit must land within 2 seconds; changing target, missing or using a ranged attack resets the combo.', zh: '对同一生物的每第 3 次近战主目标命中，伤害 +60%。相邻命中间隔不得超过 2 秒；换目标、挥空或远程攻击会中断连击。' } },
  { id: 'backstab', branch: 'profession', profession: 'assassin', icon: 'dagger', requires: ['assassin-training'], ability: true, name: { en: 'Backstab', zh: '背刺' }, doc: { en: 'Primary melee attacks from behind the target gain 40% damage, judged by the target facing. Side and front attacks do not qualify.', zh: '从目标背后进行近战主目标攻击，伤害 +40%；根据目标朝向判断，侧面和正面不触发。' } },
  { id: 'shadow-recovery', branch: 'profession', profession: 'assassin', icon: 'shadow-recovery', requires: ['backstab'], ability: true, name: { en: 'Shadow Recovery', zh: '影中汲取' }, doc: { en: 'Defeating a creature with a dagger restores 10% of max health, rounded up; never above max health.', zh: '用匕首击败生物时，恢复生命上限的 10%（向上取整），不超过生命上限。' } },
  { id: 'death-dance', branch: 'profession', profession: 'assassin', icon: 'death-dance', requires: ['relentless', 'shadow-recovery'], cost: 2, ability: true, name: { en: 'Death Dance', zh: '死亡之舞' }, doc: { en: 'A qualifying Ambush or Backstab is guaranteed to critically hit. Does not turn Sweep secondary hits into critical openers.', zh: '触发暗影先手或背刺的攻击必定暴击；不会让横扫副目标获得先手或背刺暴击。' } },

  // the ranger: bows; one arm stands and aims, the other shoots and moves
  { id: 'ranger-archery', branch: 'profession', profession: 'ranger', icon: 'ranger-archery', ability: true, name: { en: 'Archery', zh: '箭术' }, doc: { en: 'Bows gain +1 power and +1 range. Ranger talents answer bows only.', zh: '弓的威力 +1，射程 +1。游侠天赋只对弓生效。' } },
  { id: 'steady-aim', branch: 'profession', profession: 'ranger', icon: 'steady-aim', requires: ['ranger-archery'], ability: true, name: { en: 'Steady Aim', zh: '稳定瞄准' }, doc: { en: 'Bow hits gain 30% damage when you have not moved for 1 second.', zh: '1 秒内没有移动时，弓箭命中伤害 +30%。' } },
  { id: 'sniper', branch: 'profession', profession: 'ranger', icon: 'sniper', requires: ['steady-aim'], ability: true, name: { en: 'Sniper', zh: '狙击' }, doc: { en: 'Bow hits on targets 3 or more tiles away gain 25% damage.', zh: '弓箭命中 3 格及以外的目标时，伤害 +25%。' } },
  { id: 'fleet-archer', branch: 'profession', profession: 'ranger', icon: 'fleet-archer', requires: ['ranger-archery'], ability: true, name: { en: 'Fleet Archer', zh: '游击' }, doc: { en: 'After a bow hit lands, movement speed +20% for 1.5 seconds.', zh: '弓箭命中后，1.5 秒内移动速度 +20%。' } },
  { id: 'quick-draw', branch: 'profession', profession: 'ranger', icon: 'quick-draw', requires: ['fleet-archer'], ability: true, name: { en: 'Quick Draw', zh: '快速拉弓' }, doc: { en: 'Attack speed +20% while holding a bow.', zh: '手持弓时攻击速度 +20%。' } },
  { id: 'hunters-mark', branch: 'profession', profession: 'ranger', icon: 'hunters-mark', requires: ['sniper', 'quick-draw'], cost: 2, ability: true, name: { en: "Hunter's Mark", zh: '猎手印记' }, doc: { en: 'Every third bow hit in a row on the same target is a guaranteed critical hit.', zh: '对同一目标连续第 3 次弓箭命中必定暴击。' } },
  // the mage: wands and staves; one arm deepens the spells, the other keeps the caster alive
  { id: 'mage-focus', branch: 'profession', profession: 'mage', icon: 'mage-focus', ability: true, name: { en: 'Arcane Focus', zh: '奥术专注' }, doc: { en: 'Staves gain +1 power. Mage talents answer staves only; a wand is a common weapon.', zh: '法杖的威力 +1。法师天赋只对法杖生效；魔杖是通用武器。' } },
  { id: 'elemental-attunement', branch: 'profession', profession: 'mage', icon: 'elemental-attunement', requires: ['mage-focus'], ability: true, name: { en: 'Elemental Attunement', zh: '元素亲和' }, doc: { en: 'Spells from a staff with an element (fire, ice, lightning…) gain 25% damage.', zh: '带元素（火、冰、雷……）的法杖施法伤害 +25%。' } },
  { id: 'spell-echo', branch: 'profession', profession: 'mage', icon: 'spell-echo', requires: ['elemental-attunement'], ability: true, name: { en: 'Spell Echo', zh: '法术回响' }, doc: { en: 'Every fourth spell that lands is a guaranteed critical hit.', zh: '每第 4 次命中的法术必定暴击。' } },
  { id: 'mana-shield', branch: 'profession', profession: 'mage', icon: 'mana-shield', requires: ['mage-focus'], ability: true, name: { en: 'Mana Shield', zh: '法力护盾' }, doc: { en: 'Direct combat damage taken −20% while holding a staff.', zh: '手持法杖时，受到的直接战斗伤害 −20%。' } },
  { id: 'arcane-recovery', branch: 'profession', profession: 'mage', icon: 'arcane-recovery', requires: ['mana-shield'], ability: true, name: { en: 'Arcane Recovery', zh: '奥术汲取' }, doc: { en: 'Felling a creature with a staff restores 3 health.', zh: '用法杖击倒生物时恢复 3 点生命。' } },
  { id: 'archmage', branch: 'profession', profession: 'mage', icon: 'archmage', requires: ['spell-echo', 'arcane-recovery'], cost: 2, ability: true, name: { en: 'Archmage', zh: '大法师' }, doc: { en: 'Staves gain +2 more power and +1 range.', zh: '法杖的威力再 +2，射程 +1。' } },
  // the swordsman (2026-11-03): the katana's own; an arm of the edge, an arm of the feet, the way of the blade at the end
  { id: 'kenjutsu', branch: 'profession', profession: 'swordsman', icon: 'kenjutsu', ability: true, passive: { when: { weapon: 'own' }, damage: 0.1, attackHaste: 0.05 }, name: { en: 'Kenjutsu', zh: '剑术' }, doc: { en: 'With a katana: damage +10%, attack speed +5%. Like every swordsman talent that strikes, it answers the katana only.', zh: '持太刀时伤害 +10%，攻击速度 +5%。剑客的攻击类天赋都只对太刀生效。' } },
  { id: 'honed-blade', branch: 'profession', profession: 'swordsman', icon: 'honed-blade', requires: ['kenjutsu'], ability: true, passive: { when: { weapon: 'own' }, crit: 0.05 }, name: { en: 'Honed Blade', zh: '砥刃' }, doc: { en: 'With a katana: critical chance +5%.', zh: '持太刀时暴击率 +5%。' } },
  { id: 'clean-cut', branch: 'profession', profession: 'swordsman', icon: 'clean-cut', requires: ['honed-blade'], ability: true, passive: { when: { weapon: 'own', target: { wounded: 0.3 } }, damage: 0.3 }, name: { en: 'Clean Cut', zh: '一刀两断' }, doc: { en: 'With a katana, against a foe at three tenths of its health or less: damage +30%.', zh: '持太刀攻击生命不高于三成的敌人时，伤害 +30%。' } },
  { id: 'fleet-stance', branch: 'profession', profession: 'swordsman', icon: 'fleet-stance', requires: ['kenjutsu'], ability: true, passive: { moveHaste: 0.06, dodge: 0.04 }, name: { en: 'Fleet Stance', zh: '疾步' }, doc: { en: 'Movement speed +6%, dodge +4%.', zh: '移动速度 +6%，闪避 +4%。' } },
  { id: 'parry', branch: 'profession', profession: 'swordsman', icon: 'parry', requires: ['fleet-stance'], ability: true, passive: { when: { weapon: 'own' }, front: 0.1 }, name: { en: 'Parry', zh: '见切' }, doc: { en: 'With a katana: a blow from the way you face is turned aside one time in ten.', zh: '持太刀时，来自正面的攻击有十分之一的几率被格开。' } },
  { id: 'way-of-the-blade', branch: 'profession', profession: 'swordsman', icon: 'way-of-the-blade', requires: ['clean-cut', 'parry'], cost: 2, ability: true, passive: { when: { weapon: 'own' }, damage: 0.15, critDamage: 0.3 }, name: { en: 'Way of the Blade', zh: '剑之道' }, doc: { en: 'Capstone: with a katana, damage +15% and critical damage +30%.', zh: '终极：持太刀时伤害 +15%，暴击伤害 +30%。' } },
  // the cleric (2026-11-12): the cross; one arm the blow and the light, the other the body kept and those who follow
  { id: 'faith', branch: 'profession', profession: 'cleric', icon: 'faith', ability: true, passive: { when: { weapon: 'own' }, damage: 0.1, drain: 1 }, name: { en: 'Faith', zh: '信仰' }, doc: { en: 'With a cross: damage +10%, and each blow that lands draws back 1 health. Like every cleric talent that strikes, it answers the cross only.', zh: '持十字架时伤害 +10%，每次命中吸取 1 点生命。和所有会出手的圣职者天赋一样，只对十字架生效。' } },
  { id: 'blessed-arms', branch: 'profession', profession: 'cleric', icon: 'blessed-arms', requires: ['faith'], ability: true, passive: { when: { weapon: 'own', target: { tag: ['undead', 'nightborn'] } }, damage: 0.2 }, name: { en: 'Blessed Arms', zh: '祝圣之器' }, doc: { en: 'With a cross, against the undead and the night\'s creatures: damage +20%.', zh: '持十字架攻击亡灵和夜行生物时，伤害 +20%。' } },
  { id: 'zeal', branch: 'profession', profession: 'cleric', icon: 'zeal', requires: ['blessed-arms'], ability: true, passive: { when: { weapon: 'own' }, attackHaste: 0.08, crit: 0.05 }, name: { en: 'Zeal', zh: '热忱' }, doc: { en: 'With a cross: attack speed +8%, critical chance +5%.', zh: '持十字架时攻击速度 +8%，暴击率 +5%。' } },
  { id: 'devotion', branch: 'profession', profession: 'cleric', icon: 'devotion', requires: ['faith'], grant: { maxHp: 10 }, name: { en: 'Devotion', zh: '虔诚' }, doc: { en: 'Max health +10.', zh: '生命上限 +10。' } },
  { id: 'steadfast', branch: 'profession', profession: 'cleric', icon: 'steadfast', requires: ['devotion'], ability: true, passive: { taken: -0.08 }, name: { en: 'Steadfast', zh: '坚贞' }, doc: { en: 'Combat damage taken −8%.', zh: '受到的战斗伤害 −8%。' } },
  { id: 'holy-vessel', branch: 'profession', profession: 'cleric', icon: 'holy-vessel', requires: ['zeal', 'steadfast'], cost: 2, ability: true, passive: { when: { weapon: 'own' }, damage: 0.15, taken: -0.1 }, name: { en: 'Holy Vessel', zh: '圣器' }, doc: { en: 'Capstone: with a cross, damage +15% and combat damage taken −10%.', zh: '终极天赋：持十字架时伤害 +15%，受到的战斗伤害 −10%。' } },
  { id: 'long-reach', branch: 'gathering', icon: 'magnet', grant: { magnet: 2 }, name: { en: 'Long Reach', zh: '长臂' }, doc: { en: 'Dropped things fly to you from two tiles farther.', zh: '掉落物的吸取范围扩大 2 格。' } },
  { id: 'woodcutter', branch: 'gathering', icon: 'axe', requires: ['long-reach'], ability: true, name: { en: 'Woodcutter', zh: '伐木工' }, doc: { en: 'A tree you fell gives one more log.', zh: '砍倒的树多掉一根木头。' } },
  { id: 'big-pack', branch: 'gathering', icon: 'pack', requires: ['woodcutter'], grant: { bagRows: 1 }, name: { en: 'Big Pack', zh: '大背包' }, doc: { en: 'One more row in the bag.', zh: '背包多一行。' } },
  { id: 'firemaker', branch: 'gathering', icon: 'flame', requires: ['big-pack'], ability: true, name: { en: 'Firemaker', zh: '钻木取火' }, doc: { en: 'Light a campfire, brazier or candles with a plain stick.', zh: '用一根普通树枝就能点燃营火、火盆或蜡烛。' } },
]

// the active skills (engine/src/actives.ts): cast from the skill bar (Shift+1–6), then they rest. Everyone's four — two
// blows, a quickness, a mending — and four for each profession. Cooldowns in ticks (10 a second).
const ACTIVE = (id: string, branch: string, requires: string[], active: SkillDef['active'], en: string, zh: string, docEn: string, docZh: string, profession?: string): SkillDef =>
  ({ id, branch, icon: id, requires, ability: true, active, ...(profession && { profession }), name: { en, zh }, doc: { en: `${docEn} Cooldown ${active!.cooldown / 10} s.`, zh: `${docZh}冷却 ${active!.cooldown / 10} 秒。` } })

export const ACTIVE_SKILLS: SkillDef[] = [
  ACTIVE('whirlwind', 'damage', ['sweep'], { kind: 'whirlwind', cooldown: 80, power: 1.2 }, 'Whirlwind', '旋风斩', 'Spin: strike every foe on the eight cells around you (×1.2).', '原地旋转，攻击周围 8 格的所有敌人（1.2 倍伤害）。'),
  ACTIVE('cleave', 'damage', ['strength'], { kind: 'cleave', cooldown: 60, power: 2.5 }, 'Cleave', '重劈', 'One heavy blow on the cell ahead (×2.5).', '对前方一格重重劈下（2.5 倍伤害）。'),
  ACTIVE('gale-step', 'swiftness', ['light-footed'], { kind: 'haste', cooldown: 200, ticks: 50 }, 'Gale Step', '疾风步', 'Movement speed +50% for 5 seconds.', '5 秒内移动速度 +50%。'),
  ACTIVE('mend', 'survival', ['regeneration'], { kind: 'mend', cooldown: 300, power: 0.3 }, 'Mend', '疗伤', 'Restore 30% of your max health at once.', '立即恢复 30% 生命上限的生命。'),

  ACTIVE('shadow-strike', 'profession', ['assassin-training'], { kind: 'shadow-strike', cooldown: 100, power: 1.5, range: 4 }, 'Shadow Strike', '影袭', 'Step out of the shadows behind the nearest foe within 4 cells and strike (×1.5; Backstab applies).', '闪到 4 格内最近敌人的背后并攻击（1.5 倍伤害，可触发背刺）。', 'assassin'),
  ACTIVE('envenom', 'profession', ['assassin-training'], { kind: 'envenom', cooldown: 200, count: 5 }, 'Envenom', '淬毒', 'Your next 5 blows each open a bleed (1 a second for 4 seconds).', '接下来 5 次攻击都会让目标流血（4 秒内每秒 1 点）。', 'assassin'),
  ACTIVE('smoke-bomb', 'profession', ['shadow-strike'], { kind: 'veil', cooldown: 250, ticks: 30 }, 'Smoke Bomb', '烟雾弹', 'For 3 seconds no creature can see you to attack you.', '3 秒内怪物看不见你，不会攻击你。', 'assassin'),
  ACTIVE('flurry', 'profession', ['envenom'], { kind: 'flurry', cooldown: 80, power: 0.6, count: 4 }, 'Flurry', '千刃', 'Four quick stabs on the cell ahead (×0.6 each).', '对前方一格快速连刺 4 次（每次 0.6 倍伤害）。', 'assassin'),


  ACTIVE('multishot', 'profession', ['ranger-archery'], { kind: 'multishot', range: 6, cooldown: 80, power: 0.8 }, 'Multishot', '多重箭', 'Three arrows side by side, each striking the first foe in its line (×0.8).', '并排射出 3 支箭，各自命中所在直线上的第一个敌人（0.8 倍伤害）。', 'ranger'),
  ACTIVE('leap-shot', 'profession', ['ranger-archery'], { kind: 'leap-shot', range: 6, cooldown: 100, power: 1.2, count: 2 }, 'Leap Shot', '后跃射击', 'Leap 2 cells back and loose an arrow ahead (×1.2).', '向后跃 2 格，同时向前射出一箭（1.2 倍伤害）。', 'ranger'),
  ACTIVE('piercing-arrow', 'profession', ['multishot'], { kind: 'pierce', range: 6, cooldown: 100, power: 1.3 }, 'Piercing Arrow', '穿透箭', 'An arrow through every foe in its line, up to the first wall (×1.3).', '一箭贯穿直线上的所有敌人，直到墙壁（1.3 倍伤害）。', 'ranger'),
  ACTIVE('arrow-rain', 'profession', ['leap-shot'], { kind: 'rain', range: 6, cooldown: 200, power: 0.6, count: 3 }, 'Arrow Rain', '箭雨', 'Arrows fall on the 3×3 around the first foe ahead, once a second for 3 seconds (×0.6 each).', '在前方第一个敌人周围 3×3 范围落下箭雨，每秒一轮，持续 3 秒（每轮 0.6 倍伤害）。', 'ranger'),

  ACTIVE('fireball', 'profession', ['mage-focus'], { kind: 'fireball', range: 5, cooldown: 60, power: 1.5, element: 'fire' }, 'Fireball', '火球', 'A ball of fire that bursts on the first thing ahead, striking the 3×3 around it (×1.5, fire).', '发射火球，在前方第一个目标处爆炸，波及周围 3×3（1.5 倍火焰伤害）。', 'mage'),
  ACTIVE('frost-nova', 'profession', ['mage-focus'], { kind: 'nova', cooldown: 150, power: 0.5, range: 2, element: 'ice', afflict: 'frozen', ticks: 20 }, 'Frost Nova', '冰霜新星', 'Every foe within 2 cells is struck by ice (×0.5) and frozen for 2 seconds.', '周围 2 格内的敌人受到冰霜伤害（0.5 倍）并被冻结 2 秒。', 'mage'),
  ACTIVE('chain-lightning', 'profession', ['fireball'], { kind: 'chain', range: 5, cooldown: 100, power: 1.2, count: 3, element: 'lightning' }, 'Chain Lightning', '闪电链', 'Lightning strikes the first foe ahead and leaps on to 2 more nearby (×1.2 each).', '闪电击中前方第一个敌人，再跳向附近的另外 2 个（每次 1.2 倍伤害）。', 'mage'),
  ACTIVE('blink', 'profession', ['frost-nova'], { kind: 'blink', cooldown: 120, range: 4 }, 'Blink', '闪现', 'Vanish and reappear up to 4 cells ahead, through creatures but not walls.', '瞬移到前方最多 4 格处，可穿过生物，不能穿墙。', 'mage'),
  ACTIVE('cross-cut', 'profession', ['kenjutsu'], { kind: 'arc', cooldown: 70, power: 1.4 }, 'Cross Cut', '十字斩', 'A cut across the three cells ahead (×1.4).', '横斩前方 3 格（1.4 倍伤害）。', 'swordsman'),
  ACTIVE('rising-slash', 'profession', ['kenjutsu'], { kind: 'bash', cooldown: 100, power: 1.6, afflict: 'knelt', ticks: 10 }, 'Rising Slash', '挑斩', 'An upward cut at the cell ahead (×1.6): the foe is brought to its knees for 1 s.', '向上挑斩前方一格（1.6 倍伤害），使其跪地 1 秒。', 'swordsman'),
  ACTIVE('step-cut', 'profession', ['cross-cut'], { kind: 'charge', cooldown: 120, power: 1.6, range: 3 }, 'Step Cut', '踏斩', 'Rush up to 3 cells at the first foe ahead and cut it (×1.6).', '冲向前方 3 格内的第一个敌人并斩击（1.6 倍伤害）。', 'swordsman'),
  ACTIVE('smite', 'profession', ['faith'], { kind: 'bash', cooldown: 70, power: 1.8, afflict: 'stunned', ticks: 5 }, 'Smite', '惩击', 'A blow of the cross on the cell ahead (×1.8) that dazes the foe a moment.', '用十字架砸向前方一格（1.8 倍伤害），让敌人短暂眩晕。', 'cleric'),
  ACTIVE('prayer', 'profession', ['faith'], { kind: 'mend', cooldown: 250, power: 0.2, range: 6 }, 'Prayer', '祷告', 'A prayer that mends you and every companion within 6 cells: a fifth of each one\'s max health.', '一段祷告，为你和身边 6 格内的每个同伴恢复各自生命上限五分之一的生命。', 'cleric'),
  ACTIVE('consecrate', 'profession', ['smite'], { kind: 'field', leaves: HAZARDS.holy, pattern: 'around', cooldown: 260, ticks: 60, buff: { party: true, regen: 2 } }, 'Consecrate', '祝圣', 'Hallow the 3×3 round you for 6 s: you and your companions within 6 cells mend 2 a second, and the undead that walk onto it burn.', '把你周围 3×3 化为圣域，持续 6 秒：你和身边 6 格内的同伴每秒恢复 2 点生命，走上去的亡灵会被灼伤。', 'cleric'),
  ACTIVE('rebuke', 'profession', ['prayer'], { kind: 'nova', cooldown: 150, power: 0.8, range: 2, afflict: 'knelt', ticks: 10 }, 'Rebuke', '斥退', 'Every foe within 2 cells is struck (×0.8) and brought to its knees for 1 s.', '周围 2 格内的敌人受到攻击（0.8 倍伤害）并跪地 1 秒。', 'cleric'),
  ACTIVE('whirl-cut', 'profession', ['rising-slash'], { kind: 'whirlwind', cooldown: 110, power: 1, count: 2 }, 'Whirl Cut', '回旋斩', 'Turn twice where you stand: every foe round you is cut twice (×1.0 each).', '原地回旋两圈：周围的敌人各受到两次攻击（每次 1.0 倍伤害）。', 'swordsman'),
]


// the professions, deeper (docs/skill-tree.md): each grows to twenty-two nodes — three more active skills (the last an
// ultimate, two points), five that strengthen its active skills (Dungeon Fighter's enhancements: SkillDef.modifies),
// three talents of its own, and a capstone (two points) that answers what the tree has become.
/** A talent that strengthens one active skill (its numbers added when it is cast: actives.ts effectiveActive). */
const MOD = (id: string, profession: string, requires: string[], modifies: NonNullable<SkillDef['modifies']>, en: string, zh: string, docEn: string, docZh: string): SkillDef =>
  ({ id, branch: 'profession', profession, icon: id, requires, modifies, name: { en, zh }, doc: { en: docEn, zh: docZh } })
/** A talent of the profession's own (a number it grants, or an ability the engine answers). */
const TALENT = (id: string, profession: string, requires: string[], en: string, zh: string, docEn: string, docZh: string, extra: Partial<SkillDef> = {}): SkillDef =>
  ({ id, branch: 'profession', profession, icon: id, requires, ...(extra.grant ? {} : { ability: true }), ...extra, name: { en, zh }, doc: { en: docEn, zh: docZh } })

export const PROFESSION_DEEPER: SkillDef[] = [
  // the assassin: shadow, venom, the knife
  ACTIVE('throwing-knives', 'profession', ['backstab'], { kind: 'shot', missile: 'knife', cooldown: 50, power: 1, range: 5 }, 'Throwing Knives', '飞刀', 'Throw a knife at the first foe ahead, up to 5 cells (×1.0).', '向前掷出飞刀，命中 5 格内第一个敌人（1.0 倍伤害）。', 'assassin'),
  ACTIVE('fan-of-knives', 'profession', ['flurry'], { kind: 'whirlwind', cooldown: 100, power: 0.8, bleed: 40 }, 'Fan of Knives', '回旋刃', 'Blades spin out to every foe on the eight cells around you (×0.8), and they bleed.', '刀刃向四周旋出，攻击周围 8 格的敌人（0.8 倍伤害）并使其流血。', 'assassin'),
  { ...ACTIVE('vanishing-strikes', 'profession', ['shadow-mastery', 'fan-of-knives'], { kind: 'shadow-strike', cooldown: 250, power: 1.5, range: 5, count: 3 }, 'Vanishing Strikes', '绝影', 'Ultimate: step behind up to 3 foes within 5 cells, one after another, striking each (×1.5).', '终极：依次闪到 5 格内至多 3 个敌人背后，各攻击一次（1.5 倍伤害）。', 'assassin'), cost: 2 },
  MOD('shadow-mastery', 'assassin', ['shadow-strike'], { skill: 'shadow-strike', cooldown: -30, range: 2 }, 'Shadow Strike: Mastery', '影袭·精通', 'Shadow Strike: cooldown −3 s, reach +2 cells.', '影袭：冷却 −3 秒，距离 +2 格。'),
  MOD('potent-venom', 'assassin', ['envenom'], { skill: 'envenom', count: 3 }, 'Envenom: Potent', '淬毒·剧毒', 'Envenom: 3 more poisoned blows.', '淬毒：淬毒次数 +3。'),
  MOD('lingering-smoke', 'assassin', ['smoke-bomb'], { skill: 'smoke-bomb', ticks: 20 }, 'Smoke Bomb: Lingering', '烟雾弹·延时', 'Smoke Bomb: lasts 2 s longer.', '烟雾弹：持续 +2 秒。'),
  MOD('flurry-plus', 'assassin', ['flurry'], { skill: 'flurry', count: 2 }, 'Flurry: Unending', '千刃·极', 'Flurry: 2 more stabs.', '千刃：连刺 +2 次。'),
  MOD('fan-plus', 'assassin', ['fan-of-knives'], { skill: 'fan-of-knives', power: 0.3 }, 'Fan of Knives: Keen', '回旋刃·锋利', 'Fan of Knives: power +0.3.', '回旋刃：伤害倍率 +0.3。'),
  TALENT('venom-mastery', 'assassin', ['potent-venom'], 'Venom Mastery', '毒刃精通', 'With a dagger: +20% damage to a bleeding target.', '持匕首攻击流血中的目标时伤害 +20%。'),
  TALENT('nightstalker', 'assassin', ['lingering-smoke'], 'Nightstalker', '夜行者', 'With a dagger: +15% damage at night.', '持匕首在夜晚造成的伤害 +15%。'),
  TALENT('nimble-blade', 'assassin', ['ambush'], 'Nimble Blade', '敏捷', 'With a dagger in hand: dodge +8%.', '手持匕首时闪避 +8%。'),
  TALENT('master-assassin', 'assassin', ['death-dance', 'vanishing-strikes'], 'Master Assassin', '暗杀大师', 'Capstone: whenever you fell a creature, Shadow Strike is ready again at once.', '终极天赋：每击倒一个生物，影袭的冷却立即刷新。', { cost: 2 }),


  // the ranger: the shot, the eye, the storm
  ACTIVE('concussive-shot', 'profession', ['steady-aim'], { kind: 'shot', missile: 'arrow', cooldown: 80, power: 1, range: 6, afflict: 'stunned', ticks: 10 }, 'Concussive Shot', '震荡箭', 'An arrow that stuns the first foe in its line for 1 s (×1.0).', '射出一箭，命中直线上第一个敌人并使其眩晕 1 秒（1.0 倍伤害）。', 'ranger'),
  ACTIVE('hawk-eye', 'profession', ['fleet-archer'], { kind: 'aim', cooldown: 250, ticks: 50 }, 'Far Sight', '远眺', 'For 5 seconds: a shooting weapon reaches 3 cells farther, critical chance +20%.', '5 秒内射击武器射程 +3 格，暴击率 +20%。', 'ranger'),
  { ...ACTIVE('arrow-storm', 'profession', ['multishot-plus', 'rain-plus'], { kind: 'multishot', cooldown: 300, power: 1.2, range: 6, count: 5, through: true }, 'Arrow Storm', '万箭齐发', 'Ultimate: five arrows side by side, each through every foe in its line (×1.2).', '终极：并排射出 5 支箭，每支都贯穿所在直线上的所有敌人（1.2 倍伤害）。', 'ranger'), cost: 2 },
  MOD('multishot-plus', 'ranger', ['multishot'], { skill: 'multishot', count: 2 }, 'Multishot: Five', '多重箭·五连', 'Multishot: 2 more arrows.', '多重箭：箭数 +2。'),
  MOD('leap-plus', 'ranger', ['leap-shot'], { skill: 'leap-shot', count: 1, cooldown: -20 }, 'Leap Shot: Far Leap', '后跃射击·远', 'Leap Shot: 1 cell farther back, cooldown −2 s.', '后跃射击：后跳 +1 格，冷却 −2 秒。'),
  MOD('pierce-plus', 'ranger', ['piercing-arrow'], { skill: 'piercing-arrow', power: 0.5 }, 'Piercing Arrow: Armour Breaker', '穿透箭·破甲', 'Piercing Arrow: power +0.5.', '穿透箭：伤害倍率 +0.5。'),
  MOD('rain-plus', 'ranger', ['arrow-rain'], { skill: 'arrow-rain', count: 2 }, 'Arrow Rain: Downpour', '箭雨·延续', 'Arrow Rain: 2 more volleys.', '箭雨：轮数 +2。'),
  MOD('concussive-plus', 'ranger', ['concussive-shot'], { skill: 'concussive-shot', ticks: 10 }, 'Concussive Shot: Heavy', '震荡箭·重', 'Concussive Shot: stun +1 s.', '震荡箭：眩晕 +1 秒。'),
  TALENT('light-gear', 'ranger', ['hawk-eye'], 'Light Gear', '轻装', 'Movement speed +10%.', '移动速度 +10%。', { grant: { moveHaste: 0.1 } }),
  TALENT('deadly-shot', 'ranger', ['sniper'], 'Deadly Shot', '致命射击', 'With a bow: critical damage +25%.', '持弓时暴击伤害 +25%。'),
  TALENT('windwalker', 'ranger', ['quick-draw'], 'Windwalker', '风行', 'With a bow in hand: dodge +5%.', '手持弓时闪避 +5%。'),
  TALENT('marksman', 'ranger', ['hunters-mark', 'arrow-storm'], 'Marksman', '神射手', 'Capstone: each cast that hits brings your other skills 0.5 s nearer to ready.', '终极天赋：每次技能命中，其他技能的冷却 −0.5 秒。', { cost: 2 }),

  // the mage: frost, storm, fire
  ACTIVE('frost-bolt', 'profession', ['elemental-attunement'], { kind: 'shot', element: 'ice', cooldown: 50, power: 1.2, range: 5, afflict: 'frozen', ticks: 10 }, 'Frost Bolt', '寒冰箭', 'A bolt of ice at the first foe ahead (×1.2, ice), freezing it for 1 s.', '向前射出寒冰箭，命中第一个敌人（1.2 倍冰霜伤害）并冻结 1 秒。', 'mage'),
  ACTIVE('thunderstorm', 'profession', ['chain-lightning'], { kind: 'rain', element: 'lightning', cooldown: 200, power: 0.7, range: 5, count: 3 }, 'Thunderstorm', '雷暴', 'Lightning falls on the 3×3 around the first foe ahead, once a second for 3 seconds (×0.7 each).', '在前方第一个敌人周围 3×3 降下落雷，每秒一轮，持续 3 秒（每轮 0.7 倍雷电伤害）。', 'mage'),
  { ...ACTIVE('meteor', 'profession', ['fireball-plus', 'nova-plus'], { kind: 'fireball', element: 'fire', cooldown: 350, power: 3, range: 5, radius: 2 }, 'Meteor', '陨石术', 'Ultimate: a meteor on the first thing ahead, burning the 5×5 around it (×3.0, fire).', '终极：召唤陨石砸向前方第一个目标，焚烧周围 5×5（3.0 倍火焰伤害）。', 'mage'), cost: 2 },
  MOD('fireball-plus', 'mage', ['fireball'], { skill: 'fireball', power: 0.5 }, 'Fireball: Inferno', '火球·炎爆', 'Fireball: power +0.5.', '火球：伤害倍率 +0.5。'),
  MOD('nova-plus', 'mage', ['frost-nova'], { skill: 'frost-nova', range: 1 }, 'Frost Nova: Spreading', '冰霜新星·扩散', 'Frost Nova: radius +1 cell.', '冰霜新星：半径 +1 格。'),
  MOD('chain-plus', 'mage', ['chain-lightning'], { skill: 'chain-lightning', count: 2 }, 'Chain Lightning: Forked', '闪电链·连锁', 'Chain Lightning: 2 more targets.', '闪电链：目标数 +2。'),
  MOD('blink-plus', 'mage', ['blink'], { skill: 'blink', range: 2, cooldown: -30 }, 'Blink: Far', '闪现·远', 'Blink: 2 cells farther, cooldown −3 s.', '闪现：距离 +2 格，冷却 −3 秒。'),
  MOD('frost-bolt-plus', 'mage', ['frost-bolt'], { skill: 'frost-bolt', ticks: 10 }, 'Frost Bolt: Biting', '寒冰箭·刺骨', 'Frost Bolt: frozen 1 s longer.', '寒冰箭：冻结 +1 秒。'),
  TALENT('mana-surge', 'mage', ['mana-shield'], 'Mana Surge', '法力涌动', 'Every skill\'s cooldown −10%.', '所有技能冷却 −10%。', { grant: { cdr: 0.1 } }),
  TALENT('elementalist', 'mage', ['frost-bolt'], 'Elementalist', '元素专精', 'What carries an element strikes 15% harder (a staff with one, an element\'s spell).', '带元素的攻击伤害 +15%（带元素的法杖、元素法术）。'),
  TALENT('arcane-barrier', 'mage', ['arcane-recovery'], 'Arcane Barrier', '奥术屏障', 'Max health +10.', '生命上限 +10。', { grant: { maxHp: 10 } }),
  TALENT('elemental-master', 'mage', ['archmage', 'meteor'], 'Elemental Master', '元素大师', 'Capstone: every third skill you cast does not rest.', '终极天赋：每第 3 次施放的技能不进入冷却。', { cost: 2 }),
  // the swordsman, deeper
  ACTIVE('focus-stance', 'profession', ['honed-blade'], { kind: 'buff', cooldown: 220, ticks: 50, buff: { crit: 0.2, front: 0.15 } }, 'Focused Stance', '正眼之构', 'For 5 s: critical chance +20%, and a blow from the way you face is turned aside 15% of the time.', '5 秒内暴击率 +20%，来自正面的攻击有 15% 的几率被格开。', 'swordsman'),
  ACTIVE('piercing-thrust', 'profession', ['fleet-stance'], { kind: 'pierce', missile: 'blade', cooldown: 80, power: 1.5, range: 3 }, 'Piercing Thrust', '突刺', 'A thrust through every foe in the 3 cells ahead (×1.5).', '向前突刺，贯穿前方 3 格内的所有敌人（1.5 倍伤害）。', 'swordsman'),
  { ...ACTIVE('heaven-rending', 'profession', ['cross-cut-plus', 'whirl-cut-plus'], { kind: 'slam', cooldown: 300, power: 2.6, range: 4 }, 'Heaven Rending', '天斩', 'Ultimate: one cut through everything in the 4 cells ahead, three wide (×2.6).', '终极：一刀斩开前方 4 格、3 格宽的一切（2.6 倍伤害）。', 'swordsman'), cost: 2 },
  MOD('cross-cut-plus', 'swordsman', ['cross-cut'], { skill: 'cross-cut', power: 0.4 }, 'Cross Cut: Honed', '十字斩·锋', 'Cross Cut: power +0.4.', '十字斩：伤害倍率 +0.4。'),
  MOD('rising-plus', 'swordsman', ['rising-slash'], { skill: 'rising-slash', ticks: 10 }, 'Rising Slash: Heavy', '挑斩·重', 'Rising Slash: kneeling +1 s.', '挑斩：跪地 +1 秒。'),
  MOD('step-cut-plus', 'swordsman', ['step-cut'], { skill: 'step-cut', range: 2 }, 'Step Cut: Long Stride', '踏斩·远', 'Step Cut: 2 cells farther.', '踏斩：距离 +2 格。'),
  MOD('whirl-cut-plus', 'swordsman', ['whirl-cut'], { skill: 'whirl-cut', count: 1 }, 'Whirl Cut: Quick', '回旋斩·疾', 'Whirl Cut: one turn more.', '回旋斩：多转一圈。'),
  MOD('thrust-plus', 'swordsman', ['piercing-thrust'], { skill: 'piercing-thrust', range: 2, power: 0.3 }, 'Piercing Thrust: Deep', '突刺·贯', 'Piercing Thrust: 2 cells deeper, power +0.3.', '突刺：距离 +2 格，伤害倍率 +0.3。'),
  TALENT('blood-on-steel', 'swordsman', ['clean-cut'], 'Blood on Steel', '血染', 'With a katana: each blow that lands draws back 1 health.', '持太刀时每次命中吸取 1 点生命。', { passive: { when: { weapon: 'own' }, drain: 1 } }),
  TALENT('unwavering', 'swordsman', ['parry'], 'Unwavering', '不动心', 'Standing your ground (no step this second): critical chance +8%, combat damage taken −8%.', '站定不动满 1 秒时，暴击率 +8%，受到的战斗伤害 −8%。', { passive: { when: { standing: true }, crit: 0.08, taken: -0.08 } }),
  TALENT('flowing-blade', 'swordsman', ['fleet-stance'], 'Flowing Blade', '流刃', 'On the move (a step this second): damage +10%, dodge +5%.', '移动中（这一秒内走过一步）伤害 +10%，闪避 +5%。', { passive: { when: { moving: true }, damage: 0.1, dodge: 0.05 } }),
  TALENT('sword-soul', 'swordsman', ['way-of-the-blade', 'heaven-rending'], 'Sword Soul', '剑魂', 'Capstone: with a katana, damage +20% and attack speed +10%.', '终极天赋：持太刀时伤害 +20%，攻击速度 +10%。', { cost: 2, passive: { when: { weapon: 'own' }, damage: 0.2, attackHaste: 0.1 } }),
  // the cleric, deeper
  ACTIVE('holy-light', 'profession', ['zeal'], { kind: 'shot', cooldown: 90, power: 1.5, range: 5 }, 'Holy Light', '圣光', 'A bolt of light at the first foe ahead within 5 cells (×1.5).', '向 5 格内的第一个敌人射出一道圣光（1.5 倍伤害）。', 'cleric'),
  ACTIVE('blessing', 'profession', ['steadfast'], { kind: 'buff', cooldown: 300, ticks: 80, buff: { party: true, damage: 0.15, taken: -0.1 } }, 'Blessing', '祝福', 'For 8 s, you and your companions within 6 cells: damage +15%, combat damage taken −10%.', '8 秒内，你和身边 6 格内的同伴伤害 +15%，受到的战斗伤害 −10%。', 'cleric'),
  { ...ACTIVE('divine-wrath', 'profession', ['smite-plus', 'prayer-plus'], { kind: 'nova', cooldown: 320, power: 2.5, range: 3, afflict: 'stunned', ticks: 15 }, 'Divine Wrath', '神怒', 'Ultimate: heaven\'s anger falls round you: every foe within 3 cells is struck (×2.5) and stunned for 1.5 s.', '终极：天怒落在你周围：3 格内的敌人受到攻击（2.5 倍伤害）并眩晕 1.5 秒。', 'cleric'), cost: 2 },
  MOD('smite-plus', 'cleric', ['smite'], { skill: 'smite', power: 0.5 }, 'Smite: Heavy', '惩击·重', 'Smite: power +0.5.', '惩击：伤害倍率 +0.5。'),
  MOD('prayer-plus', 'cleric', ['prayer'], { skill: 'prayer', power: 0.1, cooldown: -50 }, 'Prayer: Fervent', '祷告·虔', 'Prayer: mends a tenth more, cooldown −5 s.', '祷告：多恢复十分之一，冷却 −5 秒。'),
  MOD('consecrate-plus', 'cleric', ['consecrate'], { skill: 'consecrate', cooldown: -60 }, 'Consecrate: Wide Blessing', '祝圣·广', 'Consecrate: cooldown −6 s.', '祝圣：冷却 −6 秒。'),
  MOD('rebuke-plus', 'cleric', ['rebuke'], { skill: 'rebuke', range: 1 }, 'Rebuke: Loud', '斥退·喝', 'Rebuke: reach +1 cell.', '斥退：范围 +1 格。'),
  MOD('holy-light-plus', 'cleric', ['holy-light'], { skill: 'holy-light', power: 0.5, range: 2 }, 'Holy Light: Bright', '圣光·炽', 'Holy Light: power +0.5, reach +2 cells.', '圣光：伤害倍率 +0.5，距离 +2 格。'),
  TALENT('hymn', 'cleric', ['blessing'], 'Hymn', '圣歌', 'You and your companions within 6 cells: attack speed +8%.', '你和身边 6 格内的同伴攻击速度 +8%。', { passive: { party: true, attackHaste: 0.08 } }),
  TALENT('penitence', 'cleric', ['rebuke'], 'Penitence', '忏悔', 'Against the kneeling and the stunned: damage +20%.', '对跪地或眩晕的敌人伤害 +20%。', { passive: { when: { target: { status: ['knelt', 'stunned'] } }, damage: 0.2 } }),
  TALENT('vigil', 'cleric', ['consecrate'], 'Vigil', '守夜', 'At night: damage +10%, combat damage taken −10%.', '入夜后伤害 +10%，受到的战斗伤害 −10%。', { passive: { when: { night: true }, damage: 0.1, taken: -0.1 } }),
  TALENT('sainthood', 'cleric', ['holy-vessel', 'divine-wrath'], 'Sainthood', '封圣', 'Capstone: with a cross, damage +20%, and each blow that lands draws back 2 more.', '终极天赋：持十字架时伤害 +20%，每次命中多吸取 2 点生命。', { cost: 2, passive: { when: { weapon: 'own' }, damage: 0.2, drain: 2 } }),
]

SKILLS.push(...ACTIVE_SKILLS, ...PROFESSION_DEEPER, ...ADVANCEMENT_SKILLS, ...LIFE_SKILLS)

/** A skill book that teaches one active skill (read: used on oneself), named for it: for loot, shops and quests to hand out. */
export const skillBook = (id: string): Omit<Entity, 'id' | 'place'> => {
  const def = SKILLS.find((s) => s.id === id && s.active)!
  const n = typeof def.name === 'string' ? { en: def.name, zh: def.name } : def.name
  return { type: 'item/document/skillbook', name: { en: `Skill Book: ${n.en}`, zh: `技能书·${n.zh ?? n.en}` }, props: { teaches: id } }
}

export const SKILL_BY_ID: Record<string, SkillDef> = Object.fromEntries(SKILLS.map((s) => [s.id, s]))

/** The skills one of a profession (and on a path of it) may learn: the shared, the profession's, its path's. */
export const skillsForProfession = (profession: string, path?: string): SkillDef[] => SKILLS.filter((s) => (!s.profession || s.profession === profession) && onPath(s, path))
