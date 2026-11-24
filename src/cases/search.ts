import { Circle } from '../domain/geo/circle.ts'
import type { Point } from '../domain/geo/point.ts'
import type { Day } from '../domain/transit/day.ts'
import { Found } from '../domain/transit/found.ts'
import type { Nearby } from '../domain/transit/nearby.ts'

const SOME = 5

export class Search {
    private readonly nearby: Nearby

    constructor(nearby: Nearby) {
        this.nearby = nearby
    }

    run(p: Point, d: Day, meters: number = Circle.WALK): Found {
        const near = this.nearby.of(new Circle(p, meters), d)

        if (near.length) {
            return new Found(near)
        }

        return new Found(this.nearby.of(new Circle(p, Circle.FAR), d).slice(0, SOME), true)
    }
}
