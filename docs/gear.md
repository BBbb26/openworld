# Gear: rolled affixes, monster trophies, sets

Built 2026-10-11 and 2026-10-12. A piece of gear's numbers come from three places: its **main stats** (its form ×
its material × its quality, world-model.md §6.8; a trophy's are its own), a few **affixes** rolled when it is made,
and the **set** it belongs to, worn with others of it. All three are read by `World.stat(e, key)` (engine
`world.ts`), so a rule, a blow or a tooltip sees them alike. The player's pages: wiki 装备, 词条, 专属掉落, 套装.

## 1. Affixes

- **The table is the world's** (`Ontology.affixes`, an `AffixTable`, engine `affixes.ts`): how many a piece rolls
  (`count`) and the pool (`AffixDef`: a stat `key`, `min`, `max`, `step`, the `slots` it may roll on — all when
  none —, a `weight`, 1 when none). The game's table is content `trophies.ts` `AFFIX_TABLE`: four of thirteen
  (attack, defence, critical chance and damage, dodge, health per hit, cooldowns, experience, stealth, standing
  one's ground, perception, move speed only on the feet, waist, shoulders, body and ear, attack speed only on the
  weapon, hands, ring, ear and off hand); attack, health per hit, stealth, perception and the rest weigh less.
- **Rolled once, as the piece is made in the world** (`rollAffixes`): crafted (`craft`, for a made thing with a
  slot), dropped as a trophy (below), restocked by a merchant (the society module's `restock`), or laid on a map
  (content `items.ts` `makeItem`). Each different one from the pool by weight, a value in its range on its step,
  kept as a `sub:<key>` prop. A piece that already carries affixes never rolls again (`hasAffixes`). What the
  author makes as written rolls none: a profession's first weapon (`makeItem` with `trait: false`), a quest's
  named reward gear.
- **Counted while worn**: `World.stat` adds `sub:<key>` of every worn piece, the weapon kept in the main hand
  included, and of a weapon held in hand that is not the worn one. What lies in the bag counts nothing.
- **Intended** (in progress): a piece rolls from a seed of its own rather than from the world's random stream.

## 2. Monster trophies

- **Each kind of monster names its own piece of gear**: its type's `trophy` (the piece's type, under a wearable
  form that gives its slot and picture) and `trophyChance`. The game's are content `trophies.ts` `TROPHIES`, one
  per kind: a common kind 4 %, a stronger one 10 %, a boss's sure; main stats fixed in the piece's props.
- **The drop**: whoever fells the creature hears of it (`combat/defeat`) and answers with the `trophy` primitive:
  by the chance, or surely once it has felled `params.trophyPity` (50 by default) of that kind without one. The
  count is the striker's own (prop `trophy.<type>`), raised by each felling that brings nothing and reset when the
  piece comes. The piece is made in the striker's bag and rolls its affixes like any other; the tooltip names the
  kind whose trophy it is.
- **Intended** (in progress): the primitive moves from the kernel into a `loot` module (`packages/modules`), and a
  trophy is only a type that some creature type names — no list of trophies the engine knows.

## 3. Sets

- **The world's sets** (`Ontology.sets`, `GearSet`): an id, a name, how many pieces, and its bonuses
  (`{ pieces, props, text }`). A piece carries its set as its prop `set`.
- **Counted by slot**: `World.stat` gathers, for each set, the distinct `slot`s of the worn pieces of it — two
  rings of one set count once — and adds every bonus whose `pieces` the count reaches (the bonuses add up).
- **The profession sets** (content `sets.ts` `SET_DEFS`, after Dungeon Fighter): each of the four professions has
  eleven pieces, forged at an anvil with a smith's hammer carried (`SET_RECIPES`: the set's level, the Jeweler for
  jewellery; the first need gives the material). They make two sets (`GEAR_SETS`): the armour (head, shoulders,
  body, hands, waist, feet: bonuses at 2, 4 and 6) and the trinkets (`<id>_trinkets`: neck, ear, ring: at 2 and
  3). The weapon and the off hand are in no set; they are the profession's own (their forms' `profession:`
  tags), the rest anyone may wear. New forms for them: the jerkin, the robe, and three off hands (the parrying
  dagger, the quiver, the tome).
- **The monster sets** (content `trophies.ts` `TROPHY_SETS`): each family's trophies make an armour or a trinket
  set by the same rules; two bosses' pieces stand alone, stronger, in none.
- (First built 2026-10-11 as one set of twelve pieces per profession, the weapon among them, with bonuses at 3, 6,
  9 and 12 pieces counted per piece; split into armour and trinkets, counted by slot, 2026-10-12.)

## 3a. The main line's sets

Thirty-two more sets, five or six to a chapter and two across the line, a type and a picture per piece, their
bonuses' powers (vows, relics' powers, the sets' own): [sets.md](sets.md) (2026-11-01).

## 3b. The off hands (2026-11-05)

Asked: the shield taken out, and each profession's off hand designed anew. The shield went with every kind of it (the
regions' too), its recipes (the Workshop's, the anvil's) and its picture; an older save's shields are taken apart into
what the anvil makes one of, where they were (two planks; two bars of the metal, a metal one: content
`migrateProfessions.ts`). Each profession has one piece of its own for the off hand (the `arm` slot), handed over with its
weapon when the profession is taken up and worn at once — one who took it up before is handed it on loading — each
with a power (`props.offhand`, its words `OFFHANDS` in powers.ts, the tooltip's ◈ line; the classes module's combat.ts
`offhandsOf`):

| Piece | Profession | Stats | Power |
| --- | --- | --- | --- |
| **Parrying Dagger** 格挡短刃 | assassin | def 1, dodge 3%, block 5% | **Two Blades** 双刃: with a dagger, a blow cuts again one time in four (a chance), half as hard |
| **Quiver** 箭袋 (of an element, now and then) | ranger | critical 3% | **Fletching** 箭羽: with a bow, reach +1; a quiver of an element lends it to the arrows (and its chance to leave its status) |
| **Tome** 法典 (of an element, now and then) | mage | cooldowns −5% | **The Written Word** 秘典: skills +10%; a tome of an element, that element's skills +15% again |
| **Scabbard** 刀鞘 | swordsman | attack speed 4% | **The Draw** 拔刀: with a katana, the first cut after 3 s without one +50% |
| **Rosary** 念珠 (2026-11-12) | cleric | def 1 | **The Litany** 祷文: with a cross, one's mending +20%, and a blow that lands mends 2 one time in four |

Where they are: the parrying dagger takes the shield's place in the smithies and the dark (`where`, so the played maps'
rolls stay as they were, the shield's become parrying daggers) and the anvil's recipe (an ingot and a stick); the
scabbard the Workshop's (two planks and a stick), the rosary too (two sticks); the cleric's cross the anvil's (two
ingots and a plank); the quiver and the tome the regions' own kinds (goods.ts); every one
in its profession's set (sets.ts). **Block** is turned aside by what is worn (the parrying dagger's own, a set's) only
with something in the off hand.

## 4. Where it lives

Engine: `affixes.ts`, `World.stat` (`world.ts`), the `trophy` primitive and `craft` (`effects.ts`), the types
(`types.ts`: `AffixTable`, `GearSet`, `WorldParams.trophyPity`). Modules: `society` `restock`. Content:
`trophies.ts`, `sets.ts`, `items.ts`, the trophy and chance on each kind (`ontology.ts`). Runtime: the tooltip's
affixes, trophy line and set lines lit by the count worn (`ui/tooltip.ts`). Tests:
`games/openworld/tools/test/trophies.test.ts`.
