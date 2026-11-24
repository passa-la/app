import type { Point } from './point.ts'

export class Place {
    readonly name: string
    readonly label: string
    readonly point: Point
    readonly state: string

    constructor(name: string, label: string, point: Point, state = '') {
        this.name = name
        this.label = label
        this.point = point
        this.state = state
    }
}
