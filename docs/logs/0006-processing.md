# 0006 — B: the Held Ground's processing

- **Date:** 2026-11-24
- **Status:** built; tests run 2026-11-26, see [0015](0015-round-one-review-fixes.md) (the economy's reachability proofs learned made stations and the cask); preservation deferred (§4); bees already existed
> **⚠ Placeholders (temporary — to be redone).** See the register, [0007](0007-placeholders-register.md).
> - **`public/assets/lsw/Animal/Sheep/SpriteSheet.png`** — the sheep is the cow's sheet recoloured (wool, a dark
>   face), with the cow's body and legs. It needs a real sheep sheet (4×4, as `tools/src/art/animals.ts` draws the cow
>   and hen). The **lamb** is the same sheet scaled (0.7) and should get its own.
> - **`public/assets/lsw/Fixtures/AppleTree.png`** — the pack's small tree with apples painted on; the bare frame is
>   the pack's tree unchanged. It needs an apple tree drawn as one (bare and in fruit).
> - **`public/assets/lsw/Items/Cider.png`, `FruitWine.png`** — the camp's bottle with its glass recoloured. They need
>   their own bottles.
> - **Reused pack tiles:** the cask is the pack's tall barrel (`TilesetElement` 9,1); flour is its grain sack (1,1);
>   the apple seedling and sapling are the pack's sapling (`TilesetNature` 5,9), which is also the oak sapling.
> - **Wiki:** the sheep's page says its picture is temporary.

- **Related:** [0002](0002-held-ground-expansion-plan.md) P1–P3, [0003](0003-expansion-decisions-round-2.md), [0004](0004-principle-no-moral-dilemmas-and-crossbreeding-hold.md) (P1), [0005](0005-water-and-soil.md)

## Why

What the Held Ground grows mostly goes to the stall raw. Direction B makes it into more: flour and bread, cider and
wine, wool and cloth, and an orchard that bears every day. It also adds one machine that works on its own, the cask
(O1: simple machines welcome).

## What was built

1. **Millstone** (`fixture/machine/millstone`, 石磨; 8 stone, 2 planks; the workshop).
   - A station (`station:mill`): a hand on it opens its panel.
   - `mill/flour`: five wheat ground into two flour.
   - **Flour** (`item/material/flour`, 面粉) cooked over a lit fire is bread, through the existing cooking rule (`use/cook`,
     its `cookedType`).
   - The ratio is chosen so a loaf keeps the price it had: flour from wheat is worth 6.25, and a loaf the same, worth 6.
     A sandbox test pins the merchant's price of bread at 8.
2. **Cask** (`fixture/machine/cask`, 酒桶; 6 planks, an iron ingot; the storehouse). A machine that works by itself.
   - Apples or berries are put in one at a time: one kind, up to twelve.
   - A hand seals it (`brewing`, two days). Sealed, it takes nothing more.
   - When its clock runs out, one **cider** (`item/food/cider`, 苹果酒) per apple, or one **fruit wine**
     (`item/food/fruit_wine`, 果酒) per berry, comes out beside it, and it is empty again.
   - It keeps time on a map one is away from, as any status clock does.
   - The world's wine (`item/food/wine`) is not touched: berries make a new fruit wine, so the inn's wine keeps its price.
3. **Apple orchard.**
   - An **apple seedling** (`item/seed/apple`, 苹果苗) from the stall's farming shelf, 12 Dawnmarks, is planted on open
     diggable ground. It becomes an apple sapling, in two days an apple tree, and the tree comes into fruit every day.
   - A hand on the fruiting tree picks three apples (a Fruit Farmer two more), and it is bare again.
   - Not a crop: no watering, no seeds, no sickle. Felled, it gives logs and sticks.
   - Three sibling kinds under `fixture/orchard`, not a parent and children, because a child would take its parent's stage.
4. **Sheep** (`actor/creature/animal/sheep`, 羊; lamb 小羊). A crated sheep costs 80 at the ranching shelf.
   - Fed as any beast is.
   - A sickle swung at a fed sheep shears it without a wound: two wool at its feet, then `shorn` for two days.
   - Two fed sheep breed a lamb, as cows do; a lamb grows up in two days.
   - **Wool** weaves into cloth one to one (`weave/wool`, unlocked by the weaving shed).
5. **The stall** buys wool, flour, cider and fruit wine.

P1 check: shearing harms nothing, breeding follows the cow's and the hen's, and the cask's drinks sit beside the
world's wine. No choice costs anyone.

## How

- **Content**
  - `ontology.ts`:
    - fixtures `fixture/machine` (`millstone` with the station tag, `cask`) and `fixture/orchard` (`apple_sapling`,
      `apple_tree`, `apple_fruiting`; stages `TREE_GROWS` then a day);
    - creatures `sheep` and `lamb`;
    - statuses `shorn`, `brewing`.
  - `items.ts`: flour, cider, fruit wine, the apple seedling, the crated sheep, and their listed values (crate 64,
    seedling 9.6).
  - `processing.ts` (new):
    - `PROCESSES` (what a cask takes and makes);
    - each input's own load rule (`cask/load-apple`, `cask/load-berries`: a typed host that inherits for any other target);
    - `cask/load`, `cask/seal`, `cask/done`.
  - `orchard.ts` (new): `orchard/plant` (tag `tree-seed`), `orchard/pick`, `orchard/bare`.
  - `homestead.ts`:
    - sheep in the breeding rules, with their own words for a lamb born;
    - `home/shear`;
    - the stall's new offers and buys.
  - `life.ts`: `mill/flour`, `weave/wool`; the millstone in `STATIONS`.
  - `haven.ts`: the workshop unlocks the millstone, the storehouse the cask, the weaving shed wool cloth.
  - `prices.ts`: the cask's conversions in `ruleWays()`. Flour is priced by its recipe and bread by `cookedType`, as before.
- **Client** (`catalog.ts`)
  - Reused: the pack's sack for flour (ELEM 1,1); its tall barrel for the cask (ELEM 9,1); the mill's own millstones
    (`lsw/Fixtures/Millstones.png`); the pack's sapling.
  - Drawn: an apple tree, bare and in fruit (`lsw/Fixtures/AppleTree.png`, from the pack's small tree); cider and fruit
    wine (`lsw/Items/Cider.png`, `FruitWine.png`, the camp's bottle recoloured); a sheep sheet
    (`lsw/Animal/Sheep/SpriteSheet.png`, the cow's sheet in wool with a dark face — a placeholder until one is drawn; the
    lamb is the same, smaller).
- **Docs**
  - `docs/homestead.md`.
  - Wiki pages: 面粉, 苹果酒, 果酒, 苹果苗, 装箱的羊, 石磨, 酒桶, 苹果树苗, 苹果树, 结果的苹果树, 羊, 小羊.

## Tests

`games/openworld/content/test/groundworks.test.ts`:
- the millstone: its panel opens; five wheat make two flour; flour on a lit fire is bread; a loaf is still worth 6;
- the cask: three apples in; berries refused while it holds apples; sealed for two days; three cider out; empty again;
- the orchard: plant, two days, a day, pick three apples, bare again;
- the sheep: unfed gives nothing; fed gives two wool and keeps its health; shorn gives nothing more;
- prices: flour, cider and fruit wine are their makings and the work once.

## Not verified / to do

- **Run on 2026-11-26** ([0015](0015-round-one-review-fixes.md)): `ai/test/economy.test.ts`'s reachability proofs did
  not know a made millstone is a station or what the cask makes; they do now. The sheep and lamb wiki pages lacked
  `{{怪物技能}}`. The coverage baseline was refreshed. (At the time only the id, sprite, wiki-link and bracket
  cross-check was run, see 0005.)
- **Bees already exist** (life.ts: the beehive, the bee box, honey, candles from honey), so nothing was added for them.
- **Sheep art** is a placeholder recolour of the cow; a sheep should be drawn properly (`tools/src/art/animals.ts`).
- Residents could later turn the millstone, fill the cask and shear the flock (direction C's chores).

## Deferred (with reasons)

- **Preservation (smokehouse, brine crock).** The world has no spoilage: food never goes off, so keeping it fresh would
  mean nothing yet. Spoilage touches every food, the larders and the people's meals; it needs its own decision. The
  fish-drying rack's art exists (`lsw/Fixtures/FishRack.png`) for when it comes.
- **Waterwheel-driven milling.** It waits for the "next to" condition (0005 §4); until then the millstone is turned by hand.
