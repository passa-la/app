import type { Point } from '../geo/point.ts'

export class Stop {
    readonly id: string
    readonly name: string
    readonly point: Point
    readonly lines: string[]

    constructor(id: string, name: string, point: Point, lines: string[] = []) {
        this.id = id
        this.name = name
        this.point = point
        this.lines = lines
    }
}
