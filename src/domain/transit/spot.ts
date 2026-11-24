import type { Stop } from './stop.ts'

export class Spot {
    readonly stop: Stop
    readonly seq: number
    readonly meters: number

    constructor(stop: Stop, seq: number, meters: number) {
        this.stop = stop
        this.seq = seq
        this.meters = meters
    }
}
