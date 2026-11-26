// Commissions (docs/logs/0008): radiant favours that ask for what the Held Ground grows and makes, always for someone
// else's good, as the nights lengthen — bread for those who keep the vigil at the flame, wool for something warm,
// apples for someone sick. They are offered by Firstlight's people (and shown on any commission board, the Held
// Ground's among them) once the Held Ground is the player's.
//
// Principle P1 (docs/logs/0004): no moral dilemma. Turning one down costs nothing; one left past its time ends kindly
// (the neighbour managed, and is glad to have been thought of) — never with anyone harmed. Words follow docs/writing.md.

import type { QuestDef, Text } from '@openworld/engine'
import { L } from './kit.ts'
import { SOCIAL_COIN } from '../social.ts'

// (anyone in Firstlight but the watch: every person there trades something and so carries the `merchant` tag, which
// would leave no one to ask — docs/logs/0015)
const NEIGHBOUR = { find: { type: 'actor/person', map: 'meadow', person: true, pick: 'random' as const, notTags: ['watchman'] } }
/** The Held Ground is the player's (the White Knight felled: the Oath-Thorn's way open). */
const HELD = { fact: { 'sins.defeated.alberic': { gte: 1 } } }

interface Commission {
  id: string
  title: Text
  type: string
  count: number
  thing: Text
  summary: Text
  offer: Text
  accepted: Text
  waiting: Text
  thanks: Text
  done: Text
  coins: number
}

function commission(c: Commission): QuestDef {
  return {
    id: c.id,
    kind: 'favor',
    title: c.title,
    summary: c.summary,
    aliases: { neighbour: NEIGHBOUR },
    objectives: [
      { id: 'bring', text: c.thing, count: { carry: { type: c.type } }, need: c.count },
      { id: 'back', text: L('Back to {neighbour}', '回去找{neighbour}'), target: 'neighbour', talk: true },
    ],
    stages: [
      { n: 10, show: ['bring'], log: c.summary },
      { n: 20, on: { objectives: ['bring'] }, show: ['back'], log: L('I have it. Back to {neighbour}.', '东西齐了。回去找{neighbour}。') },
      {
        n: 100,
        on: { all: [{ talk: 'neighbour' }, { objectives: ['bring'] }] },
        done: ['back'],
        take: [{ match: { type: c.type }, count: c.count, to: 'neighbour' }],
        complete: true,
        by: 'neighbour',
        say: c.thanks,
        reward: { xp: 15, items: [{ type: SOCIAL_COIN, count: c.coins }], regard: { neighbour: 12 } },
        log: c.done,
      },
      // past its time: it ends kindly — they managed, and were glad to have been thought of (P1: no one is harmed)
      { n: 200, failed: true, log: L('{neighbour} managed in the end, and was glad someone had thought of them.', '{neighbour}最后自己想了办法，有人惦记着，{neighbour}心里也高兴。') },
    ],
    start: { news: 'morning', when: HELD, offer: 'neighbour', most: 1, chance: 0.35 },
    deadline: 48,
    offer: c.offer,
    accepted: c.accepted,
    declined: L('That is all right. Someone will have some.', '没关系，总会有人有的。'),
    waiting: c.waiting,
  }
}

export const COMMISSIONS: QuestDef[] = [
  commission({
    id: 'vigil-bread',
    title: L('Bread for the Vigil', '守夜人的面包'),
    type: 'item/food/bread',
    count: 3,
    thing: L('Three loaves for {neighbour}', '给{neighbour}的三块面包'),
    summary: L('Those who sit up at the flame through the night have little to eat. {neighbour} asks for three loaves for them.', '整夜守在火边的人没什么吃的。{neighbour}想给他们要三块面包。'),
    offer: L('The ones who keep the vigil sit up all night, and the nights are longer than they were. They do not ask for anything. I would like to bring them bread. Three loaves, if your ground can spare them.', '守夜的人整夜不睡，夜又比从前长了。他们什么也不要。我想给他们送些面包去。三块就好，如果你那片地匀得出来。'),
    accepted: L('Thank you. I will take it to them myself.', '谢谢你。我会亲手送过去。'),
    waiting: L('Three loaves, for the ones at the flame.', '三块面包，给火边的人。'),
    thanks: L('Still warm, almost. They will be glad of it at the third hour, when it is coldest. Here — for your trouble.', '还有点温热。到了三更天最冷的时候，他们会很感激的。给——辛苦你了。'),
    done: L('The bread went to those who keep the vigil.', '面包送到了守夜人手里。'),
    coins: 12,
  }),
  commission({
    id: 'warm-wool',
    title: L('Wool for the Long Nights', '长夜里的羊毛'),
    type: 'item/material/wool',
    count: 2,
    thing: L('Two wool for {neighbour}', '给{neighbour}的两份羊毛'),
    summary: L('{neighbour} wants to knit something warm for the children before the nights grow longer still. Two wool.', '{neighbour}想在夜变得更长之前，给孩子们织点暖和的东西。要两份羊毛。'),
    offer: L('The children feel the cold first. If I had wool, I could knit them something before the nights grow longer. Two would do it.', '孩子们最先觉得冷。要是有羊毛，我能赶在夜更长之前给他们织点东西。两份就够了。'),
    accepted: L('I will start the moment I have it.', '一拿到我就动手。'),
    waiting: L('Two wool, for the children.', '两份羊毛，给孩子们的。'),
    thanks: L('Soft. They will sleep warmer for it. Take this — it is not much.', '真软。有了它，孩子们夜里能睡得暖些。拿着——不多。'),
    done: L('The wool went to be knitted for the children.', '羊毛拿去给孩子们织东西了。'),
    coins: 6,
  }),
  commission({
    id: 'sick-apples',
    title: L('Apples for the Sick', '给病人的苹果'),
    type: 'item/food/apple',
    count: 3,
    thing: L('Three apples for {neighbour}', '给{neighbour}的三个苹果'),
    summary: L('Someone in {neighbour}\'s house is ill and will eat nothing but fruit. Three apples.', '{neighbour}家里有人病了，除了水果什么都吃不下。要三个苹果。'),
    offer: L('Someone in my house has been ill for days. Bread will not go down, but they asked for an apple. Three, if you have them.', '我家里有人病了好几天了。面包咽不下去，却说想吃苹果。如果你有，三个就好。'),
    accepted: L('Bless you. I will cut them small.', '愿你平安。我会切成小块给他吃。'),
    waiting: L('Three apples, for the sickbed.', '三个苹果，给病床上的人。'),
    thanks: L('They will eat these. I know they will. Thank you — take this.', '这个他肯吃的，我知道。谢谢你——这个你拿着。'),
    done: L('The apples went to the sickbed.', '苹果送到了病床边。'),
    coins: 6,
  }),
]
