import type { Point } from '../geo/point.ts'
import { Spot } from './spot.ts'
import type { Stop } from './stop.ts'

export class Way {
    readonly dir: number
    readonly points: Point[]
    readonly stops: Stop[]

    constructor(dir: number, points: Point[], stops: Stop[]) {
        this.dir = dir
        this.points = points
        this.stops = stops
    }

    near(p: Point | null, end = true): Spot | null {
        if (!p) {
            return null
        }

        let best: Spot | null = null

        for (let i = 0; i < this.stops.length; i++) {
            if (!end && !this.boards(i)) {
                continue
            }

            const m = p.to(this.stops[i].point)

            if (!best || m < best.meters) {
                best = new Spot(this.stops[i], i, m)
            }
        }

        return best
    }

    pick(stop: string | null, from: Point | null): Spot | null {
        const i = this.stops.findIndex((s, k) => stop !== null && s.id === stop && this.boards(k))

        if (i >= 0) {
            const s = this.stops[i]

            return new Spot(s, i, from ? from.to(s.point) : 0)
        }

        return this.near(from, false)
    }

    drop(end: string | null, to: Point | null, board: Spot | null): Spot | null {
        if (end === null) {
            return this.near(to)
        }

        const hit = this.at(end, board?.seq ?? -1) ?? this.at(end)

        return hit ? new Spot(hit.stop, hit.seq, to ? to.to(hit.stop.point) : 0) : null
    }

    private at(id: string, after = -1): Spot | null {
        const i = this.stops.findIndex((s, k) => s.id === id && k > after)

        return i >= 0 ? new Spot(this.stops[i], i, 0) : null
    }

    private boards(i: number): boolean {
        return i === 0 || i < this.stops.length - 1
    }
}
