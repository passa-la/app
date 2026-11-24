import type { Day } from './day.ts'

export class Link {
    readonly line: string
    readonly stop: string
    readonly dir: number
    readonly seq: number
    readonly days: Day[]

    constructor(line: string, stop: string, dir: number, seq: number, days: Day[]) {
        this.line = line
        this.stop = stop
        this.dir = dir
        this.seq = seq
        this.days = days
    }
}
