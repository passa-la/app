import { describe, expect, it } from 'vitest'
import { decode, encode } from '../src/data/codec.ts'
import { feed } from './helpers.ts'

describe('codec', () => {
    it('round trips the network', async () => {
        const f = await feed()
        const p = decode(encode(f, '2026-11-23T00:00:00Z'))

        expect(p.head.feed).toBe('v-test')
        expect(p.head.lines.map((l) => l[1])).toEqual(['100', '200'])
        expect(p.head.stops.map((s) => s[0])).toEqual(['S1', 'S2', 'S3'])
        expect(p.linkLine).toHaveLength(f.net.links.length)
        expect(p.runPat).toHaveLength(8)
        expect(p.runTimes).toHaveLength(16)
        expect([...p.stopLat]).toEqual([-8000100, -8005000, -8020000])
    })

    it('marks stops served only by detours', async () => {
        const p = decode(encode(await feed(), 'x'))

        expect([...p.patStops]).toContain(0xffff)
    })

    it('decodes from an unaligned buffer', async () => {
        const raw = encode(await feed(), 'x')
        const shifted = new Uint8Array(raw.length + 1)
        shifted.set(raw, 1)

        expect(decode(shifted.subarray(1)).head.feed).toBe('v-test')
    })

    it('rejects other files', () => {
        expect(() => decode(new Uint8Array(16))).toThrow('Not a passa-la network file')
    })
})
