import type { Day } from './day.ts'

export class Line {
    readonly id: string
    readonly code: string
    readonly name: string
    readonly agency: string
    readonly days: Day[]

    constructor(id: string, code: string, name: string, agency: string, days: Day[] = []) {
        this.id = id
        this.code = code
        this.name = name
        this.agency = agency
        this.days = days
    }

    runs(d: Day): boolean {
        return this.days.includes(d)
    }
}
