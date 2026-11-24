import type { Bus } from './bus.ts'
import type { Day } from './day.ts'
import type { Leg } from './leg.ts'
import { Moment } from './moment.ts'
import type { Schedule } from './schedule.ts'
import { Table } from './table.ts'

const NEXT = 3

export class Timetable {
    private readonly schedule: Schedule

    constructor(schedule: Schedule) {
        this.schedule = schedule
    }

    of(line: string, leg: Leg, d: Day, now: Moment): Table | null {
        if (!leg.board) {
            return null
        }

        const stop = leg.board.stop.id
        const end = leg.fits() ? (leg.drop?.stop.id ?? null) : null
        const all = this.schedule.at(line, leg.dir, stop, d, end)

        if (d !== now.day) {
            return new Table(stop, end, all)
        }

        const late = this.schedule.at(line, leg.dir, stop, now.eve, end).map((b) => b.shift(-Moment.DAY))
        const next = [...late, ...all].filter((b: Bus) => b.at >= now.secs).sort((a, b) => a.at - b.at)

        return new Table(stop, end, all, next.slice(0, NEXT), now.secs)
    }
}
