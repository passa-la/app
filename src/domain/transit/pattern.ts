export class Pattern {
    readonly id: number
    readonly line: string
    readonly dir: number
    readonly stops: string[]

    constructor(id: number, line: string, dir: number, stops: string[]) {
        this.id = id
        this.line = line
        this.dir = dir
        this.stops = stops
    }
}
