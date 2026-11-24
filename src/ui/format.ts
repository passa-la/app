import type { Day } from '../domain/transit/day.ts'

export const DAYS: Record<Day, { name: string; when: string }> = {
    weekday: { name: 'Dias úteis', when: 'em dias úteis' },
    saturday: { name: 'Sábado', when: 'no sábado' },
    sunday: { name: 'Domingo', when: 'no domingo' },
}

export const WAYS = ['Ida', 'Volta']

const two = (n: number) => String(n).padStart(2, '0')

export const clock = (secs: number): string => {
    const s = ((secs % 86400) + 86400) % 86400

    return `${two(Math.floor(s / 3600))}:${two(Math.floor((s % 3600) / 60))}`
}

export const wait = (m: number): string => {
    if (m < 1) {
        return 'agora'
    }

    if (m < 60) {
        return `em ${m} min`
    }

    return `em ${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}`
}

export const hours = (all: number[]): { h: string; m: string[] }[] => {
    const out: { h: string; m: string[] }[] = []

    for (const at of all) {
        const [h, m] = clock(at).split(':')
        const last = out.at(-1)

        if (last?.h === h) {
            if (last.m.at(-1) !== m) {
                last.m.push(m)
            }
        } else {
            out.push({ h, m: [m] })
        }
    }

    return out
}

export const label = (dir: number) => WAYS[dir] ?? `Sentido ${dir + 1}`
