# 0015 — Round one reviewed: fixes after the first real test run

- **Date:** 2026-11-26
- **Status:** done; everything run here (results in §4)
- **Related:** [0001](0001-bucket-draughts.md), [0005](0005-water-and-soil.md), [0006](0006-processing.md),
  [0008](0008-commissions-and-the-held-grounds-board.md), [0009](0009-the-pilgrim-pedlar.md),
  [0010](0010-residents-tend-the-garden.md), [0011](0011-the-held-grounds-table.md), [0007](0007-placeholders-register.md) (D5)

> **⚠ Placeholders (temporary — to be redone):** none new. The register's D5 (the vessel vocabulary named in the
> society module) now also names the prop `draughts`.

## Why

Round one (0001, 0005, 0006, 0008–0011) was written when this machine was thought to have no Node.js, so none of its
tests had been run. A review that did run them (by the user's partner, relayed by the user) found seven problems.
Node 22 turned out to be in the nix store, so this time everything was run here, which found one more (the wiki check).

## 1. What was wrong, and what was done

| # | Problem | Fix | Proved by |
|---|---|---|---|
| 1 | **No commission could ever be offered.** `NEIGHBOUR` excluded `merchant` and `watchman`, but every person in Firstlight trades something and so carries `merchant` (all 15; two are also watchmen). | Exclude only `watchman` (`quests/commissions.ts`). 0008 and the wiki page 守夜人的面包 said "merchants and watchmen excepted"; both now say watchmen only. | `quests.test.ts` "offered only once the Held Ground is one's own" |
| 2a | **Residents took a flask, a waterskin or holy water for a bucket** (`isVessel` read only the tags). | A vessel must also hold draughts (`draughts` > 0): only a bucket does. | New test; without the fix it fails (the sprout was watered with a flask). |
| 2b | **No water on the ground: take the bucket, find no water, put it back, forever.** | Before going to the warehouse: if there is no water source on the ground and no bucket with water in it in the warehouse, the reason is `no-water` and nothing is fetched. A bucket already drawn is still used. | Two new tests; without the fix the first fails (the bucket was out of the store on 144 of 300 ticks). |
| 3 | `filled` (rules.ts) gave a vessel `fill` whenever its `draughts` was not ten, so (it was reported) an empty flask filled at water got `fill: 0` and poured nothing into a sprinkler. | The condition now also asks `draughts` > 0. | New test: an empty flask filled at water keeps no `fill`, and poured into a sprinkler gives it one morning. **It passes with and without the change:** in this engine a `prop` condition on a missing prop is false (`packages/engine/src/rules.ts`, `if (v === undefined) return false`), so the flask never got `fill: 0` here. The guard stays, since it says what is meant and does not depend on how a missing prop reads. If the main line reads a missing prop as 0, this is where it matters. |
| 4 | **The economy's reachability proofs broke** (`ai/test/economy.test.ts`): "mill/flour: no mill in the world", and the stall's buying of flour, cider and fruit wine unreachable. | The proofs now know two things the content does: a fixture made by a recipe can be set up, and then it is a station (the millstone, `station:mill`); and a machine that works by itself turns what is put in it into what it makes (`PROCESSES`: apples into cider, berries into fruit wine), once the machine is had. In the renewables proof, each process is an edge from what it takes to what it makes. | Both proofs pass. |
| 5 | Three tests written against what was hoped, not what happens. | `groundworks.test.ts`: the master's-bucket test stood the player at (2,2), out of reach of the water at (0,0); the player now stands at (1,1). `resident-work.test.ts`: the tending test ran 900 ticks, past the sprout's next stage at 600, so it was watered twice; now 300. `residence.test.ts`: the table test used Tam, who ate the bread he carries to sell; the Oath-Thorn's scene held every NPC still; and bread in Tam's bag counted as still in the store. It now uses Vigo (no food of his own), reads each scene through (`eng.story.advance()` every tick), and counts only loaves still in the store. | The three pass. |
| 6 | `upgradeSave`'s bringing older residents' days up to date (0011) had no test. | `migrations.test.ts`: a resident whose kept day has no meals gets the residence's day (two meals that tend hunger, the day place from the map's anchor), and a second run changes nothing; loaded from a save (the map not yet loaded), the bed and day place are kept from the old day. | New tests pass. |
| 7 | The logs 0001–0011 said "not run". The coverage test's whole put/take sweep timed out at 600 s on the reviewer's machine. | The logs now point here. The sweep: see §2. | — |
| 8 | **`npm run wiki:check` failed** (21 errors in Chinese, 2 in English), all from round one: the three commission pages lacked `{{任务奖励}}`; the sheep and lamb pages lacked `{{怪物技能}}`; 15 item templates and the home page's portal still named buckets by their old names (`{{物品|一桶水}}`, `{{物品|一桶牛奶}}`). 0001 assumed the old names kept as aliases would keep these working; aliases resolve `[[links]]`, not item templates. | Sections added; the templates and the portal icon renamed to 木桶（水） and 木桶（牛奶）. Also added round one's new words to `wiki/译名.json` (two activities, two conditions, a relation, the quest word `alias:neighbour`). | `wiki:check` passes. |
| 9 | **`tools/test/demo.test.ts` H7 failed in the full run.** Before fix 1 it stopped at "a commission is offered"; with commissions offered, it went on and failed at "a hand on the Held Ground's board opens it". Coming onto the Held Ground plays the Oath-Thorn's scene first, and a scene holds every act, so the board never answered (the same cause as the table test in 5). The game is right; the test was not. | H7 reads the scene through first, as the other demo tests on the Held Ground do (`ticks` until `seen.oath_thorn` and no scene), and uses a bare hand (`instrument: null`). | H7 and H8 pass. |
| 10 | **Gisela's offstage anchor shared a cell with Roderick's** (0009 put `gisela.road` at (1,4) of the offstage map, where `chapter2Offstage` puts `roderick.hide`): two people in one cell. `tools/test/names.test.ts` (no two anchors one cell) and `tools/test/cells.test.ts` (one occupant per space) failed in the full run. | `gisela.road` moved to (3,2), a cell nobody else uses (`tools/src/demo/quest/chapter1.ts`). | Both pass. |

## 2. The coverage test's put/take sweep: keep it whole, split it per target

Measured here: one put and take back costs about 3.1 ms, and three quarters of that is building a fresh engine for it
(0.8 ms a new ontology index, 1.0 ms deriving every recipe again; cloning the 3×3 state costs nothing). Every swept
form against every target is 351 × 347 ≈ 122,000 of them: 345 s here as one test case, past 600 s on a busier machine
under a full parallel run. Round one added only about 4% to that, so the test was already near its limit.

**Decision: keep the sweep whole, and make it one test case per target** (`it.each` over the targets). Each case is
about a second, well inside the default per-test timeout, so the special 600 s timeout is gone, and a failure names its
target. The total time of the file is unchanged. The sweep was not shrunk: it exists to catch the one form that is lost
on the one target (a seed's own prop, a built thing's pack), and sampling forms would hide exactly that.

**The same for its twin, `tools/test/yield.test.ts`'s sweep of the base library** (every act each input makes with
each held form, on every target, repeated to see that it stops yielding). It also ran as one case with its own 600 s
timeout: 466 s alone here, past 600 s in the full run. It is one case a target now too, and its count of what yields
(more than twenty) is a last case of its own, run after the targets.

**Proposed, not done (engine):** keep an ontology index's resolved types and its derived recipes per ontology, so a
new `Engine` over the same ontology reuses them. That would take about 1.8 of the 2.4 ms off every engine built, in
every test, and make this file about three times faster. It changes the engine's construction, so it is left for the
team.

## 3. Files

- `games/openworld/content/src/quests/commissions.ts` (1); `packages/modules/src/society/resident-work.ts` (2);
  `games/openworld/content/src/rules.ts` (3).
- Tests: `content/test/groundworks.test.ts` (3, 5), `content/test/resident-work.test.ts` (2, 5),
  `ai/test/economy.test.ts` (4), `tools/test/residence.test.ts` (5), `tools/test/migrations.test.ts` (6),
  `tools/test/coverage.test.ts` and `tools/test/yield.test.ts` (§2), `tools/test/coverage.baseline.json` (refreshed), `tools/test/demo.test.ts` (H7, 9); `tools/src/demo/quest/chapter1.ts` (Gisela's offstage anchor, 10).
- Docs: `docs/homestead.md` (the resident's bucket), logs 0001, 0005, 0006, 0007, 0008–0011, this log.
- Wiki: 任务/守夜人的面包, 长夜里的羊毛, 给病人的苹果; 怪物/羊, 小羊; 生活/领地居民; the bucket names in 基本/交易, 价值,
  生命值, 饱食度, 物品/条目/水袋, 一瓶水, 木桶, 物品/设施/井台, 火盆, 洗礼池, 水井, 生活/农耕, 动物; `wiki/site.json` (portal);
  `wiki/译名.json`.

## 4. Verified (2026-11-26, Node 22.23.5 from the nix store; CI uses Node 24)

| Command | Result |
|---|---|
| `npm run typecheck` | passes (last run after every change below). |
| `npm test -- --testTimeout=120000` (whole suite, 3 workers, a machine shared with other jobs) | 240 files, 3,187 tests: **3,162 passed, 23 failed, 2 skipped**, in 48 min. The 23, one by one, below. |
| `npm run coverage` | 245,692 combinations (351 forms and the empty hand × 349 targets): specific 88,829, generic 45,667, undefined 111,196. No form or target lost an answer; the one new fixture without a purpose is the apple sapling. Baseline refreshed. The split put/take sweep: 355 cases passed, 349 s, each within the default 30 s. |
| `npm run check:world` | passes: two days, the world would have asked nothing, off-schedule 6 of 470. Run again after Gisela's anchor moved: the same. |
| `npm run wiki:check` | passes: Chinese 0 errors; English 0 errors and one older warning (an alias of 水车磨坊). Run again after the anchor moved: the same. |

**The 23 failures of the whole suite:**

| Failed | Cause | Round one's? | Done |
|---|---|---|---|
| `tools/test/demo.test.ts` H7 (1) | the Oath-Thorn's scene held the board's act (§1, 9) | yes (0008) | fixed; passes |
| `tools/test/names.test.ts` (1), `tools/test/cells.test.ts` (1) | Gisela's offstage anchor on Roderick's cell (§1, 10) | yes (0009) | fixed; both pass |
| `tools/test/yield.test.ts` (1) | its one-case sweep ran past its own 600 s under the full run; 466 s alone, passing | its time, by a few per cent (§2) | split per target, as coverage's. Run again split: 376 cases (349 targets and the count, beside the file's other tests) passed in 434 s, each within the default 30 s. |
| `tools/test/writes.test.ts` (3) | the creation system (`packages/engine/src/creation*.ts`) writes behind the mutators, takes the author's hand, and names kinds | no: those files are as checked out (2026-11-23), before round one | left for the team |
| `ai/test/modder-affordance.test.ts` (9), `ai/test/pipeline.test.ts` (1) | they take a bare hand on a chair to be a hole for the modder; the base library answers it (`furniture/sit-chair`), and did before round one (it is in the coverage baseline round one started from) | no | left for the team |
| `ai/test/modder.test.ts` (4) | the AI's new-thing path now inspects the picture it drew (an art review), which the tests' scripted model does not expect, so every later call is out of step; fails the same alone | no: no file under `packages/ai` changed since the checkout | left for the team |
| `ai/test/quality.test.ts` (1) | the detector counts a tier only if it answers within `AI_WAIT_MS` (20 s); with a scripted model every second of it is this machine's own work, 12–25 s a tier here, and the tier that fails changes from run to run (medium and high, then medium alone) | no: a slow, shared machine | none; expected to pass on CI's |
| `ai/test/drivers.test.ts` (1) | `git rev-parse HEAD~1`: this checkout is one commit deep (`.git/shallow`); CI fetches two for this test | no: the checkout | none |

## 5. Found, not changed (for the user)

- **Failures older than round one** (§4): `writes.test.ts` ×3 (the creation system), `modder-affordance.test.ts` ×9 and
  `pipeline.test.ts` ×1 (a chair is no longer a hole), `modder.test.ts` ×4 (the art review the scripted model does not
  expect). They fail in the tree as it was checked out, and nothing here touches them; they are for the team, or for
  the main line, where they may already be fixed. `quality.test.ts` and `drivers.test.ts` failed only for this machine
  (its speed; a one-commit checkout).
- **The older favour 捎封信 (`parcel`, `quests/favors.ts`) has the same filter** (`notTags: ['merchant', 'watchman']` on
  its sender), so it cannot be offered either. It is not round one's. **Decided by the user (2026-11-26): fix it in its
  own small PR after this round, not here.** It is a behaviour and balance change, not only a bug fix: dropping
  `merchant` alone takes it from never to most mornings (chance 0.6), so it should be reviewed, and rolled back if need
  be, on its own. For that PR:
  - drop `merchant` from the sender's `notTags`, keep `watchman`;
  - `start.chance` 0.6 → **0.2**: about one every five game days (a game day is 24 real minutes, so some two hours of
    play). 0.15, about one a week, was weighed; but the parcel is one of the few favours in Chapter 1, before the
    commissions open, and any rarer a player may pass through Firstlight and never meet it;
  - `most: 1` as it is;
  - the wiki page 捎封信: its "商人和守卫除外" and its odds ("六成");
  - its first test (no test touches `parcel` now): it is offered at all, and never addressed to its own sender.
  - **The letter cannot go back to its writer** (checked): `QuestManager.find` skips anything already filled into an
    earlier alias (`packages/engine/src/quests.ts`, `taken.has(e.id)`), and `sender` is filled before `recipient`. The
    test above holds it.
- 4 English wiki translations went out of date when the bucket templates were renamed (only a banner; the English pages
  do not use the old names). They were left unstamped, since the same pages were already out of date for other reasons.
- The coverage sweep's one new fixture without a purpose is the apple sapling (it only grows); no form or target lost
  an answer.
