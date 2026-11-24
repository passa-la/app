import type { Point } from '../geo/point.ts'
import type { Day } from './day.ts'

export class Path {
    readonly line: string
    readonly dir: number
    readonly days: Day[]
    readonly points: Point[]

    constructor(line: string, dir: number, days: Day[], points: Point[]) {
        this.line = line
        this.dir = dir
        this.days = days
        this.points = points
    }
}
