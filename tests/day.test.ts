import { describe, expect, it } from 'vitest'
import { Day } from '../src/domain/transit/day.ts'
import { Moment } from '../src/domain/transit/moment.ts'
import { at } from './clock.ts'

describe('day', () => {
    it.each([
        ['2026-11-23T10:00', 'weekday'],
        ['2026-11-27T10:00', 'weekday'],
        ['2026-11-28T10:00', 'saturday'],
        ['2026-11-29T10:00', 'sunday'],
        ['2026-11-29T23:30', 'sunday'],
    ])('maps %s in Recife to %s', (t, d) => {
        expect(Day.of(at(t))).toBe(d)
    })

    it('reads the clock as a service day', () => {
        const m = Moment.of(at('2026-11-28T00:30'))

        expect(m.day).toBe('saturday')
        expect(m.eve).toBe('weekday')
        expect(m.secs).toBe(1800)
    })
})
