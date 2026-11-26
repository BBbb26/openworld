# 0005 — A: the Held Ground's water and soil

- **Date:** 2026-11-24
- **Status:** built; tests run 2026-11-26, see [0015](0015-round-one-review-fixes.md) (one test fixed: the player out of reach of the water); three parts deferred (§4)
> **⚠ Placeholders (temporary — to be redone).** See the register, [0007](0007-placeholders-register.md).
> - **`public/assets/lsw/Fixtures/Sprinkler.png`** — the sprinkler's sprite was drawn quickly with PIL (16×16). It
>   needs a real sprite in the project's style.
> - **The rain barrel's sprite** reuses the pack's wooden tub (`TilesetElement` 6,1) and has no look for being full.
>   It needs its own sprite, ideally an empty look and a full one.

- **Related:** [0001](0001-bucket-draughts.md) (the ten-draught bucket this builds on), [0002](0002-held-ground-expansion-plan.md) W1–W4,
  [0003](0003-expansion-decisions-round-2.md) (O1: residents first, simple machines welcome), [0004](0004-principle-no-moral-dilemmas-and-crossbreeding-hold.md) (P1)

## Why

Watering is still the Held Ground's chore: the water is at the pond, the fields are not. Direction A brings water to the
fields and lets a simple machine do the daily watering. The user asked for simple machines (O1) such as a sprinkler, fed
by the ground's own water rather than free.

## What was built

1. **Dug well** (`fixture/water/well/dug`, 自砌水井). A well one sets up where it is wanted: 12 stone, 2 planks, an empty
   bucket, made from the bag once the workshop stands. A water source like any well.
2. **Rain barrel** (`fixture/farm/rain_barrel`, 雨水桶). 4 planks, 2 sticks; the workshop.
   - Out under the sky, it catches a bucketful in each hour of rain or storm, up to three (period `rain`, hourly; only
     while the player is on its map).
   - An empty bucket used on it fills, and a part-spent one is topped up; either way the barrel has a bucketful less
     (`draw`). Dry, it gives nothing and says so. A hand on it says how much it holds.
3. **Sprinkler** (`fixture/farm/sprinkler`, 洒水器). An empty bucket, an iron ingot, 2 planks; Workshop II.
   - A bucket of water used on it is poured in whole: it holds that many mornings of water, up to ten; what does not
     fit runs off.
   - Each morning (period `morning`, kept), with water in it, it waters the growing crops within two steps (the twelve
     cells of the diamond round it) that still want water this stage, and spends a day.
   - A crop watered only by a sprinkler grows one stage a day; watering by hand is faster.
4. **A bucket's quality is its draughts.** A bucket is made to hold ten times its quality's factor: crude 8, fine 13,
   masterwork 15, Vowbound 18, Stigmatic 20. A common one keeps the kind's ten and carries nothing of its own, so it still
   stacks. Filled or topped up, it holds that many, and the icon badge and tooltip show it ("15/15"). An empty bucket's
   tooltip says how many waterings it holds.

P1 check: water only. No choice costs anyone.

## How

- **Engine** `packages/engine/src/recipes.ts` `madeOf`: a made thing whose kind has `draughts` takes its quality's factor
  of them, as gear's power does. Behaviour only; no type changed, so the format's schemas are untouched.
- **Content**
  - `items.ts`: `BUCKET_DRAUGHTS` (10); `draughts` on the empty bucket.
  - `ontology.ts`: the fixtures under `fixture/farm` (portable, wooden) and `fixture/water/well/dug`, each with makeup
    and `station: 'hands'`, so their recipes are derived (`deriveRecipes`); the `rain` and `morning` periods.
  - `haven.ts`: the workshop unlocks the well and the barrel, Workshop II the sprinkler (with `unlocks` text).
  - `rules.ts`: the helper `filled` (a vessel filled holds its own `draughts`), `RAIN_WATER`, `RESERVOIR`.
    - `use/fill`: from a water source or a barrel with rain in it.
    - `use/water`: pour into a reservoir; top up at a water source or a barrel.
  - `water.ts` (new): the barrel's rules (`water/rain-barrel`, `water/barrel-draw`, `water/barrel-look`) and the
    sprinkler's (`water/sprinkler-morning`, `water/sprinkler-pour`, `water/sprinkler-look`).
- **Client**
  - `catalog.ts`: the barrel is the pack's tub (ELEM 6,1); the well is the pack's well.
  - The sprinkler is drawn for it (`public/assets/lsw/Fixtures/Sprinkler.png`, 16×16).
  - `itemTips.ts`: the empty bucket's line.
- **Docs**
  - `docs/homestead.md`: "Water, machines and the orchard".
  - Wiki pages: 自砌水井, 雨水桶, 洒水器.

## Tests

`games/openworld/content/test/groundworks.test.ts`:
- a bucket's draughts by quality;
- a masterwork bucket filled and topped up to 15;
- the barrel: catches rain only in rain, up to three; fills a bucket and has one less; dry gives nothing;
- the sprinkler: takes a poured bucket; waters within two steps, not beyond; spends a day.

## Not verified / to do

- **Run on 2026-11-26** ([0015](0015-round-one-review-fixes.md)): the master's-bucket test stood the player out of reach
  of the water and was fixed; `filled` now also asks `draughts` > 0; the coverage baseline was refreshed. At the time:
  ~~not run, no Node.js here.~~
  What was checked here: a script cross-referencing every new id in rules, recipes, catalog and wiki against the
  ontology and the items, every sprite key, every new wiki link, and bracket balance in each edited TypeScript file.
  It found one wrong id, since fixed.
- **`npm run coverage` must be re-run.** New forms and fixtures change the swept space, so the coverage test fails until
  the baseline is refreshed (the standing rule after rule changes).
- The sprinkler's art is a small placeholder.

## Deferred (with reasons)

- **Irrigation ditch and waterwheel.** Both need the world to ask "what lies next to this thing" (a ditch beside a
  field, a wheel beside a stream or a millstone). There is no such condition today; adding one changes the engine's
  `Cond` type, the ModSpec docs and the format's generated schemas, which can only be regenerated with Node. Next step:
  a `count … in: 'area'` condition, then both. The waterwheel's art already exists (`lsw/Fixtures/WaterWheel.png`).
- **Soil fertility → harvest quality.** It needs `spawn` to make things of a quality, and food priced by quality. That
  is an engine and economy change; it waits for its own topic.
