# 0008 — G1: kindly commissions, and a board on the Held Ground

- **Date:** 2026-11-24
- **Status:** built; tests run 2026-11-26, see [0015](0015-round-one-review-fixes.md) (**no commission could be offered** until fixed there)
- **Related:** [0002](0002-held-ground-expansion-plan.md) T2, [0003](0003-expansion-decisions-round-2.md) (G raised),
  [0004](0004-principle-no-moral-dilemmas-and-crossbreeding-hold.md) (P1), [0006](0006-processing.md) (bread, wool, apples)

> **⚠ Placeholders (temporary — to be redone):** none. The board is the existing commission board's type and picture.

## Why

The user asked that G (trade) go on, with NPC–player interaction kept within safe bounds, and as full of morality and
kindness as the story allows. The Held Ground now grows and makes things (0005, 0006). Commissions give that harvest a
purpose beyond the stall: Firstlight's people ask for it for someone else's good, as the long night deepens.

## What was built

Three radiant favours of a new family, **commissions** (`games/openworld/content/src/quests/commissions.ts`).

| id | Title (zh) | Asks for | For whom | Reward |
|---|---|---|---|---|
| `vigil-bread` | Bread for the Vigil (守夜人的面包) | 3 bread | those who sit up at the flame through the night | 12 Dawnmarks, regard 12, xp 15 |
| `warm-wool` | Wool for the Long Nights (长夜里的羊毛) | 2 wool | something warm knitted for the children | 6, regard 12, xp 15 |
| `sick-apples` | Apples for the Sick (给病人的苹果) | 3 apples | someone sick at home who can eat only fruit | 6, regard 12, xp 15 |

How a commission works:
- **Who asks and when.** Each morning (news `morning`) a commission may be offered (chance 0.35, at most one of each
  kind), by someone then in Firstlight who is not a watchman. Only once the Held Ground is the player's
  (`sins.defeated.alberic`). (First built excluding merchants too; but every person in Firstlight trades something and
  carries the `merchant` tag, so no commission could ever be offered. Fixed in [0015](0015-round-one-review-fixes.md).)
- **Taking one on.** It is taken from the person or from any commission board.
- **Handing it in.** The player brings the goods and talks to the neighbour: the goods are handed over, and they thank
  the player in their own words.
- **Rewards.** Below what the goods would fetch from a merchant, so a commission is never a way to make money from goods
  bought for it. Bread: 12 for three loaves, against 8 each to buy.

**A board on the Held Ground.** `haven.board`, a `fixture/sign/questboard`, stands just south-east of Alberic's stall
(`tools/src/demo/quest/haven.ts`). As every board does (`QuestManager.board()`), it lists all the favours on offer in
the world. In the fiction, word reaches the Held Ground.

## Safety and P1 (no moral dilemmas)

- **Declining costs nothing.** The neighbour says "That is all right. Someone will have some." Nobody suffers.
- **No harm at the deadline.** A commission left past its 48 hours ends kindly: "{neighbour} managed in the end, and was
  glad someone had thought of them." Unlike `meal` and `parcel`, a commission has no "is gone" ending, and no stage of it
  harms anyone (a test holds this).
- **No pressure.** No guilt-tripping lines, no reputation loss, no escalation. Kindness is asked for, never extracted.
- **All words are authored** (docs/writing.md, plain whole sentences). No free text reaches the player.
- **The goods are real.** The player's items are taken only at the hand-in the player chooses to make.

## Files

- `games/openworld/content/src/quests/commissions.ts` (new); `quests/index.ts` (`COMMISSIONS` in `QUESTS`, exported).
- `games/openworld/tools/src/demo/quest/haven.ts`: the board.
- Wiki:
  - new pages `wiki/pages/任务/守夜人的面包.md`, `长夜里的羊毛.md`, `给病人的苹果.md`;
  - `wiki/pages/物品/设施/委托板.md`: a second board, and the commissions.

## Tests

- `games/openworld/tools/test/demo.test.ts`, new requirement **H7**:
  - no commission before the knight falls; one after;
  - it shows on the board;
  - the Held Ground's board stands and opens.
- `games/openworld/tools/test/quests.test.ts`, new describe "commissions":
  - offered only once the Held Ground is one's own, by someone in Firstlight;
  - each commission has a decline line, exactly one failing stage (the deadline's), and kind words in it.

## Not verified / to do

- **Run on 2026-11-26** ([0015](0015-round-one-review-fixes.md)): excluding merchants left nobody to ask (every
  person in Firstlight trades); now only watchmen are excluded. The quest pages lacked `{{任务奖励}}`.
- The board lists Firstlight's other favours too. If the team wants it to show only commissions, `QuestManager.board()`
  needs a filter (an engine change, small).
- More commissions could follow what the ground makes: cheese, cider, cloth, milk.
