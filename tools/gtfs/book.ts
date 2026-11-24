import type { Day } from '../../src/domain/transit/day.ts'
import { Pattern } from '../../src/domain/transit/pattern.ts'
import { Run } from '../../src/domain/transit/run.ts'
import { Mask } from '../../src/data/mask.ts'

export class Book {
    private readonly ids = new Map<string, number>()
    private readonly days = new Map<number, Day[]>()
    private readonly pats = new Map<number, Pattern>()
    private readonly list: Run[] = []

    add(line: string, dir: number, mask: number, stops: string[], times: number[]): void {
        const key = `${line}\0${dir}\0${stops.join('\0')}`
        let id = this.ids.get(key)

        if (id === undefined) {
            id = this.ids.size + 1
            this.ids.set(key, id)
            this.pats.set(id, new Pattern(id, line, dir, stops))
        }

        if (!this.days.has(mask)) {
            this.days.set(mask, Mask.days(mask))
        }

        this.list.push(new Run(id, this.days.get(mask) as Day[], times))
    }

    patterns(lines: Set<string>): Pattern[] {
        return [...this.pats.values()].filter((p) => lines.has(p.line))
    }

    runs(lines: Set<string>): Run[] {
        return this.list.filter((r) => lines.has((this.pats.get(r.pattern) as Pattern).line))
    }
}
