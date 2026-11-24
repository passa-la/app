import { beforeEach, describe, expect, it } from 'vitest'
import { Point } from '../src/domain/geo/point.ts'
import { Bus } from '../src/domain/transit/bus.ts'
import { Leg } from '../src/domain/transit/leg.ts'
import { Moment } from '../src/domain/transit/moment.ts'
import { Spot } from '../src/domain/transit/spot.ts'
import { Stop } from '../src/domain/transit/stop.ts'
import { Timetable } from '../src/domain/transit/timetable.ts'
import { FakeSchedule } from './fakes.ts'

describe('timetable', () => {
    const a = new Spot(new Stop('a', '', new Point(-8.0, -34.85)), 0, 0)
    const b = new Spot(new Stop('b', '', new Point(-8.01, -34.85)), 3, 0)
    let late: FakeSchedule

    beforeEach(() => {
        late = new FakeSchedule({
            weekday: [new Bus(18000, 18600), new Bus(21600, 22500), new Bus(88200, 88800)],
            saturday: [new Bus(20000)],
        })
    })

    const ats = (bs: Bus[] | null) => (bs ?? []).map((x) => x.at)

    it('lists the next buses at the boarding stop', () => {
        const t = new Timetable(late).of('100', new Leg(0, a, null), 'weekday', new Moment('weekday', 'weekday', 19000))

        expect(t?.stop).toBe('a')
        expect(t?.end).toBeNull()
        expect(ats(t?.next ?? null)).toEqual([21600, 88200])
        expect(t?.wait(t.next![0])).toBe(43)
        expect(t?.all).toHaveLength(3)
    })

    it('counts last night buses that run after midnight', () => {
        const t = new Timetable(late).of('100', new Leg(0, a, null), 'saturday', new Moment('saturday', 'weekday', 1000))

        expect(ats(t?.next ?? null)).toEqual([1800, 20000])
        expect(ats(t?.all ?? null)).toEqual([20000])
    })

    it('shows only the table on other days', () => {
        const t = new Timetable(late).of('100', new Leg(0, a, null), 'weekday', new Moment('sunday', 'saturday', 0))

        expect(t?.next).toBeNull()
        expect(t?.all).toHaveLength(3)
    })

    it('asks when the bus gets to the drop stop only after boarding', () => {
        const tt = new Timetable(late)
        const now = new Moment('sunday', 'saturday', 0)
        const t = tt.of('100', new Leg(0, a, b), 'weekday', now)
        tt.of('100', new Leg(0, b, a), 'weekday', now)

        expect(late.asked).toEqual([
            ['a', 'weekday', 'b'],
            ['b', 'weekday', null],
        ])
        expect(t?.end).toBe('b')
        expect(t?.ride()).toBe(10)
    })

    it('needs a boarding stop', () => {
        expect(new Timetable(late).of('100', new Leg(0, null, b), 'weekday', new Moment('weekday', 'weekday', 0))).toBeNull()
    })
})
