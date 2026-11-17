/// <reference types="vite/client" />

// Original, full-colour illustrated pixel art only. Every skill has a distinct PNG;
// no generic SVG glyphs are substituted, even when an image fails to load.

import { assetsBase } from '../game.ts'

export const SKILL_ART_KEYS = [
  'origin', 'sword', 'shield', 'hammer', 'sweep', 'heart', 'drumstick', 'hardy', 'renew',
  'magnet', 'axe', 'pack', 'flame', 'swift', 'farming', 'ranching', 'smithing',
  'assassin', 'dagger', 'critical', 'shadow', 'combo',
  'quick-hands', 'battle-tempo', 'evasive-step', 'pursuit', 'windrunner',
  'executioner', 'deadly-focus', 'defiance', 'last-stand', 'blade-mastery',
  'shadow-recovery', 'death-dance',
  'nimble', 'acrobat', 'dash', 'slipstream', 'tailwind', 'phantom-step', 'untouchable',
  'brute', 'precision', 'hemorrhage', 'lethal-edge', 'brutal', 'first-strike', 'momentum', 'berserker',
  'iron-will', 'thick-skin', 'fortress', 'frugal', 'hearty-meals', 'regeneration', 'adrenaline', 'phoenix',
  'ranger-archery', 'steady-aim', 'sniper', 'fleet-archer', 'quick-draw', 'hunters-mark',
  'mage-focus', 'elemental-attunement', 'spell-echo', 'mana-shield', 'arcane-recovery', 'archmage',
  'ranger', 'mage', 'swordsman',
  // the active skills (tools/src/art/skill-actives.ts)
  'whirlwind', 'cleave', 'gale-step', 'mend',
  'shadow-strike', 'envenom', 'smoke-bomb', 'flurry',
  'multishot', 'leap-shot', 'piercing-arrow', 'arrow-rain',
  'fireball', 'frost-nova', 'chain-lightning', 'blink',
  // the professions, deeper (tools/src/art/skill-professions-a.ts, -b.ts)
  'throwing-knives', 'fan-of-knives', 'vanishing-strikes', 'shadow-mastery', 'potent-venom', 'lingering-smoke',
  'flurry-plus', 'fan-plus', 'venom-mastery', 'nightstalker', 'nimble-blade', 'master-assassin',
  'concussive-shot', 'hawk-eye', 'arrow-storm', 'multishot-plus', 'leap-plus', 'pierce-plus',
  'rain-plus', 'concussive-plus', 'light-gear', 'deadly-shot', 'windwalker', 'marksman',
  'frost-bolt', 'thunderstorm', 'meteor', 'fireball-plus', 'nova-plus', 'chain-plus',
  'blink-plus', 'frost-bolt-plus', 'mana-surge', 'elementalist', 'arcane-barrier', 'elemental-master',
  // the advancements: paths, masteries, the first trees' four more (tools/src/art/skill-adv-*.ts, docs/advancement.md)
  'grave-toxin', 'miasma', 'raise-dead', 'corpse-burst', 'grave-pact', 'army-of-the-dead', 'shadow-poise',
  'umbral-step', 'blur', 'unseen', 'riposte', 'thousand-shadows', 'hunters-lore', 'binding-sigil', 'hunt-call',
  'hex-edge', 'hunters-vigil', 'demon-prison', 'drive-the-dead', 'toxic-burst', 'bone-ward', 'raise-dead-plus', 'rot',
  'toxic-burst-plus', 'hell-pact', 'hell-guard', 'pestilence', 'soul-harvest', 'plague-lord', 'gate-of-the-styx',
  'dominion-of-hell', 'shade-stab', 'shadow-dance', 'night-veil', 'umbral-step-plus', 'deadly-grace', 'blur-plus',
  'shadow-double', 'fade', 'shadow-double-plus', 'chains-of-binding', 'hex-wave', 'chains-plus', 'judgement',
  'hunt-call-plus', 'deep-hex', 'exorcist', 'hunters-sanctum', 'death-mark-plus', 'undying-hunt', 'ghost-howl',
  'hex-plague', 'lethality', 'death-mark', 'ghost', 'assassinate', 'shadow-lord', 'garrote', 'caltrops', 'light-step',
  'cut-deep', 'eagle-eye', 'deadeye', 'ricochet', 'weak-point', 'patience', 'heartseeker', 'lay-of-the-land',
  'snare-trap', 'spike-trap', 'ambusher', 'tripwire', 'killing-field', 'pack-bond', 'call-the-hound', 'sic',
  'feral-instinct', 'pack-hunter', 'the-pack', 'volley', 'disengage', 'keen-arrows', 'fleet-foot', 'kindling', 'flame-wall', 'combustion',
  'conflagration', 'ember-heart', 'inferno', 'rime', 'ice-lance', 'glacial-prison', 'shatter', 'frost-armour',
  'blizzard', 'arcane-missiles', 'mana-ward', 'focus', 'spell-power', 'path-necromancer', 'path-shadowdancer',
  'path-demonhunter', 'path-sharpshooter', 'path-pyromancer', 'path-cryomancer',
  'mastery-assassin', 'mastery-necromancer', 'mastery-shadowdancer', 'mastery-demonhunter',
  'advance', 'path', 'mastery',
  // the mage's three paths and their thirds (tools/src/art/skill-adv-mage.ts): the Cryomancer and Everwinter, the Pyromancer
  // and the Worldfire, the Stormcaller and the Wrath of Heaven
  'ice-spikes', 'frozen-ground', 'permafrost', 'ice-lance-plus', 'deep-chill', 'frozen-ground-plus', 'heart-of-winter',
  'glacier', 'cold-wave', 'frostbite', 'cold-wave-plus', 'endless-winter', 'still-time', 'mastery-cryomancer',
  'dragons-breath', 'pyroblast', 'wildfire', 'flame-wall-plus', 'combustion-plus', 'searing', 'kalpa-heart', 'immolate',
  'scorched-earth', 'burnout', 'scorched-earth-plus', 'worldfire', 'all-is-kindling', 'mastery-pyromancer',
  'path-stormcaller', 'static', 'lightning-bolt', 'thunderclap', 'thunder-spear', 'overload', 'lightning-step',
  'quickening', 'thunder-spear-plus', 'high-voltage', 'lightning-step-plus', 'storm-spirit', 'thunder-prison',
  'heavens-might', 'judgement-bolt', 'thunder-shroud', 'thunderstrike', 'thunder-shroud-plus', 'wrath-of-heaven',
  'storm-unending', 'mastery-stormcaller',
  // the ranger's three paths and their thirds (tools/src/art/skill-adv-ranger.ts): the Hunter and Greenwood Dawn, the Sniper
  // and Hawkeye, the Skirmisher and Skywing
  'path-hunter', 'mark-prey', 'spike-trap-plus', 'hunting-ground', 'mastery-hunter', 'greenwood-heart', 'hunting-net',
  'hunting-net-plus', 'dawn-flight', 'lord-of-the-hunt', 'pinning-shot', 'hold-breath', 'long-shot', 'killshot',
  'deadeye-plus', 'hold-breath-plus', 'pinning-shot-plus', 'mastery-sharpshooter', 'hawks-sight', 'sunpiercer',
  'sight-lock', 'still-as-stone', 'sight-lock-plus', 'one-shot', 'unblinking', 'path-skirmisher', 'wind-step', 'flit',
  'arrow-flurry', 'crosswind', 'rapid-fire', 'flit-plus', 'crosswind-plus', 'arrow-flurry-plus', 'running-fight',
  'gale-dance', 'mastery-skirmisher', 'sky-heart', 'wingbeat', 'flying-feathers', 'ride-the-wind', 'flying-feathers-plus',
  'falling-feathers', 'sky-walker',
  // the swordsman (tools/src/art/skill-swordsman.ts)
  'kenjutsu', 'honed-blade', 'clean-cut', 'fleet-stance', 'parry', 'way-of-the-blade', 'cross-cut', 'rising-slash',
  'step-cut', 'whirl-cut', 'focus-stance', 'piercing-thrust', 'heaven-rending', 'blood-on-steel', 'unwavering',
  'flowing-blade', 'sword-soul', 'sheath-cut', 'wind-cutter', 'edge-discipline', 'steady-breath', 'path-swordsaint',
  'iaido-stance', 'iaido', 'phantom-sword-dance', 'swallow-return', 'zanshin', 'flowing-water', 'flash-step',
  'wind-blade', 'issen', 'mastery-swordsaint', 'sword-heart', 'mirror-stance', 'void-slash', 'no-mind',
  'iaido-mastery', 'ten-thousand-swords', 'sword-god', 'path-sacrificer', 'pain-pact', 'blood-offering',
  'crimson-whirl', 'rending-sacrifice', 'agony', 'blood-drinker', 'frenzy', 'numbness', 'offering-plus',
  'undying-rage', 'crimson-whirl-plus', 'sixth-suffering', 'mastery-sacrificer', 'pain-vessel', 'flesh-for-blade',
  'pain-spread', 'feed-on-pain', 'sixth-suffering-plus', 'final-offering', 'undying-avatar', 'cross-cut-plus', 'rising-plus',
  'step-cut-plus', 'whirl-cut-plus', 'thrust-plus', 'swallow-plus', 'iaido-plus', 'dance-plus', 'path-spellblade',
  'blade-and-spell', 'flame-enchant', 'frost-enchant', 'thunder-enchant', 'arcane-edge', 'mana-tempered', 'flame-slash',
  'thunder-thrust', 'frost-ring', 'thunder-thrust-plus', 'blade-channel', 'trinity-cut', 'mastery-spellblade',
  'blade-spell-union', 'prism-enchant', 'raikiri', 'ringing-blade', 'meteor-cut', 'ten-thousand-thunders', 'seamless',
  // the cleric (tools/src/art/skill-adv-cleric.ts): the profession and its own tree, the Paladin and the Evangelist, the
  // Avenger and the Sentence of Suffering, the Inquisitor and Doomsday
  'cleric', 'faith', 'blessed-arms', 'zeal', 'devotion', 'steadfast', 'holy-vessel', 'smite', 'prayer', 'consecrate',
  'rebuke', 'holy-light', 'blessing', 'divine-wrath', 'smite-plus', 'prayer-plus', 'consecrate-plus', 'rebuke-plus',
  'holy-light-plus', 'hymn', 'penitence', 'vigil', 'sainthood', 'hammer-of-heaven', 'ward-of-light', 'anointed',
  'pious', 'path-paladin', 'oath-of-light', 'healing-light', 'guardian-light', 'cleric-renew', 'blessed-hands',
  'radiant-blow', 'iron-faith', 'healing-light-plus', 'merciful', 'radiant-blow-plus', 'shining-armour',
  'divine-intervention', 'mastery-paladin', 'gospel', 'call-the-faithful', 'psalm', 'apostles', 'psalm-plus',
  'gate-of-heaven', 'crown-of-glory', 'path-avenger', 'vengeance', 'scourge', 'black-flame', 'wrath',
  'blood-for-blood', 'torment', 'shared-suffering', 'wrath-plus', 'eye-for-an-eye', 'torment-plus', 'dark-zeal',
  'night-of-wrath', 'mastery-avenger', 'five-sufferings', 'thorn-crown', 'spear-of-sorrow', 'nail-and-wood',
  'spear-of-sorrow-plus', 'all-five', 'atonement', 'path-inquisitor', 'zealotry', 'brand-heretic', 'burn-the-heretic',
  'shackles', 'mark-of-heresy', 'purging-flame', 'the-stake', 'shackles-plus', 'interrogation', 'purging-flame-plus',
  'no-mercy', 'sentence', 'mastery-inquisitor', 'last-days', 'doom', 'confess', 'inevitable', 'confess-plus',
  'last-judgement', 'dies-irae',
  // the life branches (tools/src/art/skill-life-*.ts)
  'sharp-axe', 'carpenter', 'forester', 'timber-master', 'prospector', 'heavy-pick', 'stonecutter', 'gem-finder',
  'deep-vein', 'forager', 'herbalist', 'angler', 'bait-saver', 'lucky-catch', 'deep-fisher', 'master-angler',
  'farmer', 'green-fingers', 'wide-hoe', 'bountiful', 'seed-merchant', 'perennial-keeper', 'fruit-farmer', 'berry-farmer',
  'irrigation', 'sprinkler', 'composter', 'rich-soil', 'grain-farmer', 'root-farmer', 'gourd-farmer', 'herb-gardener',
  'seed-saver', 'market-gardener', 'golden-harvest', 'master-farmer', 'herdsman', 'milker', 'egg-collector', 'breeder',
  'butcher', 'beekeeper', 'cheesemaker', 'dairy-master', 'coop-keeper', 'hen-whisperer', 'quick-breeder', 'stockman',
  'feed-maker', 'tanner', 'leatherworker', 'plucker', 'apiarist', 'royal-jelly', 'rancher', 'master-rancher',
  'apprentice-smith', 'forge-builder', 'efficient-smelting', 'weaponsmith', 'armorsmith', 'fine-craft', 'steelworking', 'goldsmith',
  'jeweler', 'ore-merchant', 'tool-smith', 'keen-edge', 'heavy-arms', 'master-weaponsmith', 'plate-work', 'reinforced',
  'master-armorsmith', 'masterwork', 'legendary-smith', 'grandmaster-smith',
] as const

const known = new Set<string>(SKILL_ART_KEYS)
const artKey = (key: string | undefined): string => key && known.has(key) ? key : 'origin'

export const skillPng = (key: string): string => `${assetsBase()}lsw/skills/${artKey(key)}.png`

export const skillArt = (key: string | undefined): string => {
  const icon = artKey(key)
  return `<span class="sk-art"><img class="sk-png" data-icon="${icon}" src="${skillPng(icon)}" alt="" draggable="false"></span>`
}

/** A failed request gets our illustrated origin emblem, never a line-art version. */
export function bindSkillArt(host: ParentNode): void {
  host.querySelectorAll<HTMLImageElement>('img.sk-png').forEach((img) => {
    img.onerror = () => {
      if (img.dataset.icon !== 'origin' && img.dataset.fallback !== 'origin') {
        img.dataset.fallback = 'origin'
        img.src = skillPng('origin')
      } else img.hidden = true
    }
  })
}
