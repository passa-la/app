import { lines } from './zip.ts'

export type Row = Record<string, string>

const split = (line: string): string[] => {
    if (!line.includes('"')) {
        return line.split(',')
    }

    const out: string[] = []
    let cur = ''
    let quoted = false

    for (let i = 0; i < line.length; i++) {
        const c = line[i]

        if (quoted) {
            if (c === '"' && line[i + 1] === '"') {
                cur += '"'
                i++
            } else if (c === '"') {
                quoted = false
            } else {
                cur += c
            }
        } else if (c === '"') {
            quoted = true
        } else if (c === ',') {
            out.push(cur)
            cur = ''
        } else {
            cur += c
        }
    }

    out.push(cur)

    return out
}

export class Csv {
    private readonly file: string

    constructor(file: string) {
        this.file = file
    }

    async *rows(name: string, cols: string[]): AsyncGenerator<Row> {
        let at: number[] | null = null

        for await (const batch of lines(this.file, name)) {
            for (const line of batch) {
                if (at === null) {
                    const head = split(line.replace(/^﻿/, '')).map((c) => c.trim())
                    at = cols.map((c) => head.indexOf(c))
                    continue
                }

                if (line.trim() === '') {
                    continue
                }

                const r = split(line)
                const row: Row = {}

                cols.forEach((c, k) => (row[c] = at![k] < 0 ? '' : (r[at![k]] ?? '').trim()))

                yield row
            }
        }
    }
}
