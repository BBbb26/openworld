// The cleric's things (2026-11-12): the cross (iron, a gold boss where its arms meet, a grip of wrapped leather, upright
// as the sword's picture is, for the swing) and the rosary worn in the off hand (a loop of wooden beads, a small gilt
// cross hanging from it) — 16×16, outlined as the pack's items are.
//
//   npx tsx games/openworld/tools/src/art/cleric.ts

import { writeIcon } from './png.ts'

/** A dark outline on every clear pixel beside a drawn one. */
function outlined(grid: string[]): string[] {
  const at = (x: number, y: number) => grid[y]?.[x] ?? '.'
  return grid.map((row, y) => [...row].map((c, x) => (c === '.' && [at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x, y + 1)].some((n) => n !== '.' && n !== 'k') ? 'k' : c)).join(''))
}

const CROSS = [
  '................',
  '.......ss.......',
  '......sSSs......',
  '......sSSs......',
  '..sssssSSsssss..',
  '..sSSSSyySSSSs..',
  '..sssssyysssss..',
  '......sSSs......',
  '.......Ss.......',
  '.......Ss.......',
  '.......Ss.......',
  '.......Ss.......',
  '.......wW.......',
  '.......Ww.......',
  '.......gg.......',
  '................',
]
const ROSARY = [
  '................',
  '.....bBbBb......',
  '....B.....B.....',
  '...b.......b....',
  '...B.......B....',
  '...b.......b....',
  '....B.....B.....',
  '.....bBbBb......',
  '.......B........',
  '.......b........',
  '.......G........',
  '......gGg.......',
  '.......g........',
  '.......g........',
  '................',
  '................',
]

writeIcon('Items/Cross.png', outlined(CROSS), { k: '#1c1622', s: '#7c8796', S: '#d4dae2', y: '#e8c870', w: '#5a3a24', W: '#8a5a34', g: '#c9a24a' })
writeIcon('Items/Rosary.png', outlined(ROSARY), { k: '#1c1622', b: '#6a4428', B: '#a8743e', g: '#c9a24a', G: '#f0d890' })
console.log('cleric: the cross and the rosary → public/assets/lsw/Items/')
