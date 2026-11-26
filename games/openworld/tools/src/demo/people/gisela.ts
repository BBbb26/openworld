// Gisela, a pedlar of the pilgrim roads (docs/logs/0009). She walks the roads between the regions with a pack on her
// back and has done since she was a girl, behind her father. Alberic, once he held the ground, showed her the way in
// through the thorn; she does not ask how a road can be kept in a thorn. She comes to the Held Ground every third day
// (the story's `haven.market`, content market.ts) from seven in the morning to seven at night, sells what the roads
// carry, and buys what the ground grows. She carries news the way she carries salt: because people need it. She gives
// credit to those who cannot pay, and remembers who did. Not a fence; she is not asked to stay (storybound): the roads
// are hers.

import { line, type PersonDef } from '../person.ts'

export const gisela: PersonDef = {
  id: 'npc.gisela',
  role: 'peddler',
  essential: true,
  // she walks the roads: never asked to move to a home ground (content social.ts residence)
  tags: ['storybound'],
  name: { en: 'Gisela', zh: '吉瑟拉' },
  gender: 'female',
  look: { parts: { hair: 'hair.tied', face: 'face.bright', outfit: 'outfit.travel', hat: null, beard: null }, colors: { hair: 'chestnut', eyes: 'leaf', skin: 'warm', 'outfit.1': 'russet' } },
  age: 46,
  temperament: { personality: 'warm', manner: 'plain', social: 'outgoing', outlook: 'hopeful' },
  ties: { 'npc.alberic': 'the old knight who showed her the way in' },
  // what the roads carry: the north's salt, honey and fleece, the Holy City's spiced wine and candied apples, and
  // seedlings for an orchard; prices are the world's standard (content prices.ts)
  trade: {
    stock: [
      ['item/seed/apple', 2],
      ['item/seed/acorn', 2],
      ['item/material/salt/frostfang_sea_salt', 2],
      ['item/food/honey/frostfang_heather_honey', 1],
      ['item/material/wool/frostfang_island_fleece', 2],
      ['item/food/wine/holy_spiced_wine', 1],
      ['item/food/apple/holy_candied_apple', 2],
    ],
  },
  purse: 120,
  honesty: 1,
  schedules: {
    // on the roads between visits (out of the world, as the courier is)
    default: [[0, 24, 'offstage:gisela.road', 'walk the pilgrim roads']],
    // a market day on the Held Ground: by the stall from seven to seven, then back to the road
    'fact:haven.market': [
      [19, 7, 'offstage:gisela.road', 'walk the pilgrim roads'],
      [7, 19, 'haven:market', 'keep her pack open'],
    ],
  },
  lines: [
    line('greeting:first', "You must be the one the old knight holds this ground for. I am Gisela. I walk the pilgrim roads, all of them, and I have since I was a girl behind my father. He showed me the way in. I come every third day. Salt, honey, seedlings, news. Whatever you grow here, I will buy, if the road can use it.", '你就是那位老骑士替他守着这片地的人吧。我叫吉瑟拉，走朝圣路的，哪条路都走，从小跟在我父亲后头走到现在。是他给我指了进来的路。我每三天来一趟。盐、蜂蜜、树苗、消息都有。你这里种出来的东西，路上用得着的，我都收。', { once: true, mood: 'happy' }),
    line('chat', 'On the north road there is a widow who leaves a lamp in her window for whoever is still walking after dark. I have never once needed it. I am glad of it every time.', '北边那条路上有个寡妇，天黑以后总在窗口留一盏灯，给还在赶路的人。我一次也没用上过，可每回看见都觉得心里暖。'),
    line('chat', 'I carry more letters than goods some months. Nobody pays for a letter. I carry them anyway. Somebody is waiting at the other end.', '有几个月，我背的信比货还多。送信是没人给钱的，我照样背着。另一头总有人在等。'),
    line('chat', 'When someone cannot pay, I write their name in this book and tell them to pay me next time. Most of them do. The ones who do not, I stop writing down.', '有人付不起钱，我就把名字记在这本子上，跟他说下回再给。大多数人都会给。那些没给的，我后来也就不记了。'),
    line('default', 'Plant the seedlings where the ground is open and nobody walks. In two days you will have a tree, and it will not ask much of you after that.', '树苗种在空着、没人踩的地方。两天就成了树，以后也用不着你多费心。'),
    line('default', 'The nights are longer on every road now. People buy more candles and fewer ribbons. I sell what they need.', '如今每条路上的夜都更长了。人们多买蜡烛，少买缎带。人家需要什么，我就卖什么。'),
    line('default', 'Firstlight asks after you, you know. They say someone sends bread and wool from a place nobody can find on a map. I do not tell them where it is. It is not mine to tell.', '初原村的人还打听你呢。他们说有人从一个地图上找不到的地方送面包和羊毛过来。我没告诉他们在哪儿。那不是我该说的。'),
    line('topic:dragon_slain', 'The road to Emberfall is open again. They say it was you. I will be on it before the month is out, and I will tell them who opened it.', '去余烬镇的路又通了。听说是你。不出这个月我就上路，到了那边，我会告诉他们是谁把路打通的。', { mood: 'happy' }),
    line('hour:evening', 'I should be on the road before dark. The old knight always walks me to the edge of the mist. He never says why.', '天黑前我得上路了。那位老骑士每回都送我到迷雾边上，从来不说为什么。'),
    line('weather:rain', 'Rain on the pack. The salt does not mind. The letters do.', '雨落在包上了。盐不怕，信可怕。'),
    line('given:item/food', 'For the road? Thank you. I will eat it at the first milestone and think of this place.', '路上吃的？谢谢你。到了第一块里程碑，我就吃了它，顺便想想这里。', { mood: 'happy' }),
    line('given', 'For me? I will find someone on the road who needs it more, and tell them where it came from.', '给我的？我会在路上找个更需要它的人送出去，再告诉他是从哪儿来的。'),
  ],
}
