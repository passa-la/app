import { Point } from '../../src/domain/geo/point.ts'
import { Feed } from '../../src/domain/transit/feed.ts'
import { Line } from '../../src/domain/transit/line.ts'
import { Link } from '../../src/domain/transit/link.ts'
import { Network } from '../../src/domain/transit/network.ts'
import { Path } from '../../src/domain/transit/path.ts'
import { Stop } from '../../src/domain/transit/stop.ts'
import { Mask } from '../../src/data/mask.ts'
import { Book } from './book.ts'
import { Csv } from './csv.ts'

const BUS = '3'
const BITS = [1, 2, 4]

type Route = [string, string, string]
type Owner = [string, number, number]
type Group = [string, string][]

const iso = (date: string) => {
    const d = new Date(Date.UTC(Number(date.slice(0, 4)), Number(date.slice(4, 6)) - 1, Number(date.slice(6, 8))))

    return /^\d{8}$/.test(date) && !Number.isNaN(d.getTime()) ? d.getUTCDay() : null
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export class Reader {
    async read(file: string, tag: string | null = null, today: string | null = null): Promise<Feed> {
        const csv = new Csv(file)
        const live = await this.live(csv, today ?? this.today())
        const routes = await this.routes(csv)
        const best = await this.best(csv, routes, live)
        const reps = await this.reps(csv, routes, live, best)
        const [seqs, book] = await this.scan(csv, reps, await this.owners(csv, routes, live))
        const links = this.links(seqs, reps)
        const lines = this.lines(routes, links)
        const kept = new Set(lines.map((l) => l.id))

        return new Feed(
            await this.version(csv),
            tag,
            new Network(lines, await this.stops(csv, links), links, await this.paths(csv, best), book.patterns(kept), book.runs(kept)),
        )
    }

    private today(): string {
        return new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10).replaceAll('-', '')
    }

    private async version(csv: Csv): Promise<string> {
        for await (const r of csv.rows('feed_info.txt', ['feed_version'])) {
            if (r.feed_version !== '') {
                return r.feed_version
            }
        }

        return new Date().toISOString().slice(0, 10).replaceAll('-', '.')
    }

    private async live(csv: Csv, today: string): Promise<Map<string, number>> {
        const live = new Map<string, number>()
        const cols = ['service_id', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'end_date']

        for await (const r of csv.rows('calendar.txt', cols)) {
            if (r.end_date < today) {
                continue
            }

            const week = r.monday + r.tuesday + r.wednesday + r.thursday + r.friday
            const mask = (week.includes('1') ? 1 : 0) | (r.saturday === '1' ? 2 : 0) | (r.sunday === '1' ? 4 : 0)

            if (mask) {
                live.set(r.service_id, mask)
            }
        }

        for await (const r of csv.rows('calendar_dates.txt', ['service_id', 'date', 'exception_type'])) {
            const n = iso(r.date)

            if (r.exception_type === '1' && r.date >= today && n !== null) {
                live.set(r.service_id, (live.get(r.service_id) ?? 0) | (n === 0 ? 4 : n === 6 ? 2 : 1))
            }
        }

        return live
    }

    private async routes(csv: Csv): Promise<Map<string, Route>> {
        const agencies = new Map<string, string>()

        for await (const r of csv.rows('agency.txt', ['agency_id', 'agency_name'])) {
            agencies.set(r.agency_id, r.agency_name)
        }

        const routes = new Map<string, Route>()

        for await (const r of csv.rows('routes.txt', ['route_id', 'agency_id', 'route_short_name', 'route_long_name', 'route_type'])) {
            if (r.route_type === BUS) {
                routes.set(r.route_id, [
                    r.route_short_name || r.route_id,
                    r.route_long_name || r.route_short_name,
                    agencies.get(r.agency_id) ?? r.agency_id,
                ])
            }
        }

        return routes
    }

    private async *trips(csv: Csv, routes: Map<string, Route>, live: Map<string, number>): AsyncGenerator<[string, string, string]> {
        for await (const r of csv.rows('trips.txt', ['route_id', 'service_id', 'trip_id', 'direction_id', 'shape_id'])) {
            const mask = live.get(r.service_id)

            if (!routes.has(r.route_id) || mask === undefined) {
                continue
            }

            for (const b of BITS) {
                if (mask & b) {
                    yield [`${r.route_id}\0${Number(r.direction_id) || 0}\0${b}`, r.shape_id, r.trip_id]
                }
            }
        }
    }

    private async best(csv: Csv, routes: Map<string, Route>, live: Map<string, number>): Promise<Map<string, string>> {
        const count = new Map<string, Map<string, number>>()

        for await (const [key, shape] of this.trips(csv, routes, live)) {
            const c = count.get(key) ?? new Map<string, number>()
            c.set(shape, (c.get(shape) ?? 0) + 1)
            count.set(key, c)
        }

        const best = new Map<string, string>()

        for (const [key, c] of count) {
            let top = ''
            let n = -1

            for (const [shape, k] of c) {
                if (k > n) {
                    top = shape
                    n = k
                }
            }

            best.set(key, top)
        }

        return best
    }

    private async reps(csv: Csv, routes: Map<string, Route>, live: Map<string, number>, best: Map<string, string>): Promise<Map<string, string>> {
        const reps = new Map<string, string>()

        for await (const [key, shape, trip] of this.trips(csv, routes, live)) {
            if (!reps.has(key) && best.get(key) === shape) {
                reps.set(key, trip)
            }
        }

        return reps
    }

    private async owners(csv: Csv, routes: Map<string, Route>, live: Map<string, number>): Promise<Map<string, Owner>> {
        const owners = new Map<string, Owner>()

        for await (const r of csv.rows('trips.txt', ['route_id', 'service_id', 'trip_id', 'direction_id'])) {
            const mask = live.get(r.service_id)

            if (routes.has(r.route_id) && mask !== undefined) {
                owners.set(r.trip_id, [r.route_id, Number(r.direction_id) || 0, mask])
            }
        }

        return owners
    }

    private async scan(csv: Csv, reps: Map<string, string>, owners: Map<string, Owner>): Promise<[Map<string, string[]>, Book]> {
        const want = new Set(reps.values())
        const seqs = new Map<string, string[]>()
        const book = new Book()

        for await (const [trip, rows] of this.groups(csv)) {
            const stops = rows.map((r) => r[0])

            if (want.has(trip)) {
                seqs.set(trip, stops)
            }

            const owner = owners.get(trip)
            const times = owner ? this.times(rows.map((r) => r[1])) : null

            if (owner && times) {
                book.add(owner[0], owner[1], owner[2], stops, times)
            }
        }

        return [seqs, book]
    }

    private async *groups(csv: Csv): AsyncGenerator<[string, Group]> {
        let trip: string | null = null
        let rows = new Map<number, [string, string]>()
        const done = new Set<string>()
        const sorted = (): Group => [...rows.entries()].sort((a, b) => a[0] - b[0]).map((e) => e[1])

        for await (const r of csv.rows('stop_times.txt', ['trip_id', 'stop_id', 'stop_sequence', 'departure_time'])) {
            if (r.trip_id !== trip) {
                if (trip !== null) {
                    yield [trip, sorted()]
                    done.add(trip)
                }

                if (done.has(r.trip_id)) {
                    throw new Error(`stop_times.txt splits trip ${r.trip_id}`)
                }

                trip = r.trip_id
                rows = new Map()
            }

            rows.set(Number(r.stop_sequence) || 0, [r.stop_id, r.departure_time])
        }

        if (trip !== null) {
            yield [trip, sorted()]
        }
    }

    private times(raw: string[]): number[] | null {
        const out: number[] = []

        for (const t of raw) {
            const p = t.split(':')

            if (p.length !== 3) {
                return null
            }

            out.push(Number(p[0]) * 3600 + Number(p[1]) * 60 + Number(p[2]))
        }

        return out
    }

    private links(seqs: Map<string, string[]>, reps: Map<string, string>): Link[] {
        const masks = new Map<string, number>()

        for (const [key, trip] of reps) {
            const [line, dir, bit] = key.split('\0')

            ;(seqs.get(trip) ?? []).forEach((stop, i) => {
                const k = `${line}\0${dir}\0${stop}\0${i}`
                masks.set(k, (masks.get(k) ?? 0) | Number(bit))
            })
        }

        return [...masks].map(([k, mask]) => {
            const [line, dir, stop, i] = k.split('\0')

            return new Link(line, stop, Number(dir), Number(i), Mask.days(mask))
        })
    }

    private lines(routes: Map<string, Route>, links: Link[]): Line[] {
        const masks = new Map<string, number>()

        for (const l of links) {
            masks.set(l.line, (masks.get(l.line) ?? 0) | Mask.of(l.days))
        }

        return [...routes]
            .filter(([id]) => masks.has(id))
            .map(([id, [code, name, agency]]) => new Line(id, code, name, agency, Mask.days(masks.get(id) ?? 0)))
    }

    private async stops(csv: Csv, links: Link[]): Promise<Stop[]> {
        const used = new Set(links.map((l) => l.stop))
        const stops: Stop[] = []

        for await (const r of csv.rows('stops.txt', ['stop_id', 'stop_name', 'stop_lat', 'stop_lon'])) {
            if (used.has(r.stop_id)) {
                stops.push(new Stop(r.stop_id, this.name(r.stop_name, r.stop_id), new Point(Number(r.stop_lat), Number(r.stop_lon))))
            }
        }

        return stops
    }

    private name(name: string, id: string): string {
        const clean = name.trim().replace(new RegExp(`\\s*-\\s*${escape(id)}$`), '').trim()

        return clean === id ? '' : clean
    }

    private async paths(csv: Csv, best: Map<string, string>): Promise<Path[]> {
        const shapes = new Map<string, [string, number, number]>()

        for (const [key, shape] of best) {
            if (shape === '') {
                continue
            }

            const [line, dir, bit] = key.split('\0')
            shapes.set(shape, [line, Number(dir), (shapes.get(shape)?.[2] ?? 0) | Number(bit)])
        }

        const pts = new Map<string, Map<number, [number, number]>>()

        for await (const r of csv.rows('shapes.txt', ['shape_id', 'shape_pt_lat', 'shape_pt_lon', 'shape_pt_sequence'])) {
            if (shapes.has(r.shape_id)) {
                const m = pts.get(r.shape_id) ?? new Map<number, [number, number]>()
                m.set(Number(r.shape_pt_sequence) || 0, [Number(r.shape_pt_lat), Number(r.shape_pt_lon)])
                pts.set(r.shape_id, m)
            }
        }

        return [...pts].map(([id, seq]) => {
            const [line, dir, mask] = shapes.get(id) as [string, number, number]
            const points = [...seq.entries()].sort((a, b) => a[0] - b[0]).map(([, [lat, lon]]) => new Point(lat, lon))

            return new Path(line, dir, Mask.days(mask), points)
        })
    }
}
