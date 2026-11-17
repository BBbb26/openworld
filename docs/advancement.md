# Advancement: the second and third (2026-11-01)

Asked for: deepen the professions' trees; a **second advancement** that chooses one of **three paths**; a **third
advancement** after it that is not a path but the profession's own; new active and passive skills for every path and
every profession. Built on the professions of [skill-tree.md](skill-tree.md) (taken at a trainer from level 5, a tree of
22 nodes each, active skills on the skill bar) — reference: MapleStory's job advancements (a first job, then a choice
of branch, then the branch's later jobs) and Dungeon Fighter's awakenings (a late tier every subclass of a class
shares in spirit); here the third tier is shared by the whole profession. Asked later the same day: the assassin's
paths become the **Necromancer** (poison, necromancy, the dead raised), the **Shadowdancer** (stealth, the backstab,
criticals, dodge) and the **Demon Hunter** (sigils on the ground, hexes, buffs shared with one's companions, control) —
the Necromancer fighting through the dead it raises and its poison, never with its own blows —
and its third takes a name after the path — **Hell Sovereign** 地狱支配者, **Phantom** 幻影, **Ghostwail** 鬼泣 — its
skills the path's own too, seven each (Hell Sovereign: summons and poison; Phantom: the double and the fade; Ghostwail:
the sanctum, the howl, the hex spread; `SkillDef.path` may name several paths, `onPath`; `PathDef.third`, `thirdOf`). In the skill
tree every path is shown, side by side after the profession's own tree, each third over its path; only the one taken
can be learned, the others barred (`SkillBranchDef.after`, `byPath`). Asked 2026-11-05: the **warrior** taken out (§2
Warrior), and the mage's paths made the three elements' — the **Cryomancer** 霜术师 (ice), the **Pyromancer** 炎术师
(fire) and the new **Stormcaller** 雷术师 (lightning), twelve skills each, each with a third of its own: **Everwinter**
永冬, **Worldfire** 劫火, **Wrath of Heaven** 天罚 (the names designed for the user; the Dawnbringer and the shared
Archmage went). Asked 2026-11-12: the ranger's paths made again — the **Hunter** 猎人, the **Sniper** 狙击手, the
**Skirmisher** 漫游射手, each with a third of its own: **Greenwood Dawn** 森海飞霞, **Hawkeye** 鹰眼, **Skywing** 天空之翼
(§2 Ranger); no profession's paths share a mastery now. Asked the same day: a new profession, the **Cleric** 圣职者
(the cross), its paths the **Paladin** 圣骑士, the **Avenger** 复仇者 and the **Inquisitor** 异端审判者, their thirds the
**Evangelist** 福音传道者, the **Sentence of Suffering** 苦痛断罪 and **Doomsday** 末日裁决 (§2 Cleric).

## 1. The three advancements

| Tier | Level | Where | What it opens | Points |
| --- | --- | --- | --- | --- |
| **First**: a profession | 5 | a trainer | the profession's tree (22 nodes, +4 now) | — |
| **Second**: a path, one of three | 10 | a trainer | the path's skills (twelve on two arms) | +3 |
| **Third**: the path's own third | 16 | a trainer | its skills (seven a third) | +3 |

- **Trainers**: Bram in Firstlight, and now **Sergeant Kell** in the March's camp (Chapter 2; his role trainer, the drill sergeant of the Left Company) — the same panel, its advancement section below the professions.
- **Changing**: a path can be changed at a trainer, as a profession can: the path's skills are unlearned and their
  points come back. Changing the profession clears the path (the advancement stays: one who has advanced chooses a path
  of the new profession) and gives back every profession, path and mastery point.
- **Points**: every level still gives one; the second and third advancements give three more each, so the new trees are
  reachable without unlearning the old.
- **The engine** (the classes module): the actor's `advancement` (1–3) and `path`; `SkillDef.path` (a path's skill,
  learned only on it) and `SkillDef.tier` (3: the mastery's, learned only once advanced so far); the act `advance` at a
  trainer (refusals: level, trainer, path, done), the trainer's panel asking for it.

## 2. The paths

### Assassin

| Path | Root (passive) | Actives | Passives | Ultimate (2) |
| --- | --- | --- | --- | --- |
| **Necromancer** 死灵术士 — the dead and the poison, the body standing back; third: Hell Sovereign 地狱支配者 (its own) | Grave Pact: the raised +50% health, +30% harder | Raise Dead (two skeletons fight at your side 30 s); Miasma (a cloud on the 3×3 ahead, 5 s: poisons); Drive the Dead (up to four of the raised leap on the foe ahead, ×1.5 of their own, poisoning); Toxic Burst (the poison in every foe within 5 bursts, ×2) | Grave Toxin (every blow of the raised poisons 3 s); Corpse Burst (a poisoned foe felled by you or the raised bursts: those within 2 struck ×0.6 and poisoned); Bone Ward (a companion near, −15% taken); Rot (you and your companions +20% on the poisoned); two masteries: Raise Dead one more skeleton and −5 s, Toxic Burst +2 reach and +0.5× | Army of the Dead (those within 2 struck ×0.6 and poisoned; four skeletons rise) |
| **Shadowdancer** 影舞者 — the veil and the back, the dodge and the critical; third: Phantom 幻影 (its own) | Shadow Poise: with a dagger, dodge +8%, critical +5%; a Backstab +30% more | Umbral Step (vanish 2 s; the next blow a sure critical); Blur (4 s: dodge +35%, movement +20%); Shade Stab (behind the nearest foe within 5, ×2.5, it bleeds); Shadow Dance (6 s: attack speed +30%, critical +15%) | Unseen (the first blow out of a veil +50%); Riposte (a dodge readies +80% on the next blow); Night Veil (at night, dodge and critical +10%); Deadly Grace (with a dagger, dodge +5%, critical damage +25%); two masteries: Umbral Step −4 s and 1 s longer, Blur −6 s and 1 s longer | Thousand Shadows (behind up to five foes within 4, ×1.4 each) |
| **Demon Hunter** 猎魔人 — the sigil and the hold, the hex and the hunt's call; third: Ghostwail 鬼泣 (its own) | Hunter's Lore: +15% on a foe under any affliction | Binding Sigil (a sigil on the 3×3 ahead, 8 s: who walks in is hexed 4 s — attack −2, defence −3, slower); Call of the Hunt (6 s: you and your companions within 6, +20% damage, +15% attack speed); Chains of Binding (a chain at the first foe that leaps on to 2 more, ×0.8, each held 2 s); Hex Wave (those within 3 struck ×0.5 and hexed 4 s) | Hexing Edge (with a dagger, one blow in five hexes 4 s); Hunter's Vigil (you and your companions within 6, −10% taken); Judgement (critical +15% on the held, stunned, mired or hexed); Deep Hex (you and your companions +15% on the hexed); two masteries: Chains +2 foes and 1 s longer, the Call −5 s and 3 s longer | Demon Prison (those within 2 struck ×1.0 and stunned 1.5 s; a ring of sigils round you) |

(First built the same day as the Nightblade, the Venomancer and the Bladedancer; replaced before release.)

**Hell Sovereign** 地狱支配者 — the Necromancer's own third (tier-3 skills on its path): Hell Pact (the raised +30% health
and harder again; you and your companions draw back 1 a blow); **Guard of Hell** (a guard far stronger than a skeleton,
40 s); **Pestilence** (the 5×5 round you, five plagues ×0.4, poisoning); Soul Harvest (a felling by the raised mends 3 and
brings every skill a second nearer); Plague Lord (you and your companions critical +15% on the poisoned); **Gate of the
Styx** (ultimate: those within 3 struck ×1.0 and poisoned, two guards of hell); Dominion of Hell (capstone: you and your
companions +25% damage, +15% attack speed).

**Phantom** 幻影 — the Shadowdancer's own third: Lethality (critical damage +30% with a dagger); **Shadow Double** (a
shadow of yourself fights at your side 15 s); Ghost (dodge +8%); Fade (each blow dodged fades you into the dark 1 s, the
next blow a sure critical); a mastery (two doubles, −10 s); **Assassinate** (ultimate: behind the nearest foe within 6,
×5, a sure critical); Shadow Lord (capstone: every fifth blow a critical).

**Ghostwail** 鬼泣 — the Demon Hunter's own third: Exorcist (+25% on the undead, the night's creatures and the bosses);
**Death Mark** (the nearest foe takes +30% from you 8 s; felled marked, every skill ready); **Hunter's Sanctum** (sigils
on the 3×3 round you; 8 s of +20% damage and −15% taken for you and your companions); a mastery (the mark 4 s longer, 2
cells farther); Undying Hunt (you and your companions at half health or less, −20% taken); **Ghost Howl** (ultimate:
those within 4 struck ×1.5 and stunned 2 s); Hex Plague (capstone: a hexed foe felled by you or a companion passes its
hex to those within 3, struck ×0.2, and your skills come 2 s nearer).

(The assassin's mastery shared by all three paths at first — Lethality, Death Mark, Ghost, Assassinate, Shadow Lord —
went to Phantom and Ghostwail when each path took a third of its own.)

### Warrior (taken out 2026-11-05)

The warrior — sword and shield; the paths Sentinel 哨卫, Berserker 狂战士 and Thornknight 荆棘骑士, the mastery
Paragon 典范 — was taken out at the user's asking. What went with it: its first tree and its four more, its paths and
mastery, its forged set (Oathguard 誓卫), its two legendary arms (the Oathbrand 誓约之刃, the Unfallen Wall 不陷之壁,
and their powers), its loadout in the boss challenge, its art, its wiki page, its coded talents (combat.ts: Arms
Training, Bulwark, Retaliation, Rampage, the Warlord, Shield Wall, Blood Fury, Retort, Living Legend; index.ts: Thorned
Mail, Fortitude, Unbreakable Will; actives.ts: Undying Spirit, Bloodthirst, Carnage). The sword and the scimitar are
anyone's now: common weapons a profession's talents never answer; the shield went the same day (each profession has an
off-hand piece of its own instead, gear.md §3b). The main-line sets that leaned warrior lean swordsman (the plate is the same). The active
kinds only it used (`charge`, `rally`, `quake`, `guard`, `slam`, `taunt`, `rest`) stay the engine's: `quake` and `slam`
serve the mage again (Ice Spikes; a Glacier, a Scorched Earth). An older save (content `migrateProfessions.ts`): every
skill that went comes back as points, its grants undone (as a change of profession undoes them); a warrior has no
profession, to choose one again at a trainer (its advancement kept, as on a change); a Dawnbringer no path; the skill
bar lets go of what went; an Oathbrand is a sword like any other, its power gone (an Unfallen Wall is taken apart, as every shield is); a
piece of the Oathguard keeps its own numbers, its set's bonus gone.

### Ranger (three paths of its own, 2026-11-12)

Asked for: the ranger's three paths made again — the **Hunter** 猎人 (control, traps, marks, a hound at one's side),
the **Sniper** 狙击手 (the whole map in reach, slow to draw, very heavy) and the **Skirmisher** 漫游射手 (quick feet, a
little control, many light arrows, played as an assassin is), each with a third of its own: **Greenwood Dawn** 森海飞霞,
**Hawkeye** 鹰眼, **Skywing** 天空之翼 (the Chinese names the user's; the skills and the English designed for them). The
Trapper and the Beastmaster became the Hunter, the Sharpshooter the Sniper (its id `sharpshooter` kept), the Skirmisher
is new, and the Master Archer went.

| Path | Root (passive) | One arm | The other | Ultimate (2) | Third |
| --- | --- | --- | --- | --- | --- |
| **Hunter** 猎人 — traps, the mark, the hound | Ambusher: +30% on the held, mired or stunned | **Snare Trap** (the first foe on it held 3 s) → **Spike Trap** (spikes down 3 cells: bleed and mire), Tripwire (critical +25% on the held) → Spike Trap's mastery (+2 cells, −4 s), Hunting Ground (critical damage +30% on the held, mired or stunned) | **Call the Hound** (40 s) → **Sic** (the beast on the foe ahead ×2 of its own, bleeding), **Mark Prey** (the nearest foe within 7 made one's prey 10 s, ×0.3: slower, and one and one's companions within 6 deal it +20%) → Pack Bond (a beast called +50% health, +30% damage), Pack Hunter (a companion near: +15%) | Killing Field (blast traps all round, fire) | **Greenwood Dawn** 森海飞霞 |
| **Sniper** 狙击手 — the one shot from afar | Sure Eye: with a bow, critical +5%, damage +10% | **Deadeye** (one arrow ×3.5 within 7) → Weak Point (critical +15% below half), Patience (each second still +10%, to +40%) → Killshot (+50% below a quarter), Deadeye's mastery (+1.0×, −4 s) | **Pinning Shot** (×1.5 within 7, held 2 s) → **Hold Breath** (5 s: critical +25%, critical damage +30%), Long Shot (reach +2; +5% each cell beyond the second, to +40%) → Hold Breath's mastery (+2 s, −5 s), Pinning Shot's mastery (+1 s, +0.5×) | Heartseeker (through the line ×3, each a sure critical) | **Hawkeye** 鹰眼 |
| **Skirmisher** 漫游射手 — never still | Wind Step: with a bow, movement and attack speed +10% | **Flit** (up to 4 cells ahead, through foes) → **Crosswind** (those within 2 ×0.6, mired 2 s), Lay of the Land (movement +8%, dodge +8%) → Flit's mastery (+2 cells, −2 s), Crosswind's mastery (+1 cell, mired +1 s) | **Arrow Flurry** (four arrows ×0.45 at the first foe within 6) → **Ricochet** (an arrow leaping to 3 foes ×1.1), Rapid Fire (attack speed +15%) → Arrow Flurry's mastery (+2 arrows), Running Fight (on the move: +15%, critical +8%) | Gale Dance (flit to up to five foes within 5, an arrow into each at arm's length ×1.2) | **Skywing** 天空之翼 |

**Greenwood Dawn** 森海飞霞 — the forest sea at dawn, the Hunter's own third: Heart of the Greenwood (one and one's
companions within 6 against one's prey: +20%, critical +10%); **The Pack** (three wolves, 20 s); **Hunting Net** (the 3×3
round the first foe within 6, ×0.5, held 3 s); Feral Instinct (one and one's companions: attack speed +15%, dodge +8%);
Hunting Net's mastery (the 5×5, −4 s); **Dawn Flight** 万鸟飞霞 (ultimate: the birds rise like clouds at dawn: those
within 4 ×1.5, made prey 10 s); Lord of the Hunt (capstone: one's prey felled by one or a companion passes the mark to the
nearest foe within 4, and every skill comes two seconds nearer).

**Hawkeye** 鹰眼 — the Sniper's own third: Hawk's Sight (with a bow, an arrow flies until it strikes something, as far as
the map goes; shooting 40% slower, every arrow twice as hard); **Sunpiercer** 贯日 (through every foe in the line to the
map's edge ×5); **Sighted** 锁定 (the nearest foe within 20 takes +40% from one, 10 s); Still as Stone (standing, with a
bow: +20%, critical damage +30%); Sighted's mastery (+5 s, −5 s); **One Shot, One Kill** 一箭封喉 (ultimate: the first
foe ahead, as far as the map goes, ×10, a sure critical); Unblinking (capstone: from 6 cells or farther, every arrow of
one's bow a sure critical).

**Skywing** 天空之翼 — the Skirmisher's own third: Heart of the Sky (with a bow: attack speed +20%, movement +10%, dodge
+8%, arrows 15% lighter); **Wingbeat** (5 s: attack speed +30%, movement +25%); **Flying Feathers** (five arrows side by
side ×0.5, each miring 1.5 s); Ride the Wind (every arrow of one's bow that lands brings every skill 0.3 s nearer); Flying
Feathers' mastery (+2 arrows, −2 s); **Ten Thousand Feathers** 万羽天坠 (ultimate: the 5×5 round one, five times ×0.6;
for those 5 s dodge +30%, movement +20%); Sky Walker (capstone: every blow dodged brings every skill a second nearer, and
the next blow is a sure critical).

The mechanisms: in data, the roots and most passives (Ambusher, Hunting Ground, Sure Eye, Killshot, Still as Stone, Wind
Step, Rapid Fire, Running Fight, the hearts; a passive's `attackHaste` and `damage` may be less than nothing — Hawk's
Sight, Heart of the Sky —, and `combatDelay` slows by it, at most by half); an active may carry a passive too (Mark
Prey's: the prey struck harder, shared with one's companions, so the hound's bites count). A new status, **hunted** 猎物
(content afflictions.ts: 10 s, steps ×1.25), is what makes a foe prey; Mark Prey and the Dawn Flight leave it, Greenwood
Dawn's heart and Mark Prey pay against it. Coded by id: Hawk's Sight and Long Shot in `rangeBonus` (a bow's reach to the
map's edge, `MAP_WIDE`; +2), Long Shot's and Unblinking's distance in `combatStrike` (cells between the striker and the
struck), Ride the Wind in `afterBlow`, Lord of the Hunt in `onDefeat` (the felled's `hunted`), Sky Walker in the combat
slot's `damage` (a dodge this tick). The steps a passive reads (`standing`, `moving`) are kept for whoever has one (and
Patience). `mark` pays its caster only what its `buff` says (a Death Mark's, Sighted's); `rain` takes a `buff` as `field`
does (Ten Thousand Feathers). The first tree's Hawk Eye is **Far Sight** 远眺 now, the third having the name. Gone:
Hawk's Patience, Wind Arrow, Fletcher, Thousand Arrows, Eagle's Grace (the Master Archer's). An older save
(`migrateProfessions`, `RANGER_LAYOUT`): a ranger's every point in the old paths and the mastery comes back, to spend
again; a Trapper or a Beastmaster is a Hunter, a Sharpshooter the Sniper; the skill bar lets go of them. Proof:
`tools/test/advancement.test.ts` (the paths and thirds; the Hunter's, the Sniper's and the Skirmisher's mechanisms on a
field of slimes), `migrations.test.ts`.

### Mage (the three elements', 2026-11-05)

| Path | Root (passive) | One arm | The other | Ultimate (2) | Third |
| --- | --- | --- | --- | --- | --- |
| **Cryomancer** 霜术师 — ice: frozen, then shattered | Rime: +30% on the frozen | **Ice Lance** (through the line ×1.6, frozen 1 s) → **Ice Spikes** (the 3×3 two ahead out of the ground ×1.3, frozen 1 s), Shatter (a blow on the frozen ends it and doubles) → Permafrost (what one freezes, half again as long), Ice Lance's mastery (+2 cells, +0.4×) | **Glacial Prison** (the first foe frozen 4 s) → **Frozen Ground** (the 3×3 two ahead frozen over 6 s: who walks onto it is frozen 1 s), Frost Armour (who strikes you hand to hand frozen a moment, one time in five) → Deep Chill (critical +15% on the frozen), Frozen Ground's mastery (−6 s) | Blizzard (the 5×5 round you, five times ×0.6, freezing) | **Everwinter** 永冬 |
| **Pyromancer** 炎术师 — fire: set burning, then burst | Kindling: fire sets the struck burning one time in three | **Flame Wall** (the 5 cells ahead, 5 s) → **Dragon's Breath** (fire down the 4 ahead ×1.4, burning), Conflagration (+25% on the burning) → Wildfire (a burning foe felled: those within 2 struck ×0.3 and set burning), Flame Wall's mastery (+2 cells, −4 s) | **Combustion** (every burning foe within 5 bursts ×2.5) → **Pyroblast** (one bolt ×3 within 6), Ember Heart (fire skills rest 20% less) → Searing (critical +10% on the burning), Combustion's mastery (+2 cells, +0.5×) | Inferno (the 5×5 round the first foe, four times ×0.9) | **Worldfire** 劫火 |
| **Stormcaller** 雷术师 — lightning: quick, sure, holding a moment | Static: lightning electrifies the struck one time in four | **Lightning Bolt** (the first foe within 6 ×2) → **Thunder Spear** (through the line, 6 cells ×1.5), Overload (+25% on the electrified) → High Voltage (critical +15% on the electrified), Thunder Spear's mastery (+2 cells, +0.4×) | **Thunderclap** (those within 2 ×0.9, electrified 1 s) → **Lightning Step** (through up to 4 cells, a blow on each passed ×1.2), Quickening (attack speed +10%, movement +8%) → Storm Spirit (lightning skills rest 20% less), Lightning Step's mastery (+2 cells, −3 s) | Thunder Prison (the 5×5 round the first foe, five times ×0.9, electrifying) | **Wrath of Heaven** 天罚 |

**Everwinter** 永冬 — a winter without end, the Cryomancer's own third: Heart of Winter (ice skills +20%); **Glacier**
(a glacier down the 5×3 ahead ×2, frozen 1.5 s); **Cold Wave** (those within 3 ×1.0, frozen 2 s); Frostbite (2 drawn
back by each blow on the frozen); Cold Wave's mastery (+1 cell, −5 s); **Endless Winter** (ultimate: the 7×7 round you,
six times ×0.8, freezing); Still Time (capstone: a Shatter triples instead of doubling, and each brings every skill a
second nearer).

**Worldfire** 劫火 — the fire said to burn at the end of a world's age (lore.md §2: the Night is the world's own collapse,
come round again), the Pyromancer's own third: Heart of the Worldfire (fire skills +20%); **Immolate** (8 s: +20% damage,
and who strikes you hand to hand catches fire); **Scorched Earth** (fire down the 5×3 ahead ×2, burning); Burnout
(Combustion leaves the fire burning); Scorched Earth's mastery (+2 cells, +0.4×); **Worldfire** (ultimate: the 7×7 round
the first foe within 6, ×3.5, burning); All Is Kindling (capstone: each foe felled burning brings every skill two seconds
nearer).

**Wrath of Heaven** 天罚 — heaven's punishment, the Stormcaller's own third: Heaven's Might (lightning skills +20%);
**Bolt of Judgement** (the first foe within 7 ×4, a sure critical); **Thunder Shroud** (8 s: attack speed +20%, dodge
+10%, and who strikes you hand to hand is electrified); Thunderstrike (every critical electrifies); the Shroud's mastery
(3 s longer, −5 s); **Wrath of Heaven** (ultimate: the 7×7 round you, four times ×1.2, electrifying); Storm Unending
(capstone: each lightning skill cast brings every other skill a second nearer).

The mechanisms: what the paths and thirds pay in data (Rime, Overload, High Voltage, Deep Chill, Searing, Frostbite,
Quickening; the buffs Immolate and the Thunder Shroud), and coded by id — Static beside Kindling in a skill's blow; the
thirds' hearts (`HEARTS`: an element's skills ×1.2) and the element's quicker rest (`QUICKER`: Ember Heart, Storm Spirit)
in actives.ts; Permafrost (a freeze ×1.5 as it is laid); Burnout (a detonation of the burning ends nothing); Still Time
(Shatter's bonus 2 for 1, combat.ts; a shatter landed hastens, actives.ts `blow` and `afterBlow`); Wildfire and All Is
Kindling on a defeat (the felled's `burning`, `CombatState.felled`); Immolate and the Thunder Shroud in the struck one's
answer (index.ts, beside Frost Armour); Thunderstrike after the critical (combat.ts); Storm Unending in `castSkill`.
`quake` and `slam` draw their element's effect on their cells. A new hazard, the **frozen ground** (`fixture/hazard/
frozen_ground` 冻土, 6 s; its rule freezes who walks onto it 1 s, a point of ice). The Dawnbringer (Dawnlight, Sunburst,
Sanctuary, Lantern Soul, Mercy of Dawn, Daybreak) and the Archmage (Arcane Mastery, Time Warp, Mana Flow, Convergence,
Ascendance) went; holy ground stays a type no skill lays now, and `shot`'s and `arc`'s `element: 'all'` stays (a Trinity
Cut). Proof: `tools/test/advancement.test.ts` (the paths and thirds; the mechanisms on a field of slimes), the cases in
`actives.test.ts`, the older save in `migrations.test.ts`.

### Swordsman (2026-11-03)

A fifth profession, asked for with two paths, each with its own third (a third path, the Spellblade, asked for on
2026-11-04): the **katana** (`item/weapon/blade/katana`, the
profession's own) and the **scabbard** in the off hand (`item/armor/scabbard`, attack speed +4%); a first tree of
twenty-six in the shape of the others' (Kenjutsu at its root, an arm of the edge and an arm of the feet, the Way of the
Blade; Cross Cut, Rising Slash, Step Cut, Whirl Cut; Focused Stance, Piercing Thrust, Heaven Rending; five masteries,
Blood on Steel, Unwavering, Flowing Blade, Sword Soul; Noto, Wind Cutter, Steady Breath, Edge Discipline); the set
Watercutter (sets.ts). The paths, twelve skills each on two arms, and their thirds, seven each:

| Path | Root | One arm | The other | Ultimate (2) | Third |
| --- | --- | --- | --- | --- | --- |
| **Sword Saint** 剑圣 — the cut and the way of the sword, some mobility | Iaido Stance: standing, with a katana, +30% | **Iaido** (through the foes in 4 cells, ×2.2) → **Swallow Return** (there and back, ×1.6 each) and a mastery; Zanshin (critical +20% on the half-dead) → Iaido's mastery | **Phantom Sword Dance** (five cuts across the three ahead, ×0.7) → Flowing Water (on the move, attack speed +15%) and the dance's mastery; **Shukuchi** (a step of 4) → Wind Blade | **Issen** (the 6×3 ahead, ×3, sure critical) | **Sword Heart** 剑心: Sword Heart (critical +10%, critical damage +20%); **Still Water** (4 s: six blows in ten from the front turned aside, critical +20%); **Void Slash** (a cut flown through a line of 6, ×2); No Mind; Iaido: Perfection (farther, and back); **Ten Thousand Swords** (blades rain on the 5×5 round you, four times); Sword God (capstone) |
| **Sacrificer** 献祭者 — "suffering brings one near to god" taken at its word, a penance past the Five: health for strength, stronger the more hurt | Pain Pact: the more hurt, the harder (to +40%) | **Blood Offering** (pay 20%: 8 s of +50% damage, +10% critical) → **Rending Sacrifice** (pay 10%: the three ahead ×3) → Numbness; Agony (each blow taken a stack, ten, +3% each) → the offering's mastery | **Crimson Whirl** (two turns, bleeding) → Blood Drinker (below half, 2 drawn a blow) → Undying Rage (below a fifth, mend 2 a second); **Frenzy** (6 s: attack speed +30%, movement +15%, 15% more taken) → the whirl's mastery | **The Sixth Suffering** (pay 30%: 8 s of +60% damage, +25% attack speed, 3 drawn a blow) | **Mad Martyr** 狂殉者 (the user's choice of the names offered, 2026-11-04): Vessel of Pain; **Flesh for the Blade** (pay 10%: skills +50% 6 s); **Pain Spread** (pay 10%: those within 3 ×1.5, bleeding); Feed on Pain; the Sixth Suffering's mastery; **Final Offering** (pay 25%: the 5×3 ahead ×4); Undying Body (capstone: every 40 s a fatal blow does not fell, and one mends to half) |
| **Spellblade** 魔剑 (the user's name for it, 2026-11-04) — blade and spell together (物法双修): each cast makes the next blow harder, each blow brings the next cast nearer | Blade and Spell: after a cast, the katana's next blow within 3 s +50%, carrying the cast's element | **Flame Enchantment** (10 s: blows carry fire, +10%, one in four burns) → **Frost Enchantment** (ice, critical +10%, one in five freezes 1 s) → Arcane Edge (what carries an element +20%); **Thunder Enchantment** (lightning, attack speed +15%, one in five stuns 0.5 s) → Mana-Tempered Steel (+10%, skills +15%) | **Flame Slash** (the three ahead ×1.6, burning) → **Thunder Thrust** (through a line of 4, ×1.8, lightning) → its mastery; **Frost Ring** (round you ×1.0, frozen 1.5 s) → Channeling Blade (each blow that lands: every skill 0.3 s nearer) | **Trinity Cut** (three cuts across the three ahead, fire, ice, lightning, ×1.6 each) | **Nightbreaker** 破夜之刃 (the user's choice of the names offered, 2026-11-04: where the Church keeps the Night away with the Five, it means to break it): Blade and Spell as One (+15%, cooldowns −10%); **Prism Enchantment** (12 s: the three elements in turn, +20%); **Raikiri** (lightning through the foes in 5 cells, ×2.6, stunned 0.8 s); Ringing Blade (what a cast readies lasts 5 s, two blows); **Falling Star** (a leap, fire on the 3×3, ×2.4, burning); **Ten Thousand Thunders** (lightning on the 5×5 round you, four times, ×1.1); Seamless (capstone: the blow after a cast +100%, each that lands every skill 1 s nearer) |

New in the engine and the module for it: the `dash-strike` kind again (an Iaido, a Swallow Return: `count` back and
forth), `arc` with a `count`, a `pierce` whose `missile` is a blade's thrust (`blade`) or a cut flown (`wave`), a rain
of blades (`missile: 'knife'`), a price in health for any skill (`ActiveDef.cost`, paid by castSkill), and three talents
coded (Pain Pact, Agony's stacks, Undying Body). The Spellblade's: an enchantment (`SkillPassive.imbue`, on a buff: the
element the katana's blows carry while it lasts, `all` the three in turn; one at a time, a new one ending the one
before), the element lent a blow (`Strike.element`: carried by the act as its `element`, answered by the element rules
as any element is, and now and then leaving its status — a burn, a freeze, a stun), an `arc` of `element: 'all'`
(a Trinity Cut), and five talents coded (Blade and Spell's charge, Arcane Edge, Channeling Blade, Ringing Blade,
Seamless). The Sacrificer's ultimate was renamed The Sixth Suffering (the world has no god of pain: lore.md's Church
teaches that suffering brings one near to god). The trainer's panel, the skill tree, the boss challenge (a loadout of
its own) and the wiki know five professions (four since the warrior went, 2026-11-05); a profession may have two paths or three.

### Cleric (2026-11-12)

Asked for: a new profession, the **Cleric** 圣职者, a cross for its weapon, fought with hand to hand, and three paths —
the **Paladin** 圣骑士 (the healer's: 奶妈路线) to the **Evangelist** 福音传道者, the **Avenger** 复仇者 (the fighter's, dark)
to the **Sentence of Suffering** 苦痛断罪, the **Inquisitor** 异端审判者 (control, damage, strong against one) to
**Doomsday** 末日裁决 (the Chinese names the user's; the skills and the English designed for them). The **cross**
(`item/weapon/blunt/cross` 十字架, power 4, `profession:cleric`, holy; forged at the anvil from two ingots and a plank,
no roll in the world so the maps' rolls stay as they were) and the **rosary** in the off hand (`item/armor/rosary` 念珠,
def 1, the Workshop's from two sticks; its power the Litany 祷文: with a cross, one's mending +20%, and a blow that lands
mends 2 one time in four). A first tree of twenty-six in the shape of the others': Faith at its root (with a cross +10%,
each blow drawing back 1), an arm of the blow (Blessed Arms against the undead and the night's things, Zeal) and an arm
of the body (Devotion, Steadfast), the Holy Vessel; Smite, Prayer (a mending of oneself and those who follow within 6),
Consecrate (holy ground round one: those of one's side mend 2 a second, the undead that walk onto it burn), Rebuke; Holy Light, Blessing, Divine Wrath; five masteries; Hymn, Penitence, Vigil, Sainthood; Hammer of
Heaven, Ward of Light, Pious, Anointed. The set **Matins** 晨祷 (sets.ts, plate); four of the warrior's old sets made by
the Church lean the cleric now (docs/sets.md).

| Path | Root | One arm | The other | Ultimate (2) | Third |
| --- | --- | --- | --- | --- | --- |
| **Paladin** 圣骑士 — the light that mends: oneself and those who follow healed, guarded, the foe drawn on | Oath of Light: mending +25%, damage taken −5% | **Healing Light** (oneself and every companion within 6, 30% of each's health) → **Renew** (10 s: those within 6 mend 2 a second), Blessed Hands (mending +20%) → Healing Light's mastery, Merciful (those within 6 at half health: −20% taken) | **Guardian Light** (those within 3 struck lightly and turned on one; 5 s −30% taken) → **Radiant Blow** (×2.2, stunned 1 s), Iron Faith (−12% taken) → Radiant Blow's mastery, Shining Armour (while Guardian Light is up: 3 a second) | Divine Intervention (6 s: one and those within 6 take half and mend 3 a second) | **Evangelist** 福音传道者 |
| **Avenger** 复仇者 — the Church's dark hand: pain answered with pain | Vengeance: +30% on the one who struck one last, within 3 s | **Scourge** (two lashes over the three cells ahead ×1.1, bleeding) → **Wrath** (8 s: +30%, 2 drawn back a blow, +10% taken), Blood for Blood (at half health: +10%, 2 drawn back) → Wrath's mastery, An Eye for an Eye (struck hand to hand: struck back one time in three, ×0.6 of one's attack) | **Black Flame** (×1.4 within 5, burning) → **Torment** (every bleeding foe within 4 ×2.2, the bleed spent), Shared Suffering (+25% on the bleeding and burning) → Torment's mastery, Dark Zeal (critical +12% on them) | Night of Wrath (those within 3 ×2.2, bleeding and burning) | **Sentence of Suffering** 苦痛断罪 |
| **Inquisitor** 异端审判者 — the heretic found, branded and judged | Zealotry: +20% on the branded, the kneeling, the held | **Brand the Heretic** (the nearest within 6 branded 8 s: defence −3, +30% from one) → **Shackles** (held 3 s), Mark of Heresy (critical +15% on the branded) → Shackles' mastery, Interrogation (critical damage +40% on the held, stunned, kneeling) | **Burn the Heretic** (×1.6 within 5, burning 5 s) → **Purging Flame** (the 3×3 round the first foe ×1.8, burning), The Stake (+25% on the burning) → Purging Flame's mastery, No Mercy (+25% below half) | Sentence (×5, a sure critical, stunned 2 s) | **Doomsday** 末日裁决 |

**Evangelist** 福音传道者 — the Paladin's own third: Gospel (mending +30%; one and those within 6 +10%); **Call the Faithful**
(two of the faithful, 30 s: `actor/summon/disciple` 信徒); **Psalm** (oneself and every companion within 8: half of each's
health); Apostles (the faithful and the angel: +50% health, +30%); Psalm's mastery; **Gate of Heaven** (ultimate: those
within 3 ×1.5, and an angel, `actor/summon/seraph` 天使, 30 s); Crown of Glory (capstone: each foe felled by one or a
companion mends one and those within 6 three, and every skill comes a second nearer).

**Sentence of Suffering** 苦痛断罪 — the Avenger's own third, the Five (lore.md §4) laid on the foe: The Five Sufferings
(with a cross, one's blows on one foe lay them in turn: the crown, a kneel a moment; the scourge, a bleed; hunger, a
mire; the nails, a hold; the lance, a sure critical +50%; then the crown again); **Crown of Thorns** (briars on the ring
two cells out, 6 s: who walks in kneels); **Spear of Sorrow** (a lance of dark light through the 5 cells ahead ×3, each a
sure critical); Nail and Wood (+30% on the held and kneeling); Spear of Sorrow's mastery; **All Five at Once** (ultimate:
those within 4 ×3, a sure critical, bleeding, held 2 s); Atonement (capstone: each lance laid mends a tenth of one's
health and brings every skill two seconds nearer).

**Doomsday** 末日裁决 — the Inquisitor's own third: The Last Days (critical +15%, critical damage +30% on the branded);
**Doom** (the nearest within 6: five seconds later a blow ×4, twice as hard if it is still branded); **Confess** 伏罪
(those within 3 ×0.8, on their knees 2 s); Inevitable (Doom 2 s sooner, ×2 harder); Confess's mastery; **The Last
Judgement** (ultimate: the nearest within 8 ×8, a sure critical, branded); Day of Wrath (capstone: a branded foe below a
fifth of its health is slain by one's next blow; a boss is struck half again).

The mechanisms: in data, most passives and the party's buffs; new in data a passive's `mend` (one's mending a share
more) and a `mend` with a `range` (those who follow one within it mended too, each by its own health; content
`adv/summon-mends` lets a called creature mend as a person does); a party's `regen` reaches those who follow (rainTick);
a new status, **branded** 异端烙印 (content afflictions.ts: 8 s, defence −3); a new kind, `doom` (`CombatState.doom`, its
blow in rainTick); holy ground's rule `adv/holy` (it burns the undead); the briars laid by a
skill again (Crown of Thorns). Coded by id: Vengeance (`CombatState.hurtBy`), the Five Sufferings (`Strike.suffering`,
`sufferTarget`/`sufferN`) and the Day of Wrath in combat.ts; Crown of Glory (`onDefeat`), Atonement and the Litany
(`afterBlow`), Apostles (a summon's bond) in actives.ts; An Eye for an Eye in the struck one's answer (index.ts). New
looks `penance` (the Avenger's third, its black flame) and `doom` (Doomsday's). The boss challenge has a cleric's
loadout (the Gold Knight's look). Proof: `tools/test/advancement.test.ts` (the paths and thirds; the Paladin's, the
Evangelist's, the Avenger's and the Inquisitor's mechanisms on a field of slimes), `actives.test.ts` (every active).

## 3. The first trees, deeper

Each profession gains two actives and two passives at its first tier: the assassin **Garrote** (from behind ×2, stunned
1 s), **Caltrops** (the 3×3 ahead mires for 5 s), Light Step (+8% movement with a dagger), Cut Deep (bleeds 1 more);
the ranger **Volley** (the 3×3 round the first foe, ×1.0),
**Disengage** (leap 3 back; those beside you mired), Keen Arrows (critical damage +15% with a bow), Fleet Foot (+5%
movement and dodge); the mage **Arcane Missiles** (three bolts ×0.6 at the nearest), **Mana Ward** (a ward that takes
the next 30% of your health in harm, 6 s), Focus (cooldowns −5%), Spell Power (skills +10%).

## 4. How the new skills work

- **A passive in data** (`SkillDef.passive`): a condition (`when`: night, wounded below a share, hale, standing,
  moving, a companion near or none, the own weapon held, the target's status, tag or health, a buff of one's own up)
  and what it pays (`damage`, `crit`, `critDamage`, `dodge`, `taken`, `moveHaste`, `attackHaste`, `drain`, `cdr`,
  `skillDamage`); `party` shares it (a passive, or a buff while it lasts) with those who follow one within 6 cells. The classes module reads them where it reads the talents (combat.ts), so most passives need no code
  of their own; the few that answer an event (a felling, a block, a dodge) are talents in combat.ts as before.
- **A buff in data** (the active kind `buff`, `ActiveDef.buff`): the same payments for so many ticks after the cast,
  at a cost in health if it asks one (a Blood Offering) — Gale Step and Far Sight are this already, by their own kinds.
- **New active kinds** (engine `ActiveDef.kind`, the classes module's actives.ts): `buff`; `field` (lays a hazard of
  the game's — embers, frozen ground, a cloud, a sigil — on a pattern: a line ahead, a square, a ring, a cell), and a trap
  is a field on one cell; `detonate` (each foe within reach in a status: a blow ×power, the status ended); `leap` (to
  a cell, a blow on the 3×3 there); `summon` (a creature of the game's that fights for the caster a while: its
  `companion` the caster, a faction its own); `command` (the caster's hound strikes the foe ahead); `mark` (the nearest
  foe takes more from the caster a while); `taunt`; `ward` (an absorbing ward); `rest` (other skills' rest cut). A
  `summon` or a `field` with a `power` and a `radius` strikes round the caster as it is cast. `whirlwind` takes a
  `count`; `shot` and `pierce` a `sure` critical. (A `dash-strike`, the Bladedancer's, went with it.)
- **The game's hazards** (content): the briars and embers already left by the White Knight and the dragon; new the
  miasma (poisons), the snare (holds), the spikes (bleed, mire), the blast trap (bursts with fire), holy ground (mends
  who stands in it of the caster's side), the binding sigil (hexes: the status `hexed`, attack −2, defence −3, slower)
  — each with its own rule.
- **Icons**: each new skill its own 64×64, drawn by code in the look of the others (tools/src/art/skill-paths-*.ts).
- **Effects** (runtime `render/skillfx.ts`, drawn by code, not sheets): every cast a ring at the caster's feet; a
  shockwave for a burst, a nova, a taunt, a leap's landing; a sigil flaring on each cell a field lays; the ground opening
  for what is summoned; an afterimage and a streak along every dash (a leap of the caster's or a beast's); a mark closing
  on its foe; an aura breathing round one who takes a buff, a ward, a rest; a plague's drops; a skill's blows landing; a
  soul flown home (Soul Harvest). Each in the skill's colours, `ActiveDef.look` — necro, poison, hell, shadow, hex,
  holy, fire, frost, storm, blood, steel, war, thorn, beast, wind, earth, arcane —, set by path in content
  (advancement.ts: a path's, a skill's own over it, the Necromancer's third hellfire), else by element, kind or
  profession (actives.ts `lookOf`). The worker names them as vfx (`cast:necro`, `burst:hell:2`, `trail:shadow:3:0`).

## 5. As built (2026-11-01)

Engine: `SkillDef.path`, `.tier`, `.passive` (`SkillPassive`), the new `ActiveDef` kinds and fields, `LearnRefusal`
'path' and 'tier' (`progression.ts`, a book's words too), the spawn effect's own `props` (the game's script only: the
validator refuses it in a patch). The classes module: `profession.ts` (`ADVANCE_LEVELS`, `ADVANCE_POINTS`, `PathDef`,
`cannotAdvance`, `advance`; a change of profession clears the path), `combat.ts` (`bindSkills`, `paid`: the passives
and buffs in data; the coded talents by id; the ward, the cap, the front block and Retort, Living Legend), `actives.ts`
(the new kinds; the cast's id as `casting`; Ascendance from the last cast; a Corpse Burst on a defeat, read off where
the struck stood as the blow fell, `Strike.at`), `index.ts` (the learn act's `advance`, `advanceProfession`; Thorned
Mail, Frost Armour, Unbreakable Will in the struck one's own `wounded`; a blow's `ends`). Content: `advancement.ts` (the paths, masteries, skills, hazards and their rules, the
called beasts and the raised dead; the faction `ally`), `skills.ts` (the direction `profession`, which took the profession's own branch beside `path` and `mastery`, the
professions' `paths` and `mastery`; `branchesForProfession` and `skillsForProfession` take the path), `rules.ts`
(`body/stage` answers a `price`; a blow's `ends` passed to its strike), `afflictions.ts` (`hexed`). Runtime: the
trainer's panel's advancement section (each path's card names its third), the skill tree's path, the `promote` message. Demo: Sergeant Kell a trainer. Pictures: `tools/src/art/
skill-adv-*.ts` (the skills, paths, masteries and hubs), `hazards.ts` (what the skills lay). Proof:
`tools/test/advancement.test.ts`.
