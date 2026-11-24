import { describe, expect, it } from 'vitest'
import { Bus } from '../src/domain/transit/bus.ts'
import { Agenda } from '../src/domain/routine/agenda.ts'
import { type Routine, WEEK } from '../src/domain/routine/routine.ts'
import { at } from './clock.ts'
import { FakeSchedule } from './fakes.ts'

const h = (hh: number, mm = 0) => hh * 3600 + mm * 60

const work: Routine = {
    id: 'r1',
    line: '100',
    code: '100',
    name: 'Centro',
    dir: 0,
    stop: 'S1',
    end: 'S3',
    from: 'Casa',
    to: 'Trabalho',
    time: 7 * 60,
    days: WEEK.work,
    on: true,
}

const schedule = () =>
    new FakeSchedule({
        weekday: [new Bus(h(6, 50), h(7, 20)), new Bus(h(7, 12), h(7, 40)), new Bus(h(7, 30), h(8, 0))],
        saturday: [new Bus(h(9), h(9, 30))],
    })

const t = (iso: string) => at(iso).getTime()

describe('agenda', () => {
    it('lists the next occurrences on the chosen days with the first bus after the time', () => {
        const all = new Agenda(schedule()).ahead([work], t('2026-11-27T08:00'), 4)

        expect(all.map((o) => [new Date(o.start - 3 * 3600000).toISOString().slice(0, 16), o.bus && new Date(o.bus - 3 * 3600000).toISOString().slice(11, 16)])).toEqual([
            ['2026-11-30T07:00', '07:12'],
            ['2026-12-01T07:00', '07:12'],
        ])
    })

    it('skips routines that are off', () => {
        expect(new Agenda(schedule()).ahead([{ ...work, on: false }], t('2026-11-27T06:00'))).toEqual([])
    })

    it('is live from the time until two hours later, unless done', () => {
        const agenda = new Agenda(schedule())

        expect(agenda.live([work], t('2026-11-27T06:59'), new Set())).toBeNull()
        expect(agenda.live([work], t('2026-11-27T07:05'), new Set())?.key).toBe('r1|2026-11-27')
        expect(agenda.live([work], t('2026-11-27T07:05'), new Set(['r1|2026-11-27']))).toBeNull()
        expect(agenda.live([work], t('2026-11-27T09:01'), new Set())).toBeNull()
        expect(agenda.live([work], t('2026-11-28T07:05'), new Set())).toBeNull()
    })

    it('follows the next bus while live', () => {
        const agenda = new Agenda(schedule())
        const o = agenda.live([work], t('2026-11-27T07:15'), new Set())
        const n = o && agenda.next(o, t('2026-11-27T07:15'))

        expect(n && new Date(n.bus - 3 * 3600000).toISOString().slice(11, 16)).toBe('07:30')
        expect(n && new Date((n.arrive ?? 0) - 3 * 3600000).toISOString().slice(11, 16)).toBe('08:00')
    })

    it('asks the schedule for the right service day', () => {
        const s = schedule()
        new Agenda(s).ahead([{ ...work, days: WEEK.all }], t('2026-11-27T08:00'), 1)

        expect(s.asked.map((a) => a[1])).toEqual(['weekday', 'saturday'])
    })
})
