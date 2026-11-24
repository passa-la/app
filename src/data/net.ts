import type { Circle } from '../domain/geo/circle.ts'
import { Point } from '../domain/geo/point.ts'
import { Bus } from '../domain/transit/bus.ts'
import type { Day } from '../domain/transit/day.ts'
import { Halt } from '../domain/transit/halt.ts'
import { Line } from '../domain/transit/line.ts'
import type { Lines } from '../domain/transit/lines.ts'
import type { Schedule } from '../domain/transit/schedule.ts'
import { Stop } from '../domain/transit/stop.ts'
import { Way } from '../domain/transit/way.ts'
import { NO_STOP, type Pack } from './codec.ts'
import { Mask } from './mask.ts'
import { term } from './term.ts'

const SLACK = 10
const LIMIT = 20
const E6 = 1e6
const DEG = 111320

const zeros = (s: string) => s.replace(/^0+/, '')

export class Net implements Lines, Schedule {
    readonly feed: string
    readonly built: string
    private readonly p: Pack
    private readonly all: Line[]
    private readonly stops: Stop[]
    private readonly terms: string[]
    private readonly lineIx: Map<string, number>
    private readonly stopIx: Map<string, number>
    private readonly stopLinks: number[][]
    private readonly lineLinks: number[][]
    private readonly linePaths: number[][]
    private readonly pats: Map<string, number[]>
    private readonly patRuns: number[][]

    constructor(p: Pack) {
        this.p = p
        this.feed = p.head.feed
        this.built = p.head.built
        this.all = p.head.lines.map(([id, code, name, agency, mask]) => new Line(id, code, name, agency, Mask.days(mask)))
        this.stops = p.head.stops.map(([id, name], i) => new Stop(id, name, new Point(p.stopLat[i] / E6, p.stopLon[i] / E6)))
        this.terms = this.all.map((l) => term(`${l.code} ${l.name}`))
        this.lineIx = new Map(this.all.map((l, i) => [l.id, i]))
        this.stopIx = new Map(this.stops.map((s, i) => [s.id, i]))
        this.stopLinks = this.stops.map(() => [])
        this.lineLinks = this.all.map(() => [])
        this.linePaths = this.all.map(() => [])
        this.pats = new Map()
        this.patRuns = Array.from({ length: p.patLine.length }, () => [])

        for (let i = 0; i < p.linkLine.length; i++) {
            this.stopLinks[p.linkStop[i]].push(i)
            this.lineLinks[p.linkLine[i]].push(i)
        }

        for (const l of this.lineLinks) {
            l.sort((a, b) => p.linkDir[a] - p.linkDir[b] || p.linkSeq[a] - p.linkSeq[b])
        }

        for (let i = 0; i < p.pathLine.length; i++) {
            this.linePaths[p.pathLine[i]].push(i)
        }

        for (let i = 0; i < p.patLine.length; i++) {
            const key = `${p.patLine[i]}\0${p.patDir[i]}`
            this.pats.set(key, [...(this.pats.get(key) ?? []), i])
        }

        for (let i = 0; i < p.runPat.length; i++) {
            this.patRuns[p.runPat[i]].push(i)
        }
    }

    lineCount(): number {
        return this.all.length
    }

    around(c: Circle, d: Day): Stop[] {
        const bit = Mask.bit(d)

        return this.near(c).flatMap((i) => {
            const ids = [...new Set(this.stopLinks[i].filter((k) => this.p.linkDays[k] & bit).map((k) => this.all[this.p.linkLine[k]].id))]
            const s = this.stops[i]

            return ids.length ? [new Stop(s.id, s.name, s.point, ids)] : []
        })
    }

    halts(c: Circle, d: Day): Halt[] {
        const bit = Mask.bit(d)

        return this.near(c).flatMap((i) =>
            this.stopLinks[i]
                .filter((k) => this.p.linkDays[k] & bit)
                .map((k) => new Halt(this.stops[i], this.all[this.p.linkLine[k]].id, this.p.linkDir[k], this.p.linkSeq[k])),
        )
    }

    many(ids: string[]): Line[] {
        return ids.map((id) => this.find(id)).filter((l): l is Line => l !== null)
    }

    stop(id: string): Stop | null {
        const i = this.stopIx.get(id)

        return i === undefined ? null : this.stops[i]
    }

    find(id: string): Line | null {
        const i = this.lineIx.get(id)

        return i === undefined ? null : this.all[i]
    }

    match(q: string): Line[] {
        const t = term(q)

        if (t === '') {
            return []
        }

        const rank = (l: Line) => (zeros(l.code) === zeros(t) ? 0 : l.code.startsWith(t) ? 1 : 2)

        return this.all
            .filter((_, i) => this.terms[i].includes(t))
            .sort((a, b) => rank(a) - rank(b) || (a.code < b.code ? -1 : a.code > b.code ? 1 : 0))
            .slice(0, LIMIT)
    }

    ways(id: string, d: Day): Way[] {
        const i = this.lineIx.get(id)

        if (i === undefined) {
            return []
        }

        const bit = Mask.bit(d)
        const stops = new Map<number, Stop[]>()
        const points = new Map<number, Point[]>()

        for (const k of this.lineLinks[i]) {
            if (this.p.linkDays[k] & bit) {
                const dir = this.p.linkDir[k]
                stops.set(dir, [...(stops.get(dir) ?? []), this.stops[this.p.linkStop[k]]])
            }
        }

        for (const k of this.linePaths[i]) {
            if (this.p.pathDays[k] & bit) {
                points.set(this.p.pathDir[k], this.coords(k))
            }
        }

        const dirs = [...new Set([...stops.keys(), ...points.keys()])].sort((a, b) => a - b)

        return dirs.map((dir) => new Way(dir, points.get(dir) ?? [], stops.get(dir) ?? []))
    }

    at(line: string, dir: number, stop: string, d: Day, end: string | null = null): Bus[] {
        const li = this.lineIx.get(line)
        const si = this.stopIx.get(stop)
        const ei = end === null ? null : (this.stopIx.get(end) ?? NO_STOP)

        if (li === undefined || si === undefined) {
            return []
        }

        const bit = Mask.bit(d)
        const p = this.p
        const best = new Map<number, number | null>()

        for (const pat of this.pats.get(`${li}\0${dir}`) ?? []) {
            const from = p.patStart[pat]
            const len = p.patStart[pat + 1] - from

            for (let a = 0; a < len - 1; a++) {
                if (p.patStops[from + a] !== si) {
                    continue
                }

                let b = -1

                if (ei !== null) {
                    for (let k = a + 1; k < len; k++) {
                        if (p.patStops[from + k] === ei) {
                            b = k
                            break
                        }
                    }

                    if (b < 0) {
                        continue
                    }
                }

                for (const r of this.patRuns[pat]) {
                    if (!(p.runDays[r] & bit)) {
                        continue
                    }

                    const at = p.runTimes[p.runStart[r] + a] * 60
                    const arr = b < 0 ? null : p.runTimes[p.runStart[r] + b] * 60
                    const old = best.get(at)

                    if (!best.has(at) || (arr !== null && (old === null || old === undefined || arr < old))) {
                        best.set(at, arr)
                    }
                }
            }
        }

        return [...best.entries()].sort((x, y) => x[0] - y[0]).map(([at, arr]) => new Bus(at, arr))
    }

    private near(c: Circle): number[] {
        const r = c.meters + SLACK
        const lat = r / DEG
        const lon = r / (DEG * Math.cos((c.center.lat * Math.PI) / 180))
        const out: number[] = []

        for (let i = 0; i < this.stops.length; i++) {
            const s = this.stops[i].point

            if (Math.abs(s.lat - c.center.lat) <= lat && Math.abs(s.lon - c.center.lon) <= lon && c.center.to(s) <= r) {
                out.push(i)
            }
        }

        return out
    }

    private coords(k: number): Point[] {
        const out: Point[] = []

        for (let i = this.p.pathStart[k]; i < this.p.pathStart[k + 1]; i += 2) {
            out.push(new Point(this.p.pathCoords[i] / E6, this.p.pathCoords[i + 1] / E6))
        }

        return out
    }
}
