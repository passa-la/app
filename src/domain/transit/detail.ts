import type { Day } from './day.ts'
import type { Line } from './line.ts'
import type { Plan } from './plan.ts'
import type { Table } from './table.ts'
import type { Way } from './way.ts'

export class Detail {
    readonly line: Line
    readonly day: Day
    readonly ways: Way[]
    readonly plan: Plan
    readonly tables: Map<number, Table>

    constructor(line: Line, day: Day, ways: Way[], plan: Plan, tables = new Map<number, Table>()) {
        this.line = line
        this.day = day
        this.ways = ways
        this.plan = plan
        this.tables = tables
    }
}
