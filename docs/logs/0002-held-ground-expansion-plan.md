# 0002 — The Held Ground's expansion plan (execution log)

The plan for growing the Held Ground beyond its first build (docs/homestead.md), the decisions behind it, and
where each piece stands. Newest decisions and status changes are logged at the end (§6). Written in English;
discussed with the user in Chinese.

## 1. Direction (agreed 2026-11-24)

The Held Ground is a place that is **held**: Alberic keeps his vow turned round, the mist rings it, and the night
lengthens as the main line goes on (lore.md §12). Every expansion is read through that, not as a generic farm.

- **D1 — The core is a safe cabin in the storm.** The heart of the Held Ground (the planted sword, the camp, the
  plots, the buildings, the residents' beds, and the land already lifted out of the mist) is never attacked and
  never lost. Weather, night and the world's troubles are felt *around* it, not inside it. Nothing the player
  builds there can be undone by a threat.
- **D2 — Expansion may carry a lord's challenge.** Widening the ground past a new ring of mist, or opening a new
  ground, may ask the player to face whoever holds that land: a **warden** (a lord of the land beyond, a mini-boss),
  met at the mist's edge or in the ground itself. The challenge is at the frontier only; losing it costs nothing in
  the core (one wakes at the camp, the stock handed in is kept, the challenge can be taken again).
- **P1 — No moral dilemmas (2026-11-24, log 0004).** The game never makes a player — a person or an LLM — choose who is
  helped and who is refused, or who suffers; failure means "nothing happens yet". Every item below is checked against it.
- **D3 — Built on what exists.** New behaviour is rules and events (CLAUDE.md), residents are content (the society
  module, work orders), the building system and the encounter director are reused; no game's own loop is copied
  (no shipping bin, no sprinkler-tier treadmill). Mechanics are designed reference-first (Elin's faction branch:
  residents, jobs, visitors, branch levels; RimWorld's colonist work), then adapted.

## 2. Decisions still open (proposals; confirm before the item that needs them)

| # | Question | Proposal | Blocks |
|---|---|---|---|
| O1 | Automation by people or by machines? | People first: residents do the chores; machines only where the world has them (a watermill turns a millstone). | R1, P1 |
| O2 | Seasons? | Not now. The lengthening night is the Held Ground's change over time; seasons would rebalance every crop. | — |
| O3 | New rings tied to the main line? | Yes: each Seal-bearer felled opens one ring themed by that chapter's region, guarded by its warden (D2). | E2 |
| O4 | AI crossbreeding and grafting? | **On hold: safety review (log 0004).** Out of every phase until the team decides. | H1 |
| O5 | Warden challenges only combat? | Mostly combat (the encounter director), with room for a non-combat trial later (hold a flame till dawn). | E1 |

## 3. The work items

Priority: **P1** core to the direction or unblocks others; **P2** clear value; **P3** nice to have.
Difficulty: **S** rules and data with pack art (≈ a day); **M** a new small system or several kinds, some art
(a few days); **L** new behaviour, new UI or a boss (a week or more); **XL** several maps, many kinds, story (weeks).

### Water and soil (W) — continues the ten-draught bucket (log 0001)
- **W1 Buildable water** — a well, a rain barrel and a trough as buildable fixtures on the ground; a rain barrel
  fills in rain (the weather spans) and fills a bucket like any water source. P1 / S.
- **W2 A bucket's quality is its draughts** — crude 8, common 10, fine 12, masterwork 15 (the bucket's quality tag
  read by `draught`/`NOT_FULL` and the badge); gives "大师木桶" a use beyond its name. P2 / S.
- **W3 Irrigation ditch** — a ditch dug from water (a terrain of its own, a water source); farmland next to it is
  watered at each stage by the clock (a period rule), so a field by a ditch needs no bucket. P1 / M.
- **W4 Soil fertility** — tilled soil keeps a fertility that fertilizer, ash and resting raise and harvests
  spend; it sets the harvest's quality (the existing quality tiers). P3 / M.

### Residents (R) — automation by people (O1)
- **R1 Chores beyond the harvest** — work orders to water (a bucket, refilled at water), feed and milk beasts,
  cook at the kitchen hearth, carry produce to the storehouse; one order per resident, cells and stores named as
  the harvest order does. First slice: watering. P1 / M (watering) → L (all chores).
- **R2 A resident's keep** — residents eat from the storehouse and the kitchen (the meals system), sleep in their
  bed; unfed or unhoused, their regard falls and in the end they leave. P1 / M.
- **R3 Houses for residents** — the tents grow into houses the player builds (the building system: walls, floors,
  doors) and assigns. P3 / L.

### Processing (P)
- **P1 A mill** — wheat to flour (a millstone, turned by hand or by a watermill on the ditch), flour to bread at
  the hearth; echoes Tam's mill. P2 / M.
- **P2 Beasts and trees** — sheep (wool to the weaving shed), bees (honey; wax to Workshop II's candles), an
  orchard (planted trees that grow over days and give fruit and renewable wood for the land's upgrades). P2 / M.
- **P3 Keeping food** — a cask (fruit to wine by days of ageing) and a smokehouse or brine crock (food that
  would spoil keeps). P2 / M.

### The frontier (E) — D2
- **E1 The warden challenge (the framework and the first warden)** — the land upgrade beyond the current third
  ring, or a new ground, completes only when its warden is felled: the warden stands at the mist's edge once the
  stock is handed in, the encounter director runs the fight, its fall lifts the mist. Defeat costs nothing in the
  core. One warden first, the framework for the rest. P1 / L.
- **E2 A ring per Seal** — four rings past the third, one opened by each Seal-bearer felled (O3), each in its
  region's look (Emberfall's ember soil, the Vale of Scales, the Pale Fens' peat, the White Altar's snow), each
  with its warden and its region's crops and materials. P1 / XL (built chapter by chapter after E1).
- **E3 Refugees of the long night** — as each seal falls and the night lengthens, people who fled it come to the
  Held Ground and ask to stay: new residents for R1/R2. P2 / L.
- **E4 The Hall of the Fallen** — each Seal-bearer felled leaves a memento set in a hall at the heart: a passive,
  and a few lines of what they were, told through the thing. P2 / M.

### Trade (T) — no shipping bin
- **T1 A visiting merchant** — a pedlar comes on set days with what other regions grow and breed. P2 / M.
- **T2 A commission board** — villagers ask for goods (the radiant favours). P3 / M.
- **T3 Caravans** — a resident sent with goods to another region, back days later with coin (events by address
  across maps). P3 / L.

### The AI's ground (H) — O4
- **H1 Crossbreeding and grafting** — *on hold (log 0004: safety boundary, team review).* two crops crossed, or a scion grafted, is an act no rule answers: the modder
  makes a new kind for that save (a name, its stages, its yield, its 16×16 picture), held by the economy check.
  P2 / XL.
- **H2 Research with a resident** — a resident craftsperson works out new uses of the ground's produce with the
  player (the existing NPC recipe research). P3 / M.

## 4. The combined order (priority × difficulty)

Quick wins on the direction first, then the frontier's framework, then what fills the ground with life, then the
large and the speculative. Dependencies in the last column.

| Rank | Item | Priority | Difficulty | Phase | Needs |
|---|---|---|---|---|---|
| 1 | W1 Buildable water (well, rain barrel, trough) | P1 | S | 1 | — |
| 2 | W2 A bucket's quality is its draughts | P2 | S | 1 | — |
| 3 | R1a Residents water the crops | P1 | M | 1 | W1 (optional) |
| 4 | W3 Irrigation ditch | P1 | M | 1 | — |
| 5 | R2 A resident's keep | P1 | M | 2 | — |
| 6 | E1 The warden challenge (framework + first warden) | P1 | L | 2 | O5 |
| 7 | P1 A mill, flour and bread | P2 | M | 2 | (W3 for a watermill) |
| 8 | E4 The Hall of the Fallen | P2 | M | 2 | — |
| 9 | P2 Sheep, bees, orchard | P2 | M | 2 | — |
| 10 | P3 Cask and smokehouse | P2 | M | 2 | — |
| 11 | T1 A visiting merchant | P2 | M | 3 | — |
| 12 | R1b Residents' other chores (feed, milk, cook, carry) | P1 | L | 3 | R1a, R2 |
| 13 | E3 Refugees of the long night | P2 | L | 3 | R2 |
| 14 | E2 A ring per Seal (one per chapter) | P1 | XL | 3–4 | E1, O3 |
| 15 | W4 Soil fertility | P3 | M | 4 | — |
| 16 | T2 A commission board | P3 | M | 4 | — |
| 17 | H2 Research with a resident | P3 | M | 4 | P1–P3 |
| 18 | R3 Houses for residents | P3 | L | 4 | R2 |
| 19 | T3 Caravans | P3 | L | 4 | R1 |
| 20 | H1 Crossbreeding and grafting — **on hold (0004)** | P2 | XL | — | the team's safety review |

Phases: **1** the water slice (small, continues the bucket work); **2** life at the heart and the frontier's
framework; **3** the main line reaches into the ground; **4** depth and the AI's ground.

## 5. What every item must carry (the project's rules)

- New behaviour as rules in content (`rules.ts`, `homestead.ts`, `haven.ts`), events not engine shortcuts; a new
  primitive only with its ModSpec doc; deliberate acts on new things left as holes for the modder.
- Anything added to the demo's maps witnesses a requirement in `tools/test/demo.test.ts`.
- Every new item, fixture, creature or system gets its wiki page (`npm run wiki:check`).
- Prices through `prices.ts`; `economy.test.ts` must still hold that nothing bought, made and sold again pays.
- `npm run coverage` after rule changes, its baseline refreshed.
- Each item, when done, gets a numbered log in docs/logs/ (English) and a status line below.

## 6. Log

| Date | Entry |
|---|---|
| 2026-11-24 | Brainstorm of the expansion's directions (water and soil, residents, processing, the frontier, trade, the AI's ground). |
| 2026-11-24 | Agreed with the user: D1 the core is a safe cabin in the storm; D2 expansion may carry a lord's (warden's) challenge at the frontier. O1–O5 proposed, not yet confirmed. |
| 2026-11-24 | Work items ranked by priority and difficulty (§4). Next: confirm O1, then start rank 1 (W1). No item started. |
| 2026-11-24 | Round 2 (log 0003): tone agreed, O1 residents plus simple machines, O2 seasons shelved, G raised; A and B started. |
| 2026-11-24 | P1 adopted, H on hold for a safety review (log 0004). A and B continue (logs 0005, 0006). |
| 2026-11-24 | **A built (0005):** W1 well and rain barrel, W2 bucket quality, a sprinkler (O1); W3 ditch and W4 soil fertility deferred. **B built (0006):** P1 millstone, flour and bread; P2 sheep and wool, apple orchard (bees already existed); P3 cask (cider, fruit wine); preservation deferred (no spoilage yet). Tests written, not run (no Node.js). Next: G and C. |
| 2026-11-24 | Logs flag temporary work (⚠ Placeholders block; register 0007). **G:** T2 commissions and a board on the Held Ground (0008); T1 Gisela the pilgrim pedlar, market every third day (0009); T3 caravans **deferred** (0012 §7: risk to residents, cross-map travel). **C:** R1a residents tend the garden — the harvest order waters with a warehouse bucket (0010); R2 the table — two shared meals a day, gladness, no penalty (0011); R1b other chores and R3 houses **deferred**. Controversial ideas for the team: 0012. Tests written, not run (no Node.js). |
| 2026-11-24 | **E and F designed, not built** (for the team): E, four grounds opened by the Seal-bearers' falls, each with a warden and its region's yield (0013; O3 still open); F, the Hall of the Bearers — mementos of what each carried, small kind gifts to the Held Ground, no trophies (0014). |
