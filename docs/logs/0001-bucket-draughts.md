# 0001 — The Held Ground: a bucket holds ten draughts of water

- **Date:** 2026-11-24
- **Status:** done; tests run 2026-11-26, see [0015](0015-round-one-review-fixes.md) (the wiki check failed on the old bucket names in item templates; fixed there)
- **Related:** [0002](0002-held-ground-expansion-plan.md)

**Why.** Watering was tedious: the only way to water a crop was a bucket of water, and one bucket watered
one cell before it had to be filled again. The player also could not tell how much was left, and a filled
masterwork bucket read 「大师一桶水」.

### Behaviour

1. **Ten waterings per bucket.** A bucket of water now holds ten draughts. Each watering, splash or drink
   spends one; the tenth leaves an empty bucket. A bucket part spent, used on water (a river, a well, a
   fountain …), is topped up to ten again (new answer "Top up {instrument}" / 「把{instrument}装满」). A full
   bucket used on water does what it did before.
2. **What is left is shown.** Every item slot (toolbar, bag, chest panel, the item on the cursor) shows the
   bucket's remaining draughts in the icon's lower-left corner: `10/10` when filled, then `9/10` … `1/10`.
   When the last draught is used the bucket is empty and the badge disappears. The tooltip adds
   "Water left: n/10".
3. **Names say what a bucket holds.** The Chinese names of filled buckets now give the bucket and then what
   it holds: 一桶水 → 木桶（水）, 一桶牛奶 → 木桶（牛奶）, 一桶油 → 木桶（油）. Quality keeps its prefix as
   before, so a masterwork bucket reads 大师木桶 when empty, 大师木桶（水） with water, 大师木桶（牛奶） with
   milk. English names are unchanged ("Masterwork Water Bucket").
4. **Milk (design decision).** One milking fills the bucket. A bucket of milk stays one portion that is
   drunk, made into cheese or sold whole, so it has no draught count and no badge. Splitting milk into
   portions would change the cow's yield, the cheese recipe (2 per bucket) and the sale price, which
   `economy.test.ts` holds. Milking still needs an empty bucket: a bucket that still holds water used on a
   cow splashes it, as before. The quality name carries through milking (大师木桶 → 大师木桶（牛奶）).
5. **A bucket set down (verified, no change needed).** A loose item on the ground is drawn with its form's
   own sprite (`render/scene.ts`, the item path; `snapshot.ts` sends the form's sprite). Each content is its
   own form, so a bucket with water on the ground shows the water bucket picture (blue inside), milk shows
   the milk bucket, oil shows the oil bucket, and an empty one shows the dark empty bucket. The draught
   count is a prop on the thing, so it survives being set down (G) and picked up again (E).

Flasks, waterskins, holy water, oil and milk buckets have no `fill`, so they are still spent whole, as before.
Older saves' water buckets carry no count of their own and read as full (10/10).

### Implementation

- `packages/engine/src/effects.ts`: `transform` now drops the host's own `fill` prop (beside the existing
  `hp` reset): a vessel emptied or filled again holds what its new form holds (none, or full). This keeps
  an emptied bucket stacking with any other empty bucket and makes a refilled one full. The primitive's
  ModSpec doc says so.
- `games/openworld/content/src/items.ts`: `item/vessel/bucket/water` gets `draughts: 10, fill: 10`; the
  filled buckets' zh names are renamed as above. (The maximum is called `draughts`, not `capacity`, because
  `capacity` already means a container's slots in `put/container`.)
- `games/openworld/content/src/rules.ts`: new helper `draught(leaf)`: if the host's `fill` > 1, the answer
  spends one (`addProp fill -1`), else it empties the vessel (`transform @prop:emptyType`). `NOT_FULL`: a
  vessel whose `fill` is below its `draughts`. `use/water` uses `draught` for Drink and Splash, and gains
  the Top up branch (water-source target and not full: transform to `emptyType` then to `waterType`, which
  the engine leaves full).
- `games/openworld/content/src/construction.ts`: the build panel's Water entry says a full bucket waters ten.
- `packages/runtime/src/game.ts`: new optional `ClientGame.itemIconBadge(item)`, included in
  `itemIconSignature` so icons are redrawn when the badge changes.
- `packages/runtime/src/ui/common.ts`: `itemBadgeHtml(item)`; used in `hud.ts` (toolbar) and `menu.ts`
  (bag slots, chest cells, the chest panel's bag row, the carried item). CSS `.item-badge` in
  `components.css` and `game.css` (lower left; the stack count stays lower right).
- `games/openworld/client/src/itemTips.ts`: `vesselDraughts`, `vesselIconBadge`, and the tooltip line;
  wired in `client/src/game.ts`. `client/src/ui/knowledge.ts`: the farming help mentions ten waterings and
  the icon's number.
- Docs: `docs/homestead.md` (the bucket's draughts; milking). Wiki: `wiki/pages/物品/条目/一桶水.md` text,
  summary and history; the old names added as aliases (`别名`) on the water, milk and oil bucket pages, so
  existing `[[一桶水]]` / `{{物品|一桶牛奶}}` links still resolve (the page title follows the game's new
  name). `wiki/en/pages/物品/条目/一桶水.md` summary and body updated.

### Tests

- Updated for the new behaviour: `content/test/rules.test.ts` (douse leaves 9 draughts; new test: ten
  pours, top-up, the tenth empties and drops the count), `content/test/garden-species.test.ts` (one bucket
  waters every stage), `content/test/controls.test.ts` (the slot test uses a one-draught flask, and adds a
  bucket keeping its slot at 9/10), `content/test/placement.test.ts` (buckets start on their last draught
  where the test needs one watering to empty them), `tools/test/haven-economy.test.ts` (the turnip run fills
  the bucket once for all ten waterings and still ends with one empty bucket).
- New: `client/test/itemTips.test.ts` (badge 10/10, 9/10, 1/10; none for empty, milk, flask; tooltip line),
  `runtime/test/iconSignature.test.ts` (the signature changes with the badge).

### Not verified / follow-up

- ~~No Node.js on this machine, so nothing was run.~~ Run on 2026-11-26 ([0015](0015-round-one-review-fixes.md)): this
  log's tests pass. `npm run wiki:check` failed: the old names kept as aliases resolve `[[一桶水]]` links but not
  `{{物品|一桶水}}` templates, as assumed below; the templates were renamed in 0015.
- `npm run coverage` should be re-run to refresh `tools/test/coverage.baseline.json` (use/water gained an
  answer).
- The English wiki page's `source:` hash is now stale (it shows the out-of-date banner until
  `npm run wiki:translate -- stamp`). The English edition's milk and oil pages were not touched.
- Prose in the guides and wiki that says 「一桶水」 as ordinary words ("a bucket of water") was left as is.
