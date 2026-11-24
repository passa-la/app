import type { Point } from './point.ts'
import type { Walk } from './walk.ts'

export interface Walker {
    walk(from: Point, to: Point): Promise<Walk>
}
