# 0007 — Placeholders register (temporary art and design)

- **Date:** 2026-11-24 (kept up to date)
- **Status:** living register. Every log that adds something temporary adds a row here, and every log carries a
  "⚠ Placeholders" block right under its status line.
- **For:** the art team, and whoever designs the final version.

**Statuses:** **PLACEHOLDER** = in the game now, must be redone; **REDONE** = replaced (keep the row, with the date).

## Art

| # | File (under `games/openworld/public/assets/`) | Used by | Why it is temporary | What the final needs | Log | Status |
|---|---|---|---|---|---|---|
| A1 | `lsw/Fixtures/Sprinkler.png` | `fixture:sprinkler` (洒水器) | drawn quickly with PIL, 16×16 | a sprinkler in the project's style (a post, a copper rose, spray) | 0005 | **PLACEHOLDER** |
| A2 | `na/…/TilesetElement.png` tile (6,1) | `fixture:rain_barrel` (雨水桶) | the pack's wooden tub, reused | a rain barrel of its own; ideally an empty look and a full one | 0005 | **PLACEHOLDER** |
| A3 | `lsw/Animal/Sheep/SpriteSheet.png` | `creature:sheep` (羊), `creature:lamb` (小羊, scaled 0.7) | the cow's sheet recoloured: the cow's body and legs, wool, a dark face | a sheep sheet (4×4 walk, as `tools/src/art/animals.ts` draws the cow and hen), and a lamb of its own | 0006 | **PLACEHOLDER** |
| A4 | `lsw/Fixtures/AppleTree.png` (frames 0 and 1) | `fixture:apple_tree`, `fixture:apple_fruiting` (苹果树, 结果的苹果树) | the pack's small tree; the fruiting frame has apples painted on | an apple tree drawn as one, bare and in fruit | 0006 | **PLACEHOLDER** |
| A5 | `lsw/Items/Cider.png`, `lsw/Items/FruitWine.png` | `item:cider`, `item:fruit_wine` (苹果酒, 果酒) | the camp's bottle with its glass recoloured | bottles of their own | 0006 | **PLACEHOLDER** |
| A6 | `na/…/TilesetElement.png` tiles (9,1), (1,1) | `fixture:cask` (酒桶), `item:flour` (面粉) | the pack's barrel and grain sack, reused | own sprites, if wanted (acceptable as is) | 0006 | **PLACEHOLDER** |
| A7 | `na/…/TilesetNature.png` tile (5,9) | `item:apple_seedling`, `fixture:apple_sapling` (苹果苗, 苹果树苗) | the same sapling as the oak's | an apple seedling (potted) and sapling of their own | 0006 | **PLACEHOLDER** |
| A8 | (generated) Gisela's look and portrait | `npc.gisela` (吉瑟拉) | generated from look pins; no portrait of her own | a portrait like Tobin's if she recurs (docs/character-art.md) | 0009 | **PLACEHOLDER** |
| A9 | (none) the residents' table | the day places by the hearth (0011) | there is no table or stools on the map | a table and stools (a fixture, or the hearth plot's building drawn with them) | 0011 | **PLACEHOLDER** |

## Design

| # | What | Why it is temporary | Log | Status |
|---|---|---|---|---|
| D1 | The rain barrel fills only while the player is on its map (a period, not kept) | a kept clock would fill it once on return; the right model (how much rain fell while away) is open | 0005 | **PLACEHOLDER** |
| D2 | The millstone is turned by hand (a station); no waterwheel | the waterwheel waits for an engine "next to" condition | 0005, 0006 | **PLACEHOLDER** |
| D3 | Gisela's stock is fixed (the north's and the Holy City's goods) | it should grow with the chapters opened | 0009 | **PLACEHOLDER** |
| D4 | Gisela has no first-meeting gift | lines cannot give things; a small rule is needed | 0009 | **PLACEHOLDER** |
| D5 | Resident tending names the vessel vocabulary in the society module (the tags `empty-vessel`, `liquid:water`, `water-source`; since 0015 also the prop `draughts`, so a flask is never taken for a bucket) | the clean form is a `vessel`/`waterSource` selector on `ResidenceWorkDef` (engine type; schemas to regenerate) | 0010, 0015 | **PLACEHOLDER** |
| D6 | A resident's meal is marked by its activity name `eat` | the clean form is `tends` on `ResidenceDef.days` and a `table` place (engine type; schemas to regenerate) | 0011 | **PLACEHOLDER** |
| D7 | The Held Ground's board lists every favour in the world | a filter on `QuestManager.board()` if the team wants only commissions there | 0008 | **PLACEHOLDER** |
