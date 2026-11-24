import type { Point } from './point.ts'

const PACE = 1.25

export class Walk {
    readonly points: Point[]
    readonly meters: number
    readonly seconds: number
    readonly exact: boolean

    constructor(points: Point[], meters: number, seconds: number, exact = true) {
        this.points = points
        this.meters = meters
        this.seconds = seconds
        this.exact = exact
    }

    static straight(from: Point, to: Point): Walk {
        const m = from.to(to)

        return new Walk([from, to], m, m / PACE, false)
    }
}
