import { describe, expect, it } from 'vitest'
import { Search } from '../src/cases/search.ts'
import { Circle } from '../src/domain/geo/circle.ts'
import { Point } from '../src/domain/geo/point.ts'
import { Direct } from '../src/domain/transit/direct.ts'
import { Halt } from '../src/domain/transit/halt.ts'
import { Line } from '../src/domain/transit/line.ts'
import { Nearby } from '../src/domain/transit/nearby.ts'
import { Pass } from '../src/domain/transit/pass.ts'
import { Stop } from '../src/domain/transit/stop.ts'
import { FakeLines } from './fakes.ts'

const from = new Point(-8.0, -34.85)
const lines = [new Line('a', '100', 'Centro', 'X'), new Line('b', '200', 'Praia', 'X'), new Line('c', '050', 'Longe', 'X')]

describe('nearby', () => {
    const stops = [
        new Stop('s1', '', new Point(-8.0005, -34.85), ['a']),
        new Stop('s2', '', new Point(-8.002, -34.85), ['a', 'b']),
        new Stop('s3', '', new Point(-8.05, -34.85), ['c']),
    ]

    it('lists each line once at its closest stop, nearest first', () => {
        const all = new Nearby(new FakeLines(lines, stops)).of(new Circle(from), 'weekday')

        expect(all.map((p) => [p.line.code, p.stop.id])).toEqual([
            ['100', 's1'],
            ['200', 's2'],
        ])
        expect(Math.round(all[0].meters)).toBe(56)
    })

    it('breaks distance ties by line code', () => {
        const all = new Nearby(new FakeLines(lines, [new Stop('s1', '', new Point(-8.0005, -34.85), ['b', 'a'])])).of(new Circle(from), 'weekday')

        expect(all.map((p) => p.line.code)).toEqual(['100', '200'])
    })

    it('orders numeric codes by value', () => {
        const all = new Nearby(new FakeLines(lines, [new Stop('s1', '', new Point(-8.0005, -34.85), ['a', 'c'])])).of(new Circle(from), 'weekday')

        expect(all.map((p) => p.line.code)).toEqual(['050', '100'])
    })

    it('picks the best stop of a line for a point', () => {
        expect(Pass.best(lines[0], stops, new Point(-8.05, -34.85))?.stop.id).toBe('s3')
    })
})

describe('search', () => {
    const two = [new Line('a', '100', 'Centro', 'X'), new Line('b', '200', 'Praia', 'X')]
    const stops = [new Stop('s1', '', new Point(-8.003, -34.85), ['a']), new Stop('s2', '', new Point(-8.03, -34.85), ['b'])]
    const search = new Search(new Nearby(new FakeLines(two, stops)))
    const codes = (p: Pass[]) => p.map((x) => x.line.code)

    it('keeps to the chosen radius', () => {
        const found = search.run(from, 'weekday', 1000)

        expect(codes(found.passes)).toEqual(['100'])
        expect(found.wide).toBe(false)
    })

    it('widens when nothing passes within a small radius', () => {
        const found = search.run(from, 'weekday', 300)

        expect(found.wide).toBe(true)
        expect(codes(found.passes)).toEqual(['100', '200'])
    })

    it('falls back to the nearest lines up to five kilometers', () => {
        const found = search.run(new Point(-8.02, -34.85), 'weekday', 1000)

        expect(found.wide).toBe(true)
        expect(codes(found.passes)).toEqual(['200', '100'])
    })

    it('gives up beyond five kilometers', () => {
        const found = search.run(new Point(-8.2, -34.85), 'weekday', 1000)

        expect(found.passes).toEqual([])
        expect(found.wide).toBe(true)
    })
})

describe('direct', () => {
    const home = new Stop('h', '', new Point(-8.0005, -34.85))
    const near = new Stop('n', '', new Point(-8.002, -34.85))
    const work = new Stop('w', '', new Point(-8.03, -34.85))
    const three = [new Line('a', '100', 'Ida', 'X'), new Line('b', '200', 'Volta', 'X'), new Line('c', '300', 'Longa', 'X')]
    const halts = [
        new Halt(home, 'a', 0, 0),
        new Halt(work, 'a', 0, 9),
        new Halt(work, 'b', 0, 0),
        new Halt(home, 'b', 0, 5),
        new Halt(work, 'b', 1, 5),
        new Halt(near, 'b', 1, 0),
        new Halt(home, 'c', 0, 0),
        new Halt(work, 'c', 0, 30),
    ]
    const a = new Circle(from)
    const b = new Circle(new Point(-8.0298, -34.85))

    it('keeps lines that reach the destination after boarding, least walking first', () => {
        const rides = new Direct(new FakeLines(three, [], [], halts)).between(a, b, 'weekday')

        expect(rides.map((r) => [r.line.code, r.dir, r.board.stop.id, r.drop.stop.id, r.hops()])).toEqual([
            ['100', 0, 'h', 'w', 9],
            ['300', 0, 'h', 'w', 30],
            ['200', 1, 'n', 'w', 5],
        ])
    })

    it('finds nothing when no line serves both ends', () => {
        const rides = new Direct(new FakeLines(three, [], [], halts.filter((h) => h.stop.id !== 'w'))).between(a, b, 'weekday')

        expect(rides).toEqual([])
    })
})
