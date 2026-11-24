import type { Spot } from './spot.ts'

export class Leg {
    readonly dir: number
    readonly board: Spot | null
    readonly drop: Spot | null

    constructor(dir: number, board: Spot | null, drop: Spot | null) {
        this.dir = dir
        this.board = board
        this.drop = drop
    }

    fits(): boolean {
        return !!this.board && !!this.drop && this.board.seq < this.drop.seq
    }

    cost(): number {
        return (this.board?.meters ?? 0) + (this.drop?.meters ?? 0)
    }
}
