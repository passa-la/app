import type { Circle } from '../geo/circle.ts'
import type { Day } from './day.ts'
import type { Lines } from './lines.ts'
import { by } from './order.ts'
import { Ride } from './ride.ts'
import { Spot } from './spot.ts'

type Pair = [Spot, Spot]

const cost = (p: Pair) => [p[0].meters + p[1].meters, p[1].seq - p[0].seq]

export class Direct {
    private readonly lines: Lines

    constructor(lines: Lines) {
        this.lines = lines
    }

    between(from: Circle, to: Circle, d: Day): Ride[] {
        const boards = this.group(from, d)
        const drops = this.group(to, d)
        const best = new Map<string, [Spot, Spot, number]>()

        for (const [key, starts] of boards) {
            const ends = drops.get(key)

            if (!ends) {
                continue
            }

            const [line, dir] = key.split('\0')
            const pair = this.pair(starts, ends)
            const old = best.get(line)

            if (pair && (!old || by(cost(pair), cost([old[0], old[1]])) < 0)) {
                best.set(line, [pair[0], pair[1], Number(dir)])
            }
        }

        const rides = this.lines.many([...best.keys()]).map((l) => {
            const [board, drop, dir] = best.get(l.id) as [Spot, Spot, number]

            return new Ride(l, dir, board, drop)
        })

        return rides.sort((a, b) => by([a.walk(), a.hops(), a.line.code], [b.walk(), b.hops(), b.line.code]))
    }

    private group(c: Circle, d: Day): Map<string, Spot[]> {
        const out = new Map<string, Spot[]>()

        for (const h of this.lines.halts(c, d)) {
            const m = c.center.to(h.stop.point)

            if (m <= c.meters) {
                const key = `${h.line}\0${h.dir}`
                out.set(key, [...(out.get(key) ?? []), new Spot(h.stop, h.seq, m)])
            }
        }

        return out
    }

    private pair(starts: Spot[], ends: Spot[]): Pair | null {
        let best: Pair | null = null

        for (const e of ends) {
            for (const s of starts) {
                if (s.seq < e.seq && (!best || by(cost([s, e]), cost(best)) < 0)) {
                    best = [s, e]
                }
            }
        }

        return best
    }
}
