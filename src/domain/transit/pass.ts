import type { Point } from '../geo/point.ts'
import type { Line } from './line.ts'
import { by } from './order.ts'
import type { Stop } from './stop.ts'

export class Pass {
    readonly line: Line
    readonly stop: Stop
    readonly meters: number

    constructor(line: Line, stop: Stop, meters: number) {
        this.line = line
        this.stop = stop
        this.meters = meters
    }

    static best(line: Line, stops: Stop[], from: Point): Pass | null {
        let best: Pass | null = null

        for (const s of stops) {
            const m = from.to(s.point)

            if (!best || m < best.meters) {
                best = new Pass(line, s, m)
            }
        }

        return best
    }

    static sort(all: Pass[]): Pass[] {
        return [...all].sort((a, b) => by([a.meters, a.line.code], [b.meters, b.line.code]))
    }
}
