import type { Point } from '../../domain/geo/point.ts'

const EARTH = 6371000

export const ring = (p: Point, meters: number, steps = 72): GeoJSON.Feature => {
    const lat = (p.lat * Math.PI) / 180
    const lon = (p.lon * Math.PI) / 180
    const d = meters / EARTH
    const out: [number, number][] = []

    for (let i = 0; i <= steps; i++) {
        const b = (i / steps) * 2 * Math.PI
        const y = Math.asin(Math.sin(lat) * Math.cos(d) + Math.cos(lat) * Math.sin(d) * Math.cos(b))
        const x = lon + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(lat), Math.cos(d) - Math.sin(lat) * Math.sin(y))
        out.push([(x * 180) / Math.PI, (y * 180) / Math.PI])
    }

    return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [out] } }
}
