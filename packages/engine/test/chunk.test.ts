import { describe, expect, it } from 'vitest'
import { decodeRawMap, type RawMap } from '../src/chunk.ts'

describe('a map file read', () => {
  const raw: RawMap = { id: 'room', name: { en: 'Room', zh: '房间' }, kind: 'interior', width: 2, height: 1, rows: ['.#'], portals: [] } as unknown as RawMap

  it('keeps the render hints it carries: its own look over its region\'s, its environment', () => {
    const look = { tint: '#f2e2c4', tintAmount: 0.08, desat: -0.1 }
    const m = decodeRawMap({ ...raw, look, environment: { palette: 'verdant' } } as RawMap, { '.': 'floor_wood', '#': 'wall' })
    expect(m.look).toEqual(look)
    expect(m.environment).toEqual({ palette: 'verdant' })
    expect(m.terrain).toEqual(['floor_wood', 'wall'])
  })

  it('adds none where it carries none', () => {
    const m = decodeRawMap(raw, { '.': 'floor_wood', '#': 'wall' })
    expect('look' in m).toBe(false)
    expect('environment' in m).toBe(false)
  })
})
