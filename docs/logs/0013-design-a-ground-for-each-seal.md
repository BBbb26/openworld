# 0013 — E: a ground for each Seal (design, not built)

- **Date:** 2026-11-24
- **Status:** **design for the team — nothing built.** The user asked for E and F to be designed in the logs first.
  Building waits for the team's word.
- **Related:** [0002](0002-held-ground-expansion-plan.md) E1–E2, [0003](0003-expansion-decisions-round-2.md) §4 (first sketch; O3 not yet decided), [0004](0004-principle-no-moral-dilemmas-and-crossbreeding-hold.md) (P1), [0014](0014-design-the-hall-of-the-bearers.md) (F)

> **⚠ Placeholders:** none built. The art this would need is listed in §7. If it is built, temporary art goes into
> the register, [0007](0007-placeholders-register.md).

## 1. The idea in one paragraph

Each Seal-bearer carried a share of Astra's burden for three hundred years, and was twisted by it (lore.md §6, §12).
When one falls, the night grows longer everywhere. But one small piece of land is no longer held under that burden.
Alberic, himself the first bearer, feels the mist thin in a new direction. On the steward's panel, a **ground** opens
beyond the mist in that bearer's region: Emberfall's, the Vale's, the Fens', the Altar's. Each is a small place of its
own, like the quarry or the lake. It is peaceful by day and dangerous at night, and kept by a **warden** that must be
faced once (D2) before the ground is the player's. Each gives the Held Ground something only its region grows. So the
Held Ground grows with the main line, chapter by chapter, and carries a little of every place the pilgrim freed.

## 2. Decisions it follows, and the one it still needs

- **D1:** the core is a safe cabin in the storm. Nothing here reaches the heart.
- **D2:** expansion may carry a warden's challenge, at the frontier only. Losing costs nothing at the heart.
- **Tone (0003):** new grounds are safe by day, dangerous at night.
- **P1:** no moral dilemma. Wardens are beasts or things of the place, never people. Nobody is asked to choose who
  suffers.
- **Still open: O3 — are new grounds tied to the main line?** This design assumes **yes**: each opens after its
  chapter's Seal-bearer falls. The alternative is grounds opened by land level alone. Everything below works either
  way; only the gate changes.

## 3. The four grounds

The First Seal's ground is the Held Ground itself. These are the other four.

| Opens after | Region (`regions.ts`) | Ground (proposal) | What it is | Its own yield | Warden (an elite of the place's kind) |
|---|---|---|---|---|---|
| Matthias falls (`sins.defeated.matthias`, ch2) | `redmarch`, the Scarred March | **The Quiet Field** (静场) | an old battlefield where, since Matthias fell, pain has come back, and with it rest; ash-grey earth, wildflowers in the scars | **ember soil** (a fertilizer that also warms a crop in the cold); a fire-loving crop, **emberroot** (烬根) | **The Unbowed Hound** — a cinder hound of the March that never learned to stop; laid down, it sleeps |
| Ele falls (`sins.defeated.ele`, ch3) | `tithe`, the Vale of Scales | **The Gleaning Rows** (拾穗地) | terraced rows where the Lightened were not allowed to glean; salt pans below | **salt** from its pans (art exists: `lsw/Fixtures/SaltPan.png`); a grain, **gleaning barley** (拾穗大麦), that grows fast in poor soil | **The Tally-Crow** — a great crow of the weighhouse that takes one of everything; felled, it lets them go |
| Nacht falls (`sins.defeated.nacht`, ch4) | `palefen`, the Pale Fens | **The Lantern Mere** (灯沼) | a peat bog where the dead stood waiting; since Nacht, they have lain down | **peat** (burns all night in the hearth or a brazier); the Fens' **cranberries** (a regional berry that exists) as a crop | **The Mere-Light** — a will-o'-wisp of the bog (a storm wisp's kind) that leads walkers in circles; spent, it goes out |
| The Witnesses fall (`sins.defeated.witnesses`, ch5) | `altar`, the White Altar Heights | **The Snowline Garden** (雪线园) | a high meadow under the snowline, where the white-robed once walked | **frostcap** and **snow lily** (regional herbs that exist); highland goats' wool as wool | **The Cairn-Keeper** — an ice golem of the heights (the kind exists) that guards the cairns; broken, it is snow |

A ground is **32 × 24**, built as the four grounds are today (`tools/src/demo/quest/haven.ts` `ground()`): ringed in its
region's look (`RegionDef.look`), a way back at its south edge, a sign with a few plain words.

## 4. How a ground works

1. **Opening.** A new `zone` upgrade in `content/haven.ts` `HAVEN_UPGRADES`, with a new content field
   `requires: '<sins.defeated.x>'` (`HavenUpgrade` is the content's own interface: no engine type, no schema). Before
   the fact holds, the card is hidden. After, it asks for stock as other grounds do: materials the player has, plus one
   from the bearer's region. Alberic says a line on opening, one per ground:
   - *Quiet Field:* "The pain came back to that field. So did sleep."
   - *Gleaning Rows:* "They may glean there now. I would have liked to see it."
2. **The warden (D2).**
   - **Where and when.** It stands at the ground's heart, by day too.
   - **Its fight.** An elite of the place's kind: two to four skills, a chain, a guard (`kits.ts` `ELITE_KITS`, the
     elite tier). It is not a boss: no plate, no phases.
   - **When it falls.** Its defeat rule sets `haven.hold.<ground>`, the place goes quiet, and Alberic, next time, says
     the ground is held.
   - **If the player loses.** The game's usual fall and waking; nothing at the heart changes and the stock handed in
     stays. The warden can be faced again.
   - **Gentle words for its end.** "It lies down", "it lets them go", "it goes out", "it is snow" — the place itself
     at rest, not a kill boasted of.
3. **Day and night.**
   - **The night.** The ground's zone is `combat` (the world's own night table brings the dead and the bats to outdoor
     combat maps after dark), so the nights there are dangerous.
   - **By day.** Nothing hostile comes but the warden, before it is felled.
   - The heart stays `peaceful` (D1).
4. **Its yield.**
   - **What appears by itself.** The ground's own appearances (`appear`, as the quarry's stone comes back), only once
     held: `haven.hold.<ground>` in the appearance's `where`.
   - **Its crop.** The seeds go on Gisela's shelf (0009) and the stall's once held.
5. **Its words.** Every line is authored (docs/writing.md): what the place was, as hearsay, and what it is now.

## 5. P1 and safety

- **No dilemma.** No choice between people. The warden is a beast or a thing of the place, and its end is the place's
  rest. All four grounds open; none excludes another.
- **The frontier only (D1).** Nothing at the heart is ever attacked or taken.
- **No harm to residents.** They never go to the grounds: work orders keep to the Held Ground's own map (0010).
- **Kindness in the fiction.** Each ground is a place set free by the pilgrim's hard road: rest after pain, gleaning
  after hunger, the dead lying down, quiet under the snow.

## 6. Difficulty and order

| Part | Size | Notes |
|---|---|---|
| Framework | **M** | content: `requires` on `HavenUpgrade` and its panel gate (`client/src/ui/homestead.ts`), `haven.hold.*` facts, the warden's defeat rule, the night zone, the held-only yield |
| One ground | **L** | its map (`ground()` with its region's look), its warden (an `ELITE_KITS` entry, its art), one or two new kinds with their art, its stall and Gisela entries, its demo requirement (`demo.test.ts`), wiki pages |
| All four | **XL** | in order, one chapter at a time; the Quiet Field first |

Not hard in kind: the parts all exist (grounds, elites, appearances, regions' looks). The volume is art and maps.

## 7. Art it would need (for the register when built)

- **Per ground:** the warden (a recolour of an existing kind's sheet is enough at first, flagged as a placeholder);
  the new crop's three stages, produce and seeds (`tools/src/art/crops-more.ts` draws crops in the house style);
  one sign.
- **Peat and ember soil:** an icon each.

## 8. Questions for the team

1. **O3:** tied to the chapters (this design), or opened by land level alone?
2. **Wardens:** beasts and things of the place only (this design), or also people of the region (which P1 would make
   harder)?
3. **Nights:** are dangerous nights on the grounds wanted for an LLM player's runs too, or should an experiment be able
   to turn them off?
4. **Names:** the grounds and wardens above are proposals.
