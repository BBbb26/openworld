# 0014 — F: the Hall of the Bearers (design, not built)

- **Date:** 2026-11-24
- **Status:** **design for the team — nothing built.** Building waits for the team's word.
- **Related:** [0002](0002-held-ground-expansion-plan.md) E4, [0003](0003-expansion-decisions-round-2.md) §4 (first sketch, "the Hall of the Fallen"), [0004](0004-principle-no-moral-dilemmas-and-crossbreeding-hold.md) (P1), [0013](0013-design-a-ground-for-each-seal.md) (E)

> **⚠ Placeholders:** none built. The art this would need is in §6. If it is built, temporary art goes into the
> register, [0007](0007-placeholders-register.md).

## 1. The idea

The five Seal-bearers were not villains. Each carried a share of Astra's burden for three hundred years, so that others
need not, and was twisted by it (lore.md §6, §12):
- Matthias took his men's pain out of kindness.
- Ele took the Lightened's hunger.
- Nacht held the dead.
- The Witnesses bore the wound of the lance.
- Alberic held until someone relieved him.

The pilgrim's road ends their suffering, and lengthens the night.

The **Hall of the Bearers** (承印者之厅) is where the Held Ground remembers them, as someone should have remembered Alberic.
It is a small open hall at the heart, raised by Alberic. The first title, "the Hall of the Fallen", is changed: it
honours what they carried, not that they fell. When the hall stands, Alberic asks for it:

> "Lay mine there too. I am not the man who wore it. Someone should keep them as they were before it bent them — I
> could not keep myself."

## 2. How it works

1. **The building.** A new `building` upgrade in `content/haven.ts` `HAVEN_UPGRADES`: a plot at the heart that becomes
   the hall. It needs stone, planks and cloth, and land 1. The hall is one fixture with five places drawn on it. Mementos
   are laid on the hall itself.
2. **Mementos.** One keepsake per bearer: a small thing of the person, not of the relic. The five instruments belong
   to the main story's rite and stay there.

   | Bearer | Memento (proposal) | Where it comes from | Its words (hearsay; the bearer's last words where the chapters give them) |
   |---|---|---|---|
   | Alberic (1st) | **A dented gauntlet** (凹痕护手) | Alberic gives it when the hall stands | "He wore it the morning he asked his squire's name. He has forgotten the name. He has not forgotten asking." |
   | Matthias (2nd) | **A knotted cord** (打结的绳) | left where he falls (ch2) | "Each knot a lash he took for someone. There are more knots than a cord should hold." |
   | Ele (3rd) | **An empty pan** (空秤盘) | left where Ele falls (ch3) | "Hunger is not made less. It is only weighed out. Remember that, pilgrim, when it is weighed out to you." (Ele's last words, chapter-3.md) |
   | Nacht (4th) | **A ferry token** (渡筹) | left where Nacht falls (ch4) | "Every one who crossed, he counted. He never once counted himself." |
   | The Witnesses (5th) | **A white thread** (白线) | left where they fall (ch5) | "Many hands sewed the white robes. Nobody knows whose thread this was. That was the point." |

   **How a memento is laid down.** Hand it to the hall (G, or use) and it is laid down: the memento's rule tells the
   hall and is gone, and the hall keeps it and tells the story (`hall.<bearer>`). A memento laid down shows on the hall's
   picture. A hand on the hall reads what each one says.
3. **What each gives the Held Ground.** Each bearer's burden is turned round, as Alberic's vow was. The gifts are small,
   lasting and kind, and **none of them touches prices** (the economy check):

   | Laid down | The Held Ground's gift | How (proposal) |
   |---|---|---|
   | Alberic's gauntlet | **The ground keeps names**: residents' regard toward the player does not fade while they live there | a residence condition in the regard fade (society module) or a status kept on residents |
   | Matthias's cord | **No one bears it alone**: on the Held Ground, rest mends more (the player and residents heal faster at the hearth) | a status from the kitchen hearth while the cord is laid down |
   | Ele's pan | **Weighed out fairly**: a meal at the table (0011) feeds twice what it would | the `table` branch reads the fact |
   | Nacht's token | **The dead lie down**: no night-born rise on the Held Ground's grounds (0013) | the grounds' night appearance needs `not hall.nacht` |
   | The Witnesses' thread | **Witnessed**: the planted sword gives light at night; the heart is never dark | the sword fixture's lit state on the fact |

4. **Lumi** catches part of each fallen bearer's power (lore, agreed additions). At the hall she may say one line per
   memento: what she felt when that bearer fell.

## 3. P1, safety and tone

- **No dilemma, no choice.** Every memento can be laid down. None excludes another, and nothing is lost by laying one
  down.
- **Honour, not trophies.** No body parts, no relic of their torment. Each memento is a small thing of the person. The
  words say what they carried and for whom, plainly, without a moral (docs/writing.md).
- **Kindness:**
  - the gifts are care for the living: rest, meals, light, a remembered name;
  - Alberic, himself a bearer, is the one who keeps them;
  - a player who goes through the whole main line ends with a hall that says these people were more than their fall.
- **Safety:** all text authored; nothing for the modder; nothing about real people or religions beyond the game's own
  invented faith.

## 4. What it does not do

- It does not bring anyone back.
- It changes no outcome of the main line.
- It is not a trophy room. The kill count is not shown.
- Astra (the finale) has no memento: the preview ending leaves the pilgrim in the Holiest, and the true ending is not
  written. A sixth place can wait for it.

## 5. Difficulty and order

| Part | Size | Notes |
|---|---|---|
| The hall | **M** | a plot, an upgrade, a fixture with its "laid" states, a `haven` panel card, a demo requirement, wiki page |
| Five mementos | **S each** | an item, its words, its rule (tell the hall, be gone), and a spawn added to each bearer's fall (content `bosses.ts`, the bearer's story step) |
| Five gifts | **S–M each** | each a small rule or a condition on an existing one (table, regard, rest, night table, light) |
| In all | **M** | lower risk than E; can land before E, Alberic's gauntlet first |

## 6. Art it would need

- **The hall:** one building sprite with five places, and states for each memento laid (or five small overlays).
- **Five memento icons.**
- **The sword at night:** a light, using the lit-state machinery fixtures already have.

## 7. Questions for the team

1. **The name.** "Hall of the Bearers" (承印者之厅) instead of "Hall of the Fallen" — agreed?
2. **The gifts.** Gameplay as above, or words only (a remembrance with no mechanics)?
3. **Ele's gift and the table.** It makes meals go further, which is close to 0012 §2 (the free table). Acceptable?
4. **Order.** F before E? It is smaller, and Alberic's gauntlet could come first, since the hall needs no chapter beyond
   the first.
