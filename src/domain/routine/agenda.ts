import { Day } from '../transit/day.ts'
import type { Schedule } from '../transit/schedule.ts'
import type { Routine } from './routine.ts'

const ZONE = 3 * 3600 * 1000
const DAY = 86400 * 1000
const SPAN = 2 * 3600 * 1000

export type Occurrence = {
    routine: Routine
    key: string
    start: number
    bus: number | null
    arrive: number | null
}

const midnight = (t: number) => {
    const l = new Date(t - ZONE)

    return Date.UTC(l.getUTCFullYear(), l.getUTCMonth(), l.getUTCDate()) + ZONE
}

const stamp = (t: number) => new Date(t - ZONE).toISOString().slice(0, 10)

export class Agenda {
    private readonly schedule: Schedule

    constructor(schedule: Schedule) {
        this.schedule = schedule
    }

    on(r: Routine, base: number): Occurrence | null {
        const start = base + r.time * 60000
        const weekday = new Date(start - ZONE).getUTCDay()

        if (!r.on || !r.days.includes(weekday)) {
            return null
        }

        const after = r.time * 60
        const bus = this.schedule.at(r.line, r.dir, r.stop, Day.of(new Date(start)), r.end).find((b) => b.at >= after) ?? null

        return {
            routine: r,
            key: `${r.id}|${stamp(start)}`,
            start,
            bus: bus ? base + bus.at * 1000 : null,
            arrive: bus?.end != null ? base + bus.end * 1000 : null,
        }
    }

    ahead(all: Routine[], now: number, days = 7): Occurrence[] {
        const out: Occurrence[] = []
        const today = midnight(now)

        for (let d = 0; d <= days; d++) {
            for (const r of all) {
                const o = this.on(r, today + d * DAY)

                if (o && o.start > now) {
                    out.push(o)
                }
            }
        }

        return out.sort((a, b) => a.start - b.start)
    }

    live(all: Routine[], now: number, done: Set<string>): Occurrence | null {
        const today = midnight(now)
        const found = [today - DAY, today]
            .flatMap((base) => all.map((r) => this.on(r, base)))
            .filter((o): o is Occurrence => o !== null && o.start <= now && now < o.start + SPAN && !done.has(o.key))

        return found.sort((a, b) => b.start - a.start)[0] ?? null
    }

    next(o: Occurrence, now: number): { bus: number; arrive: number | null } | null {
        const r = o.routine
        const base = midnight(now)
        const secs = (now - base) / 1000
        const bus = this.schedule.at(r.line, r.dir, r.stop, Day.of(new Date(now)), r.end).find((b) => b.at >= secs)

        return bus ? { bus: base + bus.at * 1000, arrive: bus.end != null ? base + bus.end * 1000 : null } : null
    }
}
