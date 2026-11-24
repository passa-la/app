import type { Day } from './day.ts'

export class Run {
    readonly pattern: number
    readonly days: Day[]
    readonly times: number[]

    constructor(pattern: number, days: Day[], times: number[]) {
        this.pattern = pattern
        this.days = days
        this.times = times
    }
}
