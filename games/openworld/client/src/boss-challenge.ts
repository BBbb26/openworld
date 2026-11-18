// A fresh, disposable game per challenge. No persistence and no campaign/trainer changes.
import { Game, OFFHAND, RuleLibrary, learnSkill, type Text, type WorldIndex } from '@openworld/engine'
import { ADVANCEMENT_SKILLS, BASE_RULES, BOSS_BY_ID, BOSS_ARENA, PROFESSION_BY_ID, SKILLS, STORY_RULES, buildOntology, createBoss, decodeChunk, type RawChunk } from '@openworld-game/content'

export const CHALLENGE_LOADOUTS: Record<string, { hp: number; atk: number; def: number; icon: string; tip: Text }> = {
  assassin: { hp: 110, atk: 5, def: 1, icon: 'assassin', tip: { en: 'Iron dagger · openers, backstabs and three-hit finishers.', zh: '铁匕首 · 绕后背刺，抓住先手，三连击收尾。' } },
  ranger: { hp: 100, atk: 4, def: 1, icon: 'critical', tip: { en: 'Bow · seven-tile shots, aimed damage and mobile volleys.', zh: '长弓 · 七格射程，站稳增伤，命中后加速走位。' } },
  mage: { hp: 90, atk: 4, def: 1, icon: 'flame', tip: { en: 'Ember staff · elemental power, spell echoes and a mana shield.', zh: '炽焰法杖 · 元素增伤、法术回响与法力护盾。' } },
  swordsman: { hp: 120, atk: 5, def: 1, icon: 'swordsman', tip: { en: 'Iron katana and scabbard · quick cuts, criticals, a parry from the front.', zh: '铁太刀与刀鞘 · 出刀快、暴击高，正面能格开攻击。' } },
  cleric: { hp: 130, atk: 5, def: 2, icon: 'cleric', tip: { en: 'Iron cross and rosary · blows that mend, a prayer, light against the night\'s things.', zh: '铁十字架与念珠 · 打中就回血，能祷告治疗，圣光克制夜里的东西。' } },
}

export function createBossChallenge(index: WorldIndex, raw: RawChunk, profession: string, bossId: string): Game {
  const loadout = CHALLENGE_LOADOUTS[profession], role = PROFESSION_BY_ID[profession]
  if (!loadout || !role?.weapon || !BOSS_BY_ID[bossId]) throw new Error('Unknown challenge profession or boss')
  const settings = structuredClone(index)
  Object.assign(settings, { start: { map: BOSS_ARENA.map, x: 23, y: 17 }, npcs: [], companions: [], steps: [], quests: [], invariants: [], waypoints: [], startHour: 12 })
  const looks: Record<string, string> = { assassin: 'NinjaDark', ranger: 'Hunter', mage: 'SorcererOrange', swordsman: 'Samurai', cleric: 'KnightGold' }
  settings.player = { id: 'player', type: 'actor/person/player', look: looks[profession], facing: 'up', place: { on: 'tile', ...settings.start },
    props: { hp: loadout.hp, maxHp: loadout.hp, atk: loadout.atk, def: loadout.def, profession, level: 20, xp: 0, maxHunger: 0, skillPoints: 100 } }
  const game = Game.create(settings, buildOntology(), new RuleLibrary([...BASE_RULES, ...STORY_RULES]))
  const chunk = decodeChunk(structuredClone(raw))
  chunk.entities = chunk.entities.filter((e) => !e.type.startsWith('actor/'))
  chunk.entities.push(createBoss(bossId, BOSS_ARENA, BOSS_ARENA.id))
  chunk.map.appear = []
  chunk.map.portals = [] // a trial cannot accidentally stream into the campaign
  chunk.map.zone = 'peaceful' // suppress unrelated nighttime spawns, not the authored boss
  game.loadChunk(chunk)
  const w = game.engine.world, player = w.player
  const shared = new Set(['light-footed', 'quick-hands', 'strength', 'vitality'])
  // (the profession's tree as the challenge was balanced on it: not the advancements' paths, mastery and four more, docs/advancement.md)
  const later = new Set(ADVANCEMENT_SKILLS.map((s) => s.id))
  const pending = SKILLS.filter((s) => (shared.has(s.id) || s.profession === profession) && !later.has(s.id))
  // the trial is built by its author, not played into being
  game.engine.author(() => {
    while (pending.length) {
      const next = pending.findIndex((s) => learnSkill(w, player, s))
      if (next === -1) throw new Error('Invalid challenge skill prerequisites')
      pending.splice(next, 1)
    }
    player.props!.skillPoints = 0
    player.props!.hp = w.num(player, 'maxHp')
    const weapon = w.create(role.weapon!.type, { on: 'hand', holder: player.id }, structuredClone(role.weapon))
    // the profession's off-hand piece (the swordsman's scabbard), worn
    if (role.offhand) w.setProp(player, OFFHAND, w.create(role.offhand.type, { on: 'inside', holder: player.id }, structuredClone(role.offhand)).id)
    if (profession === 'mage') {
      (weapon.props ??= {}).element = 'fire'
      weapon.name = { en: 'Challenge Ember Staff', zh: '试炼·炽焰法杖' }
    }
  })
  game.engine.controls.sync()
  w.fx = []
  return game
}

export function challengeOutcome(game: Game): 'victory' | 'defeat' | undefined {
  const w = game.engine.world, boss = w.get(BOSS_ARENA.id)
  if (w.num(w.player, 'hp') <= 0 || w.hasStatus({ e: w.player.id }, 'down')) return 'defeat'
  if (!boss || w.num(boss, 'hp') <= 0) return 'victory'
  return undefined
}
