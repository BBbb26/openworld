# 0009 — G2: Gisela, the pilgrim pedlar, on market days

- **Date:** 2026-11-24
- **Status:** built; tests run 2026-11-26, see [0015](0015-round-one-review-fixes.md)
- **Related:** [0002](0002-held-ground-expansion-plan.md) T1, [0004](0004-principle-no-moral-dilemmas-and-crossbreeding-hold.md) (P1), [0008](0008-commissions-and-the-held-grounds-board.md)

> **⚠ Placeholders (temporary — to be redone):** see [0007](0007-placeholders-register.md).
> - **Gisela's look** is generated from look pins (hair tied, chestnut; a russet travelling coat). She has no portrait
>   of her own. If she is to be a recurring face, she should get one, like Tobin (docs/character-art.md).
> - **Her stock is fixed.** It holds the north's goods and the Holy City's, not the regions the player opens chapter by
>   chapter. The intended design: her stock grows with the chapter facts.
> - **No first-meeting gift.** The plan had one; lines cannot give items, and a rule for it was left out to keep this
>   small. Her first line greets warmly instead.

## Why

Direction G, trade: the Held Ground had only Alberic's stall. A visiting pedlar brings the wider world in on a rhythm:
goods from the roads, a buyer for the ground's produce, and news from the people the pilgrim has helped. The user asked
for G to be raised in priority, and for NPC–player interaction to be safe and full of kindness within the story.

## What was built

**Gisela (吉瑟拉), `npc.gisela`.** A pedlar of the pilgrim roads, 46, who has walked them since she was a girl behind
her father. Alberic, once he held the ground, showed her the way in through the thorn.
- **Sells:**
  - apple seedlings and acorns;
  - the north's sea salt, heather honey and island fleece (Frostfang's regional goods);
  - the Holy City's spiced wine and candied apples.
  - At the world's standard prices.
- **Buys** what the Held Ground grows and makes. She is not a fence and buys nothing stolen.
- **Her character:**
  - she carries letters nobody pays for;
  - she writes down the names of those who cannot pay, "and the ones who do not, I stop writing down";
  - she does not tell Firstlight where the Held Ground is ("It is not mine to tell");
  - Alberic walks her to the edge of the mist each evening.
- **Her words follow docs/writing.md:** plain whole sentences, only what she knows, kindness said plainly and never as
  a moral.
- **Status flags:** essential (she goes down, never dies). Storybound, so she is never asked to move in: the roads are
  hers.

**Market day.**
- The calendar has no weekdays, so the story counts the days. Each midnight (the story's `market` period) once the
  knight has fallen, every third day sets `haven.market` 1, and the other days set it 0 (`content/market.ts`,
  `story/market-day`).
- Her schedule's `fact:haven.market` variant puts her at `haven:market`, east of the stall, from 07:00 to 19:00. Other
  hours and days, she is on the roads (`offstage:gisela.road`).

## Safety and P1

- No choice in it costs anyone. Trading with her is ordinary trade at fair, standard prices. She cannot be killed.
- All her lines are authored. No free text reaches the player.
- She refuses nothing harmful because she is offered nothing harmful. Stolen goods are simply not bought, as any honest
  merchant's are.

## Known limits

- **She is late leaving.** If the player stays on the Held Ground past 19:00, she leaves only when the player does.
  The Held Ground has no portal out; people leave a map by walking to one, and a person on the player's map with nowhere
  to walk stays (engine `npc.ts`).
- **The days are counted at midnight, on the story.** An older save starts counting from the first midnight after this
  change.

## Files

- `games/openworld/tools/src/demo/people/gisela.ts` (new); `people.ts` (`PEOPLE`).
- `games/openworld/tools/src/demo/quest/haven.ts`: anchor `market`.
- `quest/chapter1.ts` (offstage builder): anchor `gisela.road` (first at (1,4), Roderick's cell; moved to (3,2) in [0015](0015-round-one-review-fixes.md)).
- `games/openworld/content/src/market.ts` (new): `MARKET_RULES`; `rules.ts` `BASE_RULES`; `index.ts` export.
- `ontology.ts`: the story's `market` period.
- Wiki: `wiki/pages/人物/吉瑟拉.md` (new).

## Tests

`games/openworld/tools/test/demo.test.ts`, new requirement **H8** (witnesses `npc.gisela`):
- her schedules and stock;
- the day count: nothing before the knight falls, then `[0, 0, 1, 0, 0, 1]` over six midnights;
- on a market day's morning she comes to the Held Ground.

## Not verified / to do

- **Run on 2026-11-26** ([0015](0015-round-one-review-fixes.md)): H8 (`tools/test/demo.test.ts`) passes, and `npm run check:world` passes, so the
  regional item ids in her stock (computed from `goods.ts`'s rules, `<base>/<region>_<slug>`) are real.
- **Next for her:**
  - stock that grows with the chapters;
  - a line for each commission the player has done ("they say the bread came from you");
  - a first-meeting gift.
