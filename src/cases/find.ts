import type { Line } from '../domain/transit/line.ts'
import type { Lines } from '../domain/transit/lines.ts'

export class Find {
    private readonly lines: Lines

    constructor(lines: Lines) {
        this.lines = lines
    }

    run(q: string): Line[] {
        return this.lines.match(q.trim())
    }
}
