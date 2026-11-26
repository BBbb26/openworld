# 0011 — C2: the Held Ground's table (residents share meals)

- **Date:** 2026-11-24
- **Status:** built; tests run 2026-11-26, see [0015](0015-round-one-review-fixes.md) (the meal test fixed; the older-save upgrade now tested)
- **Related:** [0002](0002-held-ground-expansion-plan.md) R2, [0004](0004-principle-no-moral-dilemmas-and-crossbreeding-hold.md) (P1), [0010](0010-residents-tend-the-garden.md)

> **⚠ Placeholders (temporary — to be redone):** see [0007](0007-placeholders-register.md).
> - **Design: a meal is marked by its activity name.** A span of the residence's `days` with activity `eat` is a meal
>   (the society module's `RESIDENT_MEAL`). The clean form is a `tends` field on `ResidenceDef.days`, plus a third
>   place besides `bed` and `day` (a `table` anchor). Both are engine type changes that need the format's schemas
>   regenerated (`npm run schema`).
> - **The table has no picture.** The day places are cells around the kitchen hearth and the storehouse plots. A
>   table and stools, drawn or as a fixture, would show it.

## Why

Direction C: residents and the player build the Held Ground together. Residents had **no meal at all** in their day.
When hungry they fell back on buying (there is no merchant at the heart, most days) or, if dishonest, taking. The user
asked for content as full of kindness as the story allows. Alberic already says of the ground: "I will not have you go
hungry on it."

## What was built

1. **Two meals a day.** A resident's day on the Held Ground is now:
   - 21–7 asleep in bed;
   - 7–8 meal;
   - 8–19 day;
   - 19–20 meal;
   - 20–21 day.

   The meal spans tend hunger: the engine's existing meal logic. In a meal slot a person below nine tenths of full eats
   what they carry, or what is stored within reach that is theirs, their household's, or nobody's.
2. **The day by the hearth.** Each lodge bed's day place (`home.lodgeN.a/b.day`) is now a cell between the kitchen
   hearth and the storehouse plots. The camp bed keeps its place by the fire. So everyone's meals are within reach of
   the storehouse.
3. **What is shared.** Food that nobody owns in the storehouse, such as what the player grew and put there.
   - Bought food belongs to the player, and residents do not touch it.
   - Harvest cargo a resident deposits is recorded as the player's (0010), so it is not eaten either. The player shares
     it by moving it into the store.
4. **Gladness.** A resident who has eaten at the table is glad: `kept_table` for half a day, an emote, and one of two
   lines.
   - "Bread at a table, with people round it. I had nearly forgotten what that was like."
   - "Nobody here goes to sleep hungry. I will not forget that."
   - The hook: rules.ts `use/eat` tells a resident eater `table`; social.ts `PERSON_NEWS` answers.
5. **Alberic** gets a line once the kitchen hearth stands: "Thy people eat together at the hearth now, morning and
   evening. I have set a stool for each of them. I do not keep their names yet. I keep the stools."
6. **Older saves.** Residents who moved in before this get the new day on loading (`upgradeSave`). Bed and day place
   come from the map's anchors, else from the day they kept.

## Safety and P1

- **Nothing is taken away; there is no new pressure.** An empty store means residents fall back exactly as before. No
  unhappiness, no leaving, no penalty, no choice between residents. (Whether residents should have needs that can go
  unmet is in [0012](0012-controversial-but-promising.md), for the team.)
- **The player's own food stays the player's.** Residents eat only what no one owns, by the ownership rules that
  already exist (`mayTake`: mine, ours, nobody). It is never counted as theft.
- **All words are authored.** Kindness is said plainly by the one who feels it, never as a moral.

## Files

- `packages/modules/src/society/social.ts`: `RESIDENT_MEAL`, `residentSchedule` (exported).
- `packages/modules/src/society/effects.ts`: `moveIn` uses `residentSchedule`.
- `games/openworld/content/src/social.ts`:
  - `residence.days`, the meal spans;
  - status `kept_table`;
  - the `table` branch of `PERSON_NEWS`.
- `games/openworld/content/src/rules.ts`: `use/eat` tells a resident eater `table`.
- `games/openworld/content/src/game.ts`: `upgradeSave` brings older residents' days up to date.
- `games/openworld/tools/src/demo/quest/haven.ts`: the lodge beds' `.day` anchors by the hearth.
- `games/openworld/tools/src/demo/people/alberic.ts`: his table line.
- Wiki: `wiki/pages/生活/领地居民.md` § 饭桌.

## Tests

`games/openworld/tools/test/residence.test.ts`, new describe "the Held Ground's table":
- a resident's two meals tend `hungry`;
- at the morning meal, hungry, with bread nobody owns in a store by their day place, they eat, their hunger rises, and
  they are glad (`kept_table`).

The existing test that a resident's day is the residence's still holds: it compares against `SOCIAL.residence.days`.

## Not verified / to do

- **Run on 2026-11-26** ([0015](0015-round-one-review-fixes.md)): the meal test used Tam, who ate the bread he sells,
  under the Oath-Thorn's scene that held everyone still; it now uses Vigo and reads the scene through. `upgradeSave`
  bringing older residents' days up to date has its own tests (`tools/test/migrations.test.ts`).
- **The meal test drives the real meal logic over time.** If its timing is off, the fix is in the test's ticks, not
  the design.
- Next for C: houses for residents (R3), more chores (R1b). Both are deferred in 0002.
