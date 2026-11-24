import type { Bus } from './bus.ts'
import type { Day } from './day.ts'

export interface Schedule {
    at(line: string, dir: number, stop: string, d: Day, end?: string | null): Bus[]
}
