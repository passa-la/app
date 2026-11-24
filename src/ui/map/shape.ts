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

export const gap = (pts: Point[], p: Point): number => {
    const k = Math.cos((p.lat * Math.PI) / 180) * (Math.PI / 180) * EARTH
    const m = (Math.PI / 180) * EARTH
    const xy = (q: Point): [number, number] => [(q.lon - p.lon) * k, (q.lat - p.lat) * m]

    if (pts.length === 1) {
        return Math.hypot(...xy(pts[0]))
    }

    let best = Infinity

    for (let i = 1; i < pts.length; i++) {
        const [ax, ay] = xy(pts[i - 1])
        const [bx, by] = xy(pts[i])
        const dx = bx - ax
        const dy = by - ay
        const len = dx * dx + dy * dy
        const t = len ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len)) : 0

        best = Math.min(best, Math.hypot(ax + t * dx, ay + t * dy))
    }

    return best
}
