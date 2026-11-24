import { beforeEach, describe, expect, it } from 'vitest'
import { Point } from '../src/domain/geo/point.ts'
import { Plan } from '../src/domain/transit/plan.ts'
import { Stop } from '../src/domain/transit/stop.ts'
import { Way } from '../src/domain/transit/way.ts'

describe('plan', () => {
    let ways: Way[]
    const home = new Point(-8.0005, -34.85)
    const work = new Point(-8.0195, -34.85)

    beforeEach(() => {
        const a = new Stop('a', '', new Point(-8.0, -34.85))
        const b = new Stop('b', '', new Point(-8.01, -34.85))
        const c = new Stop('c', '', new Point(-8.02, -34.85))

        ways = [new Way(0, [], [a, b, c]), new Way(1, [], [c, b, a])]
    })

    it('picks the direction that reaches the destination after boarding', () => {
        expect(Plan.of(ways, work, home, null).best).toBe(0)
        expect(Plan.of(ways, home, work, null).best).toBe(1)
    })

    it('shows where to get off in each direction without a location', () => {
        const plan = Plan.of(ways, work, null, null)

        expect(plan.best).toBeNull()
        expect(plan.legs.map((l) => [l.dir, l.drop?.stop.id, l.drop?.seq, l.board])).toEqual([
            [0, 'c', 2, null],
            [1, 'c', 0, null],
        ])
    })

    it('boards at the stop the rider chose', () => {
        const plan = Plan.of(ways, home, work, 'b')

        expect(plan.best).toBe(1)
        expect(plan.legs[1].board?.stop.id).toBe('b')
        expect(plan.legs[1].fits()).toBe(true)
    })

    it('accepts any boarding on a single direction line', () => {
        expect(Plan.of([new Way(0, [], ways[0].stops)], home, work, null).best).toBe(0)
    })

    it('gets off at the stop the rider chose', () => {
        const plan = Plan.of(ways, null, null, 'a', 'c')

        expect(plan.best).toBe(0)
        expect(plan.legs[0].drop?.stop.id).toBe('c')
        expect(plan.legs[0].fits()).toBe(true)
        expect(plan.legs[1].drop?.stop.id).toBe('c')
        expect(plan.legs[1].fits()).toBe(false)
    })

    it('never boards at the last stop of a direction', () => {
        const plan = Plan.of(ways, null, null, 'c')

        expect(plan.best).toBe(1)
        expect(plan.legs[0].board).toBeNull()
        expect(plan.legs[1].board?.stop.id).toBe('c')
    })
})
