import { describe, expect, it } from 'vitest'
import { Box } from '../src/domain/geo/box.ts'
import { Circle } from '../src/domain/geo/circle.ts'
import { Place } from '../src/domain/geo/place.ts'
import { Point } from '../src/domain/geo/point.ts'
import { Region } from '../src/domain/geo/region.ts'
import { Walk } from '../src/domain/geo/walk.ts'

describe('point', () => {
    it('measures distance in meters', () => {
        const a = new Point(-8.0, -34.85)

        expect(a.to(new Point(-8.0, -34.85))).toBe(0)
        expect(a.to(new Point(-8.009, -34.85))).toBeCloseTo(1000.8, 0)
    })

    it('rejects coordinates out of range', () => {
        expect(() => new Point(91, 0)).toThrow(RangeError)
    })

    it('walks one kilometer by default', () => {
        const c = new Circle(new Point(-8.0, -34.85))

        expect(c.meters).toBe(1000)
        expect(c.has(new Point(-8.008, -34.85))).toBe(true)
        expect(c.has(new Point(-8.01, -34.85))).toBe(false)
    })

    it('walks in a straight line at a steady pace', () => {
        const w = Walk.straight(new Point(-8.0, -34.85), new Point(-8.009, -34.85))

        expect(w.exact).toBe(false)
        expect(w.points).toHaveLength(2)
        expect(Math.round(w.seconds)).toBe(801)
    })
})

describe('region', () => {
    const region = new Region(Box.of([-9.6, -41.5, -7.1, -34.7]), new Point(-8.06, -34.87), 'Pernambuco')

    it('keeps places inside the state', () => {
        expect(region.has(new Place('Patteo', 'Olinda', new Point(-7.99, -34.84), 'Pernambuco'))).toBe(true)
        expect(region.has(new Place('Sem estado', '', new Point(-8.0, -34.9)))).toBe(true)
    })

    it('drops places from other states inside the box', () => {
        expect(region.has(new Place('Pantec', 'Juazeiro do Norte', new Point(-7.21, -39.31), 'Ceará'))).toBe(false)
    })

    it('drops places outside the box', () => {
        expect(region.has(new Place('Avenida Paulista', 'São Paulo', new Point(-23.56, -46.65), 'Pernambuco'))).toBe(false)
    })
})
