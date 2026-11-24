import type { Day } from '../domain/transit/day.ts'

const BITS: Record<Day, number> = { weekday: 1, saturday: 2, sunday: 4 }

export const Mask = {
    bit(d: Day): number {
        return BITS[d]
    },

    of(days: Day[]): number {
        return days.reduce((m, d) => m | BITS[d], 0)
    },

    days(mask: number): Day[] {
        return (Object.keys(BITS) as Day[]).filter((d) => (mask & BITS[d]) !== 0)
    },
}
