import type { Circle } from '../src/domain/geo/circle.ts'
import type { Bus } from '../src/domain/transit/bus.ts'
import type { Day } from '../src/domain/transit/day.ts'
import type { Halt } from '../src/domain/transit/halt.ts'
import type { Line } from '../src/domain/transit/line.ts'
import type { Lines } from '../src/domain/transit/lines.ts'
import type { Schedule } from '../src/domain/transit/schedule.ts'
import type { Stop } from '../src/domain/transit/stop.ts'
import type { Way } from '../src/domain/transit/way.ts'

export class FakeLines implements Lines {
    private readonly lines: Line[]
    private readonly stops: Stop[]
    private readonly list: Way[]
    private readonly stays: Halt[]

    constructor(lines: Line[], stops: Stop[], ways: Way[] = [], halts: Halt[] = []) {
        this.lines = lines
        this.stops = stops
        this.list = ways
        this.stays = halts
    }

    around(_c: Circle, _d: Day): Stop[] {
        return this.stops
    }

    halts(_c: Circle, _d: Day): Halt[] {
        return this.stays
    }

    many(ids: string[]): Line[] {
        return this.lines.filter((l) => ids.includes(l.id))
    }

    find(id: string): Line | null {
        return this.many([id])[0] ?? null
    }

    match(q: string): Line[] {
        return this.lines.filter((l) => `${l.code} ${l.name}`.includes(q))
    }

    ways(_id: string, _d: Day): Way[] {
        return this.list
    }
}

export class FakeSchedule implements Schedule {
    readonly asked: [string, Day, string | null][] = []
    private readonly buses: Partial<Record<Day, Bus[]>>

    constructor(buses: Partial<Record<Day, Bus[]>>) {
        this.buses = buses
    }

    at(_line: string, _dir: number, stop: string, d: Day, end: string | null = null): Bus[] {
        this.asked.push([stop, d, end])

        return this.buses[d] ?? []
    }
}
