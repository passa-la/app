import { beforeAll, describe, expect, it } from 'vitest'
import { Find } from '../src/cases/find.ts'
import { Search } from '../src/cases/search.ts'
import { Show } from '../src/cases/show.ts'
import { Trip } from '../src/cases/trip.ts'
import { Point } from '../src/domain/geo/point.ts'
import { Direct } from '../src/domain/transit/direct.ts'
import { Moment } from '../src/domain/transit/moment.ts'
import { Nearby } from '../src/domain/transit/nearby.ts'
import { Timetable } from '../src/domain/transit/timetable.ts'
import type { Net } from '../src/data/net.ts'
import { at } from './clock.ts'
import { net } from './helpers.ts'

let n: Net
let search: Search
let show: Show
let trip: Trip

const monday = Moment.of(at('2026-11-23T05:30'))
const p = (lat: number, lon = -34.85) => new Point(lat, lon)

beforeAll(async () => {
    n = await net()
    search = new Search(new Nearby(n))
    show = new Show(n, new Timetable(n))
    trip = new Trip(new Direct(n))
})

describe('lines near a place', () => {
    it('lists lines within one kilometer, nearest first', () => {
        const f = search.run(p(-8.0), 'weekday')

        expect(f.passes.map((x) => [x.line.code, x.stop.id, x.stop.name, Math.round(x.meters)])).toEqual([
            ['100', 'S1', '', 11],
            ['200', 'S2', 'Ti Teste', 556],
        ])
    })

    it('lists only lines that run on the chosen day', () => {
        const f = search.run(p(-8.0), 'sunday')

        expect(f.passes.map((x) => x.line.code)).toEqual(['100'])
        expect(f.passes[0].line.days).toEqual(['weekday', 'sunday'])
    })

    it('shrinks the radius on request', () => {
        const f = search.run(p(-8.0), 'weekday', 300)

        expect(f.wide).toBe(false)
        expect(f.passes.map((x) => x.line.code)).toEqual(['100'])
    })

    it('shows the nearest lines when none passes within the radius', () => {
        const f = search.run(p(-8.04), 'weekday')

        expect(f.wide).toBe(true)
        expect(f.passes.map((x) => x.line.code)).toEqual(['100', '200'])
        expect(f.passes[0].stop.id).toBe('S3')
    })

    it('returns nothing far from every stop', () => {
        expect(search.run(p(-8.3, -35.0), 'weekday').passes).toEqual([])
    })
})

describe('a line', () => {
    it('shows both directions of the day with where to get off', () => {
        const d = show.run('100', 'weekday', monday, { to: p(-8.02) })

        expect(d?.line.name).toBe('Centro / Praia')
        expect(d?.plan.best).toBeNull()
        expect(d?.ways).toHaveLength(2)
        expect(d?.ways[0].points[0]).toMatchObject({ lat: -8.0001, lon: -34.85 })
        expect(d?.ways[0].stops.map((s) => s.id)).toEqual(['S1', 'S3'])
        expect(d?.plan.legs[0].drop?.stop.id).toBe('S3')
        expect(d?.plan.legs[0].board).toBeNull()
        expect(d?.ways[1].stops.map((s) => s.id)).toEqual(['S3', 'S1'])
    })

    it('follows the sunday trip on sundays', () => {
        const d = show.run('100', 'sunday', monday)

        expect(d?.ways[0].stops.map((s) => s.id)).toEqual(['S1', 'S2', 'S3'])
        expect(d?.ways[0].points).toHaveLength(3)
    })

    it('recommends the direction that goes from the rider to the destination', () => {
        const d = show.run('100', 'weekday', monday, { to: p(-8.02), from: p(-8.0) })

        expect(d?.plan.best).toBe(0)
        expect(d?.plan.legs[0].board?.stop.id).toBe('S1')
        expect(d?.plan.legs[0].fits()).toBe(true)
        expect(d?.plan.legs[1].fits()).toBe(false)
        expect(show.run('100', 'weekday', monday, { to: p(-8.0), from: p(-8.02) })?.plan.best).toBe(1)
    })

    it('boards at the stop the rider tapped', () => {
        const d = show.run('100', 'weekday', monday, { to: p(-8.0), from: p(-8.0), stop: 'S3' })

        expect(d?.plan.best).toBe(1)
        expect(d?.plan.legs[1].board?.stop.id).toBe('S3')
    })

    it('has no ways on a day the line does not run', () => {
        expect(show.run('200', 'sunday', monday)?.ways).toEqual([])
    })

    it('knows nothing of unknown lines', () => {
        expect(show.run('999', 'weekday', monday)).toBeNull()
    })
})

describe('times at a stop', () => {
    const secs = (h: number, m: number) => h * 3600 + m * 60

    it('shows the next buses at the stop the rider tapped', () => {
        const d = show.run('100', 'weekday', monday, { stop: 'S1' })
        const t = d?.tables.get(0)

        expect(d?.plan.best).toBe(0)
        expect(t?.stop).toBe('S1')
        expect(t?.end).toBeNull()
        expect(t?.ride()).toBeNull()
        expect(t?.next?.map((b) => [b.at, t.wait(b), b.end])).toEqual([
            [secs(6, 0), 30, null],
            [secs(7, 0), 90, null],
        ])
        expect(t?.all.map((b) => b.at)).toEqual([secs(5, 0), secs(6, 0), secs(7, 0)])
        expect(d?.tables.has(1)).toBe(false)
    })

    it('tells when the bus gets to the stop the rider gets off', () => {
        const d = show.run('100', 'weekday', monday, { stop: 'S1', end: 'S3' })
        const t = d?.tables.get(0)

        expect(d?.plan.legs[0].drop?.stop.id).toBe('S3')
        expect(d?.plan.legs[0].fits()).toBe(true)
        expect(t?.end).toBe('S3')
        expect(t?.ride()).toBe(10)
        expect(t?.next?.map((b) => [b.at, b.end])).toEqual([[secs(6, 0), secs(6, 10)]])
        expect(t?.all.map((b) => b.at)).toEqual([secs(5, 0), secs(6, 0)])
    })

    it('keeps the late night buses of the day before', () => {
        const d = show.run('100', 'weekday', Moment.of(at('2026-11-24T00:20')), { stop: 'S3' })
        const t = d?.tables.get(1)

        expect(d?.plan.best).toBe(1)
        expect(t?.next?.map((b) => b.at)).toEqual([secs(0, 30), secs(6, 0), secs(24, 30)])
        expect(t?.wait(t.next![0])).toBe(10)
        expect(t?.all.map((b) => b.at)).toEqual([secs(6, 0), secs(24, 30)])
    })

    it('shows only the table on another day', () => {
        const t = show.run('100', 'weekday', Moment.of(at('2026-11-29T10:00')), { stop: 'S1' })?.tables.get(0)

        expect(t?.next).toBeNull()
        expect(t?.all).toHaveLength(3)
    })

    it('has no times without a boarding stop', () => {
        expect(show.run('100', 'weekday', monday)?.tables.size).toBe(0)
    })
})

describe('direct lines', () => {
    it('finds direct lines between two places', () => {
        const r = trip.run(p(-8.0), p(-8.02), 'weekday')

        expect(r.map((x) => [x.line.code, x.dir, x.board.stop.id, x.drop.stop.id, x.hops(), Math.round(x.walk())])).toEqual([
            ['100', 0, 'S1', 'S3', 1, 11],
        ])
        expect(trip.run(p(-8.02), p(-8.0), 'weekday')[0].dir).toBe(1)
    })

    it('follows the day when looking for direct lines', () => {
        expect(trip.run(p(-8.0), p(-8.005), 'weekday')).toEqual([])
        expect(trip.run(p(-8.0), p(-8.005), 'sunday', 300).map((x) => x.drop.stop.id)).toEqual(['S2'])
    })
})

describe('finding lines by text', () => {
    const find = () => new Find(n)

    it.each([
        ['200', ['200']],
        ['1', ['100']],
        ['praia', ['100']],
        ['PRACA', ['200']],
        ['zzz', []],
    ])('finds %s', (q, codes) => {
        expect(find().run(q).map((l) => l.code)).toEqual(codes)
    })
})
