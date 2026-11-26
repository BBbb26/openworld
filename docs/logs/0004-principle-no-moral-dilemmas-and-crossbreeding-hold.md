# 0004 — Principle: no moral dilemmas; crossbreeding on hold

- **Date:** 2026-11-24
- **Status:** principle adopted; H (crossbreeding and grafting) on hold pending a safety review by the team
- **Related:** [0002](0002-held-ground-expansion-plan.md) (the plan), [0003](0003-expansion-decisions-round-2.md) (§3 refugees, §5 crossbreeding)

## Why

While A and B were being built, the user raised two worries: that AI crossbreeding (H) may cross a safety
boundary, and that the project must never build moral dilemmas. A dilemma would trouble the user, whether the
player is a person or an LLM playing the game in the paper's experiments.

## P1 — No moral dilemmas (project-wide design principle)

- The game never makes a player choose who is helped and who is refused, or who suffers. The world's needs are met
  by building more, never by turning someone away.
- No mechanic puts its cost on a person who asked for help.
- Failure means "nothing happens yet", never "someone is hurt because of you".
- It holds for a human player and for an LLM player alike.
- Every new design is checked against it before it is built, and its log says so.
- D (refugees) already follows it: 0003 §3 option 1 (arrivals, not requests; nobody turned away).

A and B, checked against P1: nothing in them asks the player to choose at someone's cost.
- Sheep: shearing harms nothing, and breeding follows the cow's and the hen's.
- Cask: cider and fruit wine sit beside the wine the world already has.
- Sprinkler and rain barrel: water only.
- Felling livestock already exists; A and B add nothing to it.

## H — crossbreeding and grafting: on hold

Nothing was built for H. It stays out of every phase until the team decides. If it comes back, this is the boundary
sketch to start the discussion from:

- **Plants only.** Crops and fruit trees. Never animals, people, monsters, or anything that acts.
- **No free text in.** The inputs are two existing plant kinds chosen by the act itself (a seed used on a growing
  crop, a scion on a tree): no prompt the player writes, so nothing to inject.
- **A closed output.** A name in both languages, growth hours and yield stats clamped to ranges, a 16×16 picture.
  No new rules, effects or primitives; it writes only its host, as the engine's validator already enforces
  (`packages/engine/src/mod.ts`).
- **Per save only,** as NPC recipe research's kinds are (`packages/engine/src/research.ts`): never in the shared library.
- **Checked before it is kept:** the economy check and the review step. With the AI setting off, nothing happens
  (the leaf's default).
- **Tested at the trust boundary** by the paper's runs (`games/openworld/tools/src/eval/attack.ts`) before any release.

Questions for the team: whether H is wanted at all; if so, whether the boundary above is enough; what the paper
would measure.
