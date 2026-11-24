import type { Geocoder } from '../domain/geo/geocoder.ts'
import type { Place } from '../domain/geo/place.ts'
import type { Point } from '../domain/geo/point.ts'
import type { Region } from '../domain/geo/region.ts'

const MIN = 3

export class Lookup {
    private readonly geo: Geocoder
    private readonly region: Region

    constructor(geo: Geocoder, region: Region) {
        this.geo = geo
        this.region = region
    }

    async run(q: string): Promise<Place[]> {
        const t = q.trim()

        if (t.length < MIN) {
            return []
        }

        return (await this.geo.find(t, this.region)).filter((p) => this.region.has(p))
    }

    name(p: Point): Promise<Place | null> {
        return this.geo.at(p)
    }
}
