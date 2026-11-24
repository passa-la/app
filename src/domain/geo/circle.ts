import type { Point } from './point.ts'

export class Circle {
    static readonly MIN = 100
    static readonly WALK = 1000
    static readonly FAR = 5000

    readonly center: Point
    readonly meters: number

    constructor(center: Point, meters: number = Circle.WALK) {
        this.center = center
        this.meters = meters
    }

    has(p: Point): boolean {
        return this.center.to(p) <= this.meters
    }
}
