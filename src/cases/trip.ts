import { Circle } from '../domain/geo/circle.ts'
import type { Point } from '../domain/geo/point.ts'
import type { Day } from '../domain/transit/day.ts'
import type { Direct } from '../domain/transit/direct.ts'
import type { Ride } from '../domain/transit/ride.ts'

export class Trip {
    private readonly direct: Direct

    constructor(direct: Direct) {
        this.direct = direct
    }

    run(from: Point, to: Point, d: Day, meters: number = Circle.WALK): Ride[] {
        return this.direct.between(new Circle(from, meters), new Circle(to, meters), d)
    }
}
