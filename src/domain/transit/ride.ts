import type { Line } from './line.ts'
import type { Spot } from './spot.ts'

export class Ride {
    readonly line: Line
    readonly dir: number
    readonly board: Spot
    readonly drop: Spot

    constructor(line: Line, dir: number, board: Spot, drop: Spot) {
        this.line = line
        this.dir = dir
        this.board = board
        this.drop = drop
    }

    walk(): number {
        return this.board.meters + this.drop.meters
    }

    hops(): number {
        return this.drop.seq - this.board.seq
    }
}
