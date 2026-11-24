import type { Circle } from '../geo/circle.ts'
import type { Day } from './day.ts'
import type { Halt } from './halt.ts'
import type { Line } from './line.ts'
import type { Stop } from './stop.ts'
import type { Way } from './way.ts'

export interface Lines {
    around(c: Circle, d: Day): Stop[]
    halts(c: Circle, d: Day): Halt[]
    many(ids: string[]): Line[]
    find(id: string): Line | null
    match(q: string): Line[]
    ways(id: string, d: Day): Way[]
}
