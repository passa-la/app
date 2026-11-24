import { Day } from './day.ts'

export class Moment {
    static readonly DAY = 86400

    readonly day: Day
    readonly eve: Day
    readonly secs: number

    constructor(day: Day, eve: Day, secs: number) {
        this.day = day
        this.eve = eve
        this.secs = secs
    }

    static of(t: Date): Moment {
        const l = Day.local(t)
        const secs = l.getUTCHours() * 3600 + l.getUTCMinutes() * 60 + l.getUTCSeconds()

        return new Moment(Day.of(t), Day.of(new Date(t.getTime() - Moment.DAY * 1000)), secs)
    }
}
