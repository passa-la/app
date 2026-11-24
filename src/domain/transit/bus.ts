export class Bus {
    readonly at: number
    readonly end: number | null

    constructor(at: number, end: number | null = null) {
        this.at = at
        this.end = end
    }

    shift(secs: number): Bus {
        return new Bus(this.at + secs, this.end === null ? null : this.end + secs)
    }

    ride(): number | null {
        return this.end === null ? null : Math.round((this.end - this.at) / 60)
    }
}
