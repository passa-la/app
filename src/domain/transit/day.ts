export type Day = 'weekday' | 'saturday' | 'sunday'

const ZONE = -3 * 3600 * 1000

export const Day = {
    all: ['weekday', 'saturday', 'sunday'] as Day[],

    local(t: Date): Date {
        return new Date(t.getTime() + ZONE)
    },

    of(t: Date): Day {
        const n = Day.local(t).getUTCDay()

        return n === 6 ? 'saturday' : n === 0 ? 'sunday' : 'weekday'
    },
}
