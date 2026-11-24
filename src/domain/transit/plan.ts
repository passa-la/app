import type { Point } from '../geo/point.ts'
import { Leg } from './leg.ts'
import type { Way } from './way.ts'

export class Plan {
    readonly legs: Leg[]
    readonly best: number | null

    constructor(legs: Leg[], best: number | null) {
        this.legs = legs
        this.best = best
    }

    static of(ways: Way[], to: Point | null, from: Point | null, stop: string | null, end: string | null = null): Plan {
        const legs = ways.map((w) => {
            const board = w.pick(stop, from)

            return new Leg(w.dir, board, w.drop(end, to, board))
        })

        return new Plan(legs, Plan.choose(legs, stop))
    }

    private static choose(legs: Leg[], stop: string | null): number | null {
        let ok = legs.filter((l) => l.board !== null)

        if (stop !== null) {
            ok = ok.filter((l) => l.board?.stop.id === stop)
        }

        if (!ok.length) {
            return null
        }

        if (legs.length > 1) {
            const fit = ok.filter((l) => l.fits())
            ok = fit.length ? fit : ok
        }

        return [...ok].sort((a, b) => a.cost() - b.cost())[0].dir
    }
}
