import type { Place } from './place.ts'
import type { Point } from './point.ts'
import type { Region } from './region.ts'

export interface Geocoder {
    find(q: string, r: Region): Promise<Place[]>
    at(p: Point): Promise<Place | null>
}
