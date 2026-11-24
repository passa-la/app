import type { Line } from './line.ts'
import type { Link } from './link.ts'
import type { Path } from './path.ts'
import type { Pattern } from './pattern.ts'
import type { Run } from './run.ts'
import type { Stop } from './stop.ts'

export class Network {
    readonly lines: Line[]
    readonly stops: Stop[]
    readonly links: Link[]
    readonly paths: Path[]
    readonly patterns: Pattern[]
    readonly runs: Run[]

    constructor(lines: Line[], stops: Stop[], links: Link[], paths: Path[], patterns: Pattern[] = [], runs: Run[] = []) {
        this.lines = lines
        this.stops = stops
        this.links = links
        this.paths = paths
        this.patterns = patterns
        this.runs = runs
    }
}
