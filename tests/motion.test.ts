import { describe, expect, it } from 'vitest'
import { Motion } from '../src/domain/geo/motion.ts'

const run = (speeds: number[], step = 3000) => {
    const m = new Motion()

    return speeds.map((speed, i) => m.push({ lat: -8.05, lon: -34.9, at: i * step, speed }))
}

describe('motion', () => {
    it('stays a walker at walking pace', () => {
        expect(run([1.2, 1.5, 1.4, 1.8, 1.3]).some(Boolean)).toBe(false)
    })

    it('boards after a few fast readings in a row', () => {
        expect(run([1.4, 8, 9, 10, 9])).toEqual([false, false, false, true, true])
    })

    it('ignores a single GPS spike', () => {
        expect(run([1, 12, 1, 1, 12, 1]).some(Boolean)).toBe(false)
    })

    it('keeps riding through a stop at a red light', () => {
        const r = run([9, 9, 9, ...Array(10).fill(0), 9])

        expect(r.every((x, i) => i < 2 || x)).toBe(true)
    })

    it('gets off after a minute at walking pace', () => {
        const r = run([9, 9, 9, ...Array(25).fill(1)])

        expect(r.at(-1)).toBe(false)
        expect(r[10]).toBe(true)
    })

    it('works out the speed when the GPS does not give it', () => {
        const m = new Motion()
        const step = 3000
        const out = [0, 1, 2, 3, 4].map((i) => m.push({ lat: -8.05 + i * 0.0002, lon: -34.9, at: i * step }))

        expect(out.at(-1)).toBe(true)
    })
})
