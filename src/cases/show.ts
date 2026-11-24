import type { Point } from '../domain/geo/point.ts'
import type { Day } from '../domain/transit/day.ts'
import { Detail } from '../domain/transit/detail.ts'
import type { Lines } from '../domain/transit/lines.ts'
import type { Moment } from '../domain/transit/moment.ts'
import { Plan } from '../domain/transit/plan.ts'
import type { Table } from '../domain/transit/table.ts'
import type { Timetable } from '../domain/transit/timetable.ts'

export type Ask = {
    to?: Point | null
    from?: Point | null
    stop?: string | null
    end?: string | null
}

export class Show {
    private readonly lines: Lines
    private readonly timetable: Timetable

    constructor(lines: Lines, timetable: Timetable) {
        this.lines = lines
        this.timetable = timetable
    }

    run(id: string, day: Day, now: Moment, ask: Ask = {}): Detail | null {
        const line = this.lines.find(id)

        if (!line) {
            return null
        }

        const ways = this.lines.ways(id, day)
        const plan = Plan.of(ways, ask.to ?? null, ask.from ?? null, ask.stop ?? null, ask.end ?? null)
        const tables = new Map<number, Table>()

        for (const l of plan.legs) {
            const t = this.timetable.of(id, l, day, now)

            if (t) {
                tables.set(l.dir, t)
            }
        }

        return new Detail(line, day, ways, plan, tables)
    }
}
