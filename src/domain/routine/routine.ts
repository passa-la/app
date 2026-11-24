export type Routine = {
    id: string
    line: string
    code: string
    name: string
    dir: number
    stop: string
    end: string
    from: string
    to: string
    time: number
    days: number[]
    on: boolean
}

export const WEEK = {
    all: [0, 1, 2, 3, 4, 5, 6],
    work: [1, 2, 3, 4, 5],
    rest: [0, 6],
}
