# 0010 — C1: residents tend the garden (pick and water)

- **Date:** 2026-11-24
- **Status:** built; tests run 2026-11-26, see [0015](0015-round-one-review-fixes.md) (two faults fixed there: a flask taken for a bucket; fetching a bucket over and over where there is no water)
- **Related:** [0002](0002-held-ground-expansion-plan.md) R1a, [0003](0003-expansion-decisions-round-2.md) (C: residents and the player build together), [0001](0001-bucket-draughts.md), [0005](0005-water-and-soil.md)

> **⚠ Placeholders (temporary — to be redone):** see [0007](0007-placeholders-register.md).
> - **Design: the vessel vocabulary is named in the society module.** It uses the tags `empty-vessel`, `liquid:water`
>   and `water-source`, which the engine's ModSpec already names. The clean form is a `vessel` / `waterSource` selector
>   on `ResidenceWorkDef`, configured by the game. That is an engine type change: it needs the format's schemas
>   regenerated (`npm run schema`); not done yet (since 0015 the module also reads the prop `draughts`).
> - **UI:** the panel only changes its note. Dry crops are not marked on the cell picker; the overview already counts
>   "Needs water".

## Why

Direction C: the Held Ground is built by its residents and the player together. Agreed (O1): residents first, simple
machines too. Watering is the ground's daily chore; a resident who already harvests a plot can now look after it.

## What was built

The **harvest order** now tends its cells:
1. **When.** Nothing authorized is ripe, and something authorized is dry (the residence's `growing`: a growing crop
   not yet watered this stage).
2. **Taking a bucket.** The resident takes a bucket from the order's warehouse. A bucket with water in it is taken
   first. It becomes task cargo: the player's, recorded, recoverable.
3. **Filling it.** If the bucket is empty, the resident fills it at the nearest water on the ground: a water cell, or a
   thing that is a water source, such as a well or a dug well (0005).
4. **Watering.** The resident walks to each dry authorized crop in turn and waters it through the bucket's own rules,
   the same acts as the player's. Each spends a draught (0001); a master's bucket holds more (0005). The bucket is
   refilled when it runs dry.
5. **Putting it back.** The bucket goes back to the warehouse when nothing is dry, or as soon as something ripens: the
   harvest comes first.
6. **When it cannot.** With no bucket in the warehouse, or no water on the ground, the panel says why
   (`no-bucket`, `no-water`).

The order kind stays `'harvest'`. No engine type changed, no schema, no older-save migration: an existing harvest order
simply begins to tend.

## Safety and P1

- **The resident never leaves the Held Ground.** Water is drawn only from the ground's own sources. Work runs only
  while the player is there, 07:00–21:00, as before.
- **The work stays the player's to give and take back.** Only cells the player authorized are touched. Unauthorized
  crops are left alone (a test holds it). The player can pause or revoke at any time, and the bucket stays recoverable.
- **Nothing harmful is possible:** watering, nothing else. Nobody is asked to choose anything.

## Files

- `packages/modules/src/society/resident-work.ts`:
  - `tend`, `authorizedDry`, `carriedVessel`, `vesselInWarehouse`, `waterNear`;
  - the two reason texts;
  - `runWork` calls `tend` before the harvest's own path.
- `games/openworld/client/src/ui/homestead.ts`: the harvest note says what tending does.
- `docs/homestead.md` § Resident work orders; `wiki/pages/生活/领地居民.md`.

## Tests

`games/openworld/content/test/resident-work.test.ts`, new describe "resident harvest work tends its cells":
- the full round: take, fill at water, water the authorized sprout, leave the unauthorized one, return the bucket with
  nine draughts, still the player's, no cargo left;
- no bucket: nothing watered, and the reason says so.

## Not verified / to do

- **Run on 2026-11-26** ([0015](0015-round-one-review-fixes.md)): a resident took a flask, a waterskin or holy water
  for a bucket (now only a vessel that holds draughts); with no water on the ground they fetched the bucket and put it
  back forever (now they say `no-water` and fetch nothing); the round test ran past the sprout's next stage (now 300
  ticks).
- **Next chores for residents** (deferred, 0002 R1b): milking, cooking, carrying.
- **The selector form** of the vessel vocabulary, once schemas can be regenerated (see the placeholder above).
