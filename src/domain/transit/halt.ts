import type { Stop } from './stop.ts'

export class Halt {
    readonly stop: Stop
    readonly line: string
    readonly dir: number
    readonly seq: number

    constructor(stop: Stop, line: string, dir: number, seq: number) {
        this.stop = stop
        this.line = line
        this.dir = dir
        this.seq = seq
    }
}
