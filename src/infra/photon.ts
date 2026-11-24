import type { Geocoder } from '../domain/geo/geocoder.ts'
import { Place } from '../domain/geo/place.ts'
import { Point } from '../domain/geo/point.ts'
import type { Region } from '../domain/geo/region.ts'

const URL = 'https://photon.komoot.io'
const LIMIT = 10
const AGENT = 'passa-la/1.0 (+https://github.com/passa-la/app)'

type Fetch = (url: string, init?: { headers?: Record<string, string> }) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>

type Feature = {
    geometry?: { coordinates?: number[] }
    properties?: Record<string, string | undefined>
}

type Row = { name: string; label: string; lat: number; lon: number; state: string }

const stop = (p: Record<string, string | undefined>) =>
    p.osm_key === 'public_transport' || (p.osm_key === 'highway' && p.osm_value === 'bus_stop')

const row = (f: Feature): Row | null => {
    const c = f.geometry?.coordinates
    const p = f.properties ?? {}

    if (!Array.isArray(c) || c.length < 2 || stop(p)) {
        return null
    }

    const street = `${p.street ?? ''} ${p.housenumber ?? ''}`.trim()
    const name = p.name ?? (street || p.city)

    if (!name) {
        return null
    }

    const label = [...new Set([street === name ? '' : street, p.district ?? p.locality ?? '', p.city ?? ''])].filter((x) => x && x !== name)

    return { name, label: label.join(', '), lat: Number(c[1]), lon: Number(c[0]), state: p.state ?? '' }
}

export class Photon implements Geocoder {
    private readonly base: string
    private readonly get: Fetch
    private readonly memo = new Map<string, Place[]>()

    constructor(get: Fetch = fetch as unknown as Fetch, base = URL) {
        this.get = get
        this.base = base
    }

    async find(q: string, r: Region): Promise<Place[]> {
        const key = q.toLowerCase()
        const hit = this.memo.get(key)

        if (hit) {
            return hit
        }

        const b = r.box
        const query = new URLSearchParams({
            q,
            limit: String(LIMIT),
            bbox: [b.min.lon, b.min.lat, b.max.lon, b.max.lat].join(','),
            lat: String(r.hub.lat),
            lon: String(r.hub.lon),
        })
        const seen = new Set<string>()
        const out: Place[] = []

        for (const f of await this.features(`/api?${query}`)) {
            const p = row(f)

            if (p && !seen.has(p.name + p.label)) {
                seen.add(p.name + p.label)
                out.push(new Place(p.name, p.label, new Point(p.lat, p.lon), p.state))
            }
        }

        this.memo.set(key, out)

        return out
    }

    async at(p: Point): Promise<Place | null> {
        const query = new URLSearchParams({ lat: String(p.lat), lon: String(p.lon), limit: '3' })

        for (const f of await this.features(`/reverse?${query}`)) {
            const r = row(f)

            if (r) {
                return new Place(r.name, r.label, p, r.state)
            }
        }

        return null
    }

    private async features(path: string): Promise<Feature[]> {
        const res = await this.get(`${this.base}${path}`, { headers: { 'User-Agent': AGENT } })

        if (!res.ok) {
            throw new Error(`Photon ${res.status}`)
        }

        const body = (await res.json()) as { features?: Feature[] }

        return body.features ?? []
    }
}
