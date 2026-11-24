import { Point } from './point.ts'

export class Box {
    readonly min: Point
    readonly max: Point

    constructor(min: Point, max: Point) {
        this.min = min
        this.max = max
    }

    static of(v: [number, number, number, number]): Box {
        return new Box(new Point(v[0], v[1]), new Point(v[2], v[3]))
    }

    has(p: Point): boolean {
        return p.lat >= this.min.lat && p.lat <= this.max.lat && p.lon >= this.min.lon && p.lon <= this.max.lon
    }
}
