// The swordsman's things (2026-11-03): the katana (its blade up, as the sword's picture is, for the swing) and the
// scabbard worn in the off hand — 16×16, outlined as the pack's items are.
//
//   npx tsx games/openworld/tools/src/art/swordsman.ts

import { writeIcon } from './png.ts'

/** A dark outline on every clear pixel beside a drawn one. */
function outlined(grid: string[]): string[] {
  const at = (x: number, y: number) => grid[y]?.[x] ?? '.'
  return grid.map((row, y) => [...row].map((c, x) => (c === '.' && [at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x, y + 1)].some((n) => n !== '.' && n !== 'k') ? 'k' : c)).join(''))
}

const KATANA = [
  '................',
  '..........l.....',
  '.........ls.....',
  '.........ls.....',
  '........ls......',
  '........ls......',
  '.......ls.......',
  '.......ls.......',
  '......ls........',
  '......ls........',
  '....ggggg.......',
  '......rR........',
  '......Rr........',
  '......rR........',
  '......oo........',
  '................',
]
const SCABBARD = [
  '................',
  '............bb..',
  '...........bBb..',
  '..........bBb...',
  '.........bBb....',
  '........bBb.....',
  '.......gBb......',
  '......bgg.......',
  '.....bBb........',
  '....bBb..c......',
  '...bBb..c.......',
  '...gg..c........',
  '......c.........',
  '................',
  '................',
  '................',
]

writeIcon('Items/Katana.png', outlined(KATANA), { k: '#1c1622', l: '#f2f6fa', s: '#9aa6b4', g: '#c9a24a', r: '#3a2a5a', R: '#6a5a9a', o: '#c9a24a' })
writeIcon('Items/Scabbard.png', outlined(SCABBARD), { k: '#0e0c14', b: '#241e34', B: '#4a4266', g: '#c9a24a', c: '#b04040' })
console.log('swordsman: the katana and the scabbard → public/assets/lsw/Items/')
