import type { Circle } from '../geo/circle.ts'
import type { Day } from './day.ts'
import type { Lines } from './lines.ts'
import { Pass } from './pass.ts'
import type { Stop } from './stop.ts'

export class Nearby {
    private readonly lines: Lines

    constructor(lines: Lines) {
        this.lines = lines
    }

    of(c: Circle, d: Day): Pass[] {
        const stops = new Map<string, Stop[]>()

        for (const s of this.lines.around(c, d)) {
            if (!c.has(s.point)) {
                continue
            }

            for (const id of s.lines) {
                stops.set(id, [...(stops.get(id) ?? []), s])
            }
        }

        const all = this.lines.many([...stops.keys()]).map((l) => Pass.best(l, stops.get(l.id) ?? [], c.center))

        return Pass.sort(all.filter((p): p is Pass => p !== null))
    }
}
