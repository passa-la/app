import type { Box } from './box.ts'
import type { Place } from './place.ts'
import type { Point } from './point.ts'

export class Region {
    readonly box: Box
    readonly hub: Point
    readonly state: string

    constructor(box: Box, hub: Point, state: string) {
        this.box = box
        this.hub = hub
        this.state = state
    }

    has(p: Place): boolean {
        return this.box.has(p.point) && (p.state === '' || p.state === this.state)
    }
}
