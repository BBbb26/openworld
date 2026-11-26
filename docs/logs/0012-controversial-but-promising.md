# 0012 — Controversial but promising: ideas for the team to weigh (not built)

- **Date:** 2026-11-24
- **Status:** **for discussion — nothing here is built.** The user asked that ideas which are controversial but have
  potential be written down for them and their partners to weigh.
- **Related:** [0003](0003-expansion-decisions-round-2.md) §3 (refugees), [0004](0004-principle-no-moral-dilemmas-and-crossbreeding-hold.md) (P1, crossbreeding on hold), 0008–0011 (what was built instead)

> **⚠ Placeholders:** none (no code).

Each idea gives:
- its **promise**: what it would add;
- its **risk**;
- where it touches **P1** (no moral dilemmas, for a human or an LLM player) and **safety** (the NPC–player boundary,
  the trust boundary, the paper's experiments);
- a **safer shape** if it is wanted;
- **questions** for the team.

## 1. Residents whose needs can go unmet

- **Promise.** Depth. Care that matters because it could be missing. The table (0011) would mean more.
- **Risk.** Neglect becomes a punishment. "They left because you did not feed them" is guilt as a mechanic.
- **P1.** Close to the line. Who gets fed first, when food is short, is a choice of who suffers.
- **Safer shape.** Only good things grow from care (gladness, help with chores, their stories told). Nothing is ever
  taken away. That is what 0011 did.
- **Questions.** Is any pressure acceptable? Must an LLM player's runs be free of it?

## 2. "Nobody goes hungry on the Held Ground": a free table

- **Promise.** It is Alberic's own word. Residents never fall back on buying or taking. Kind, simple.
- **Risk.** Free food in the player's storehouse every morning (a larder's restock) is an economy leak. And it takes the
  player's own part out of the table.
- **P1.** Safe. It removes need.
- **Safer shape.** A plain pottage pot at the hearth that residents alone may eat from (owned by the household of
  residents), one bowl per resident a day.
- **Questions.** Is it worth a small household mechanism? Should it exist only once the kitchen hearth stands?

## 3. Rent or tithes from residents

- **Promise.** An income from the Held Ground; residents as part of its economy.
- **Risk.** It turns hospitality into landlordship. It clashes with the vow ("No one need kneel here").
- **P1.** A choice to tax, or to evict a resident who cannot pay, is a dilemma. Not compatible as such.
- **Safer shape.** Gifts freely given: a resident sometimes brings something of their trade to the storehouse,
  unasked.
- **Questions.** Do we want any money flowing from residents at all?

## 4. Kindness rewarded with faith or karma

- **Promise.** It ties the commissions (0008) to the faith system and the story's themes.
- **Risk.** Kindness becomes a transaction to grind. An LLM agent might learn "help in order to gain".
- **P1.** Not a dilemma, but it may hollow out the kindness the user asked for.
- **Safer shape.** Rewards that are gratitude, not currency: words, regard, a line from Gisela, a small keepsake.
  Commissions already give regard and a little coin. Keep faith out of it.
- **Questions.** Should kindness ever be measurable in the paper's evaluations?

## 5. LLM free-text conversation with residents

- **Promise.** Residents who really talk: the strongest "living world" showcase.
- **Risk.** The trust boundary.
  - The model's text reaches the player unauthored.
  - Prompt injection through what the player says.
  - Harmful or off-tone content.
  - A save's residents drifting out of character.
- **P1 and safety.** The highest risk on this list. Everything built in 0008–0011 is authored text on purpose.
- **Safer shape.** The modder's existing gates.
  - The model proposes; the game validates and keeps only short, in-voice lines.
  - It is off by the AI setting.
  - It is reviewed, and runs through the paper's trust-boundary runs (`tools/src/eval/attack.ts`).
- **Questions.** Is this in scope for the game, or only for the paper? Who reviews tone?

## 6. Romance and families

- **Promise.** Deep attachment to residents; children on the Held Ground.
- **Risk.** Sensitive content. An age-boundary must be exact: resident work already refuses anyone under 18. Jealousy
  and favouritism mechanics.
- **P1.** Choosing one person over another can read as a dilemma.
- **Safer shape.** Friendships and households among residents themselves, the player a friend to all, no exclusivity.
- **Questions.** Is it wanted at all?

## 7. Caravans that can be robbed (G3)

- **Promise.** Trade with risk; a reason to escort and to fight for others.
- **Risk.** Sending a resident on a road where they may be hurt is putting someone in harm's way for coin.
- **P1.** A dilemma (profit against a person's safety).
- **Safer shape.** Caravans carried by Gisela or hired carriers, not residents. Goods can be delayed, never people
  hurt. Or no risk at all: a slow, safe trade route.
- **Status.** G3 caravans are **deferred** for this reason. They also need people to travel across maps by address.

## 8. Orphans of the long night

- **Promise.** The strongest kindness theme the setting offers: the night lengthens, children are left alone, and the
  Held Ground takes them in.
- **Risk.** Children in distress as content; exploitation of emotion; "take this one or that one".
- **P1.** Must never be a selection.
- **Safer shape.** Every child who comes is taken in, always; the ground has room for children whatever the beds; they
  never work (the work orders already refuse minors).
- **Questions.** Tone and art direction. Whether children appear at all.

## 9. Prices that move with supply

- **Promise.** A living market: what the Held Ground sells a lot of fetches less.
- **Risk.** The economy LP (`economy.test.ts`) holds that nothing bought, made and sold again pays. Moving prices
  break that guarantee unless they are bounded.
- **P1.** Safe.
- **Safer shape.** Prices only ever fall within the existing spread, never above the standard price.
- **Questions.** Worth the economy work now?

## 10. Refugees of the long night (from 0003 §3)

The options there (arrivals rather than requests; letters as news; kin of residents) still stand, with P1's
constraint. The table (0011) and resident tending (0010) make the Held Ground ready to receive people. The open choice
is how they come.

## What the team is asked

For each item: drop, keep as written in its safer shape, or redesign. Items 5 and 6 also need a safety owner. Item 7
decides whether G3 caravans come back.
