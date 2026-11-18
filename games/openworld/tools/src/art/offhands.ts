// The professions' off-hand pieces (2026-11-05), each its own picture where it borrowed another's: the assassin's
// parrying dagger (a main-gauche, its guard swept back over the hand), the ranger's quiver (slanting, fletched arrows
// standing out of it, a strap), the mage's tome (bound in leather, its corners shod, a clasp, a sigil on the board) —
// 16×16, outlined as the pack's items are. (The swordsman's scabbard is swordsman.ts's.)
//
//   npx tsx games/openworld/tools/src/art/offhands.ts

import { writeIcon } from './png.ts'

/** A dark outline on every clear pixel beside a drawn one. */
function outlined(grid: string[]): string[] {
  const at = (x: number, y: number) => grid[y]?.[x] ?? '.'
  return grid.map((row, y) => [...row].map((c, x) => (c === '.' && [at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x, y + 1)].some((n) => n !== '.' && n !== 'k') ? 'k' : c)).join(''))
}

const PARRYING_DAGGER = [
  '................',
  '.............l..',
  '............ls..',
  '...........ls...',
  '..g.......lsS...',
  '...Gg....lsS....',
  '....Gg..lsS.....',
  '.....GgsSS......',
  '......GYg.......',
  '.....rRGg.......',
  '....rR..Gg......',
  '...rR....g......',
  '..oo.....g......',
  '...oggggg.......',
  '................',
  '................',
]
const QUIVER = [
  '..........f.....',
  '.......w.fFk.w..',
  '......wWktk.wW..',
  '.......tktk.t...',
  '........tttt....',
  '......cccccc....',
  '......BBlBBk....',
  '.....BBBlBk.t...',
  '.....BBBlBk..t..',
  '....BBBlBk....t.',
  '...cccccc.....t.',
  '...BBlBBk....t..',
  '..bBlBBk...tt...',
  '..bbBBk.........',
  '...bbk..........',
  '................',
]
const TOME = [
  '................',
  '................',
  '..mbbbbbbbbbm...',
  '..bBBBBBBBBBbp..',
  '..bBBBByyBBBbp..',
  '..bBBByBByBBbpg.',
  '..bBBByBByBBbpg.',
  '..bBBBByyBBBbpg.',
  '..bBBBBBBBBBbp..',
  '..bBBBBBBBBBbp..',
  '..mbbbbbbbbbmp..',
  '...ppppppppppp..',
  '................',
  '................',
  '................',
  '................',
]

writeIcon('Items/ParryingDagger.png', outlined(PARRYING_DAGGER), { k: '#1c1622', l: '#f2f6fa', s: '#b4bfcc', S: '#7c8796', g: '#868c9a', G: '#d4dae2', Y: '#c9a24a', r: '#5a3a24', R: '#8a5a34', o: '#c9a24a' })
writeIcon('Items/Quiver.png', outlined(QUIVER), { k: '#1c1622', w: '#f2efe6', W: '#b8b2a4', f: '#d0503c', F: '#f08a6e', c: '#c9a24a', b: '#5a3a24', B: '#8a5a34', l: '#b8844e', t: '#7a5a3a' })
writeIcon('Items/Tome.png', outlined(TOME), { k: '#1c1622', b: '#4a2430', B: '#7a3a44', m: '#c9a24a', y: '#e8c870', p: '#efe6cc', g: '#c9a24a' })
console.log('offhands: the parrying dagger, the quiver, the tome → public/assets/lsw/Items/')
