import type { Bus } from './bus.ts'

export class Table {
    readonly stop: string
    readonly end: string | null
    readonly all: Bus[]
    readonly next: Bus[] | null
    readonly now: number

    constructor(stop: string, end: string | null, all: Bus[], next: Bus[] | null = null, now = 0) {
        this.stop = stop
        this.end = end
        this.all = all
        this.next = next
        this.now = now
    }

    wait(b: Bus): number {
        return Math.trunc((b.at - this.now) / 60)
    }

    ride(): number | null {
        const all = this.all.map((b) => b.ride()).filter((m): m is number => m !== null)

        if (!all.length) {
            return null
        }

        all.sort((a, b) => a - b)

        return all[Math.floor(all.length / 2)]
    }
}
