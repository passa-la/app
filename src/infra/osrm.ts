import { Point } from '../domain/geo/point.ts'
import { Walk } from '../domain/geo/walk.ts'
import type { Walker } from '../domain/geo/walker.ts'

const URL = 'https://routing.openstreetmap.de/routed-foot'
const AGENT = 'passa-la/1.0 (+https://github.com/passa-la/app)'

type Fetch = (url: string, init?: { headers?: Record<string, string> }) => Promise<{ ok: boolean; json(): Promise<unknown> }>

type Answer = { code?: string; routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[] }

const pair = (p: Point) => `${p.lon.toFixed(5)},${p.lat.toFixed(5)}`

export class Osrm implements Walker {
    private readonly get: Fetch
    private readonly base: string

    constructor(get: Fetch = fetch as unknown as Fetch, base = URL) {
        this.get = get
        this.base = base
    }

    async walk(from: Point, to: Point): Promise<Walk> {
        try {
            const res = await this.get(`${this.base}/route/v1/foot/${pair(from)};${pair(to)}?overview=full&geometries=geojson`, {
                headers: { 'User-Agent': AGENT },
            })
            const body = (await res.json()) as Answer
            const route = body.routes?.[0]

            if (!res.ok || body.code !== 'Ok' || !route) {
                return Walk.straight(from, to)
            }

            return new Walk(
                route.geometry.coordinates.map(([lon, lat]) => new Point(lat, lon)),
                route.distance,
                route.duration,
            )
        } catch {
            return Walk.straight(from, to)
        }
    }
}
