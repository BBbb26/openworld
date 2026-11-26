# 0003 — The Held Ground's expansion: decisions, round 2

- **Date:** 2026-11-24
- **Status:** decisions recorded; A and B are being built (logs 0005, 0006); D waits for the team; H on hold (0004)
- **Related:** [0002](0002-held-ground-expansion-plan.md) (the plan this updates)

The letters A–H are the eight directions of the first brainstorm (the user's own lettering):
A water and soil, B processing, C residents, D refugees of the long night, E a new ground per Seal,
F the Hall of the Fallen, G trade, H AI crossbreeding and grafting. Plan item ids (W, R, P, E, T, H) are 0002's.

## 1. Answers to the open questions

| Question (0002 §2) | Decision |
|---|---|
| Tone | Agreed. The core is peaceful, a safe cabin in the storm (D1). The new grounds beyond the mist are safe by day and dangerous at night. |
| O1 automation | Residents first. Simple machines are welcome too: a sprinkler that waters on its own, a waterwheel. Our versions are fed by the ground's water (a bucket poured in, a stream), not free. |
| O2 seasons | Shelved. Seasons would reshape every system and do not fit the main line; the lengthening night is the Held Ground's change over time. |
| O3 new grounds tied to the main line | Not decided yet (the user is still thinking). |
| O4 AI crossbreeding | Kept as a direction, the most paper-aligned of all; the user will discuss it with the team first. **Later the same day: on hold for a safety review (log 0004).** |
| O5 the warden's challenge | As proposed: mostly combat through the encounter director, with room for a non-combat trial later. |

## 2. Per direction

- **A water and soil, B processing — build now.** Logs 0005 (A) and 0006 (B).
- **C residents — adopted as proposed.** The Held Ground is built by its residents and the player together:
  chores beyond the harvest (water, feed, milk, cook, carry), a resident's keep (food and a bed, or they leave),
  houses the player builds for them. Next after A, B and G.
- **D refugees of the long night — idea kept, needs the team.** See §3.
- **E a new ground per Seal, F the Hall of the Fallen — liked; the user has no design yet.** Proposals in §4,
  to be confirmed before any build.
- **G trade — priority raised.** The visiting merchant, the commission board and caravans move up to the next
  phase, beside C.
- **H crossbreeding and grafting — "the world's best direction to grow"; needs the team.** See §5.

## 3. D — refugees: the constraint and options for the team (no decision)

The user's idea: a mailbox at the Held Ground where refugees' requests arrive. The constraint, stated by the
user: **no moral dilemma.** A request invites accept and refuse, and refusing a refugee is a moral trap. That is
not the situation we want for a human player, nor for an LLM playing the game in the paper's experiments.

Options that keep the arrivals without a refusal:

1. **Arrivals, not requests.** As the night lengthens (each Seal felled), people who fled it arrive by themselves
   at the edge of the ground and stay in a lean-to camp there. When a bed is free they move in; with none free
   they are safe in the camp. Nobody is turned away, nobody is harmed, the player is never asked to choose. More
   beds means more of them come inside (C's residents).
2. **Letters as news.** The mailbox holds letters, not requests: from people who found shelter elsewhere because
   they saw the Held Ground's light, now and then with a small thanks. Story through things (docs/writing.md), no
   choice.
3. **Kin of residents.** A resident's family writes and comes to join them when a bed is free. Only good news.

Questions for the team: which of these (or a mix); whether capacity may ever press (it must never mean someone
suffers); whether an LLM player's runs need the arrivals turned off for some experiments.

## 4. E and F — design proposals (to confirm)

### E — a new ground for each Seal felled

- **Form.** New *grounds*, like the quarry and the lake (separate small maps reached by the steward's "Go"), not
  more rings on the Held Ground's own map. Widening the home map again would touch every requirement on it in
  `tools/test/demo.test.ts`; a ground is self-contained.
- **Opening.** A ground's card appears in the steward's panel once its chapter's Seal-bearer has fallen (the
  chapter facts `world.ch2` … `world.fin`), and asks for stock as the others do.
- **The warden (D2).** On the first visit the ground's warden holds it. Felled (the encounter director, a minor
  monster's kit at elite scale, recoloured art), the ground is held (`haven.hold.<ground>`). Losing costs nothing.
- **Day and night.** Peaceful by day; at night the night's walkers come (the world's `appear` table already has
  them; the ground's zone lets them in). The heart of the Held Ground stays peaceful.
- **What each gives.** The region's look and one or two of its own crops or materials: Emberfall's ember soil
  (a fire-loving crop), the Vale of Scales (salt), the Pale Fens (peat as fuel, a bog crop), the White Altar
  (frost herbs).
- **Difficulty.** The framework (chapter gate, warden fact, the night flag on a ground) is **M**. Each ground is
  **L** (its map, its warden's fight and art, its crops' art, a demo requirement, wiki pages). One per chapter,
  so it can land chapter by chapter. Not hard in kind, only in volume.

### F — the Hall of the Fallen

- **Form.** A new building upgrade: a plot at the heart becomes the hall, with five plinths.
- **Mementos.** Each Seal-bearer felled leaves a memento (the White Knight already leaves the Oath-Thorn's crown;
  the others get one each). Set on its plinth (G), it sets a fact and gives the Held Ground a lasting gift: the
  bearer's burden turned round, as Alberic's vow is. For example: the dragon's ember keeps the hearth and the
  frontier's fires lit; the Fens' lantern makes nights on the grounds shorter. Gifts that touch prices are
  avoided (the economy check).
- **Words.** Each memento's description tells a little of who the bearer was, as hearsay (docs/writing.md).
- **Difficulty.** **M**: one building, a plinth fixture, five memento items (existing art recoloured), five small
  rules, wiki pages. Low risk while the gifts stay off the economy.

## 5. H — crossbreeding and grafting: questions for the team

> **Superseded the same day by log 0004:** H is on hold pending a safety review; 0004 holds its boundary sketch and
> the principle P1 (no moral dilemmas).

- The act: a seed or pollen used on a growing crop of another kind, or a scion grafted onto a tree. Both are
  holes today (undefined), which is exactly where the modder answers.
- What the modder makes: a new kind for that save only (as NPC recipe research does: `patch/save-<n>/…`), with a
  name, its stages and yield, and a 16×16 picture as data; held by the economy check before it is kept.
- For the paper: which runs, what is measured (novelty, consistency with the parents, playability), and whether
  the shared library may ever take a crossbreed.

## 6. What happens next

1. Build A and B (logs 0005 and 0006), each with a log of what was built, what was deferred and why.
2. Then G and C, in the order 0002 gives them.
3. E and F once the proposals in §4 are confirmed; D and H after the team's discussion.
