import type { Point } from '../../src/domain/geo/point.ts'

const TOLERANCE = 0.00005

const gap = (p: Point, a: Point, b: Point): number => {
    const dx = b.lon - a.lon
    const dy = b.lat - a.lat
    const len = dx * dx + dy * dy
    const t = len ? Math.max(0, Math.min(1, ((p.lon - a.lon) * dx + (p.lat - a.lat) * dy) / len)) : 0

    return Math.hypot(p.lon - (a.lon + t * dx), p.lat - (a.lat + t * dy))
}

export const simplify = (pts: Point[], tol = TOLERANCE): Point[] => {
    if (pts.length < 3) {
        return pts
    }

    const keep = new Uint8Array(pts.length)
    const stack: [number, number][] = [[0, pts.length - 1]]
    keep[0] = 1
    keep[pts.length - 1] = 1

    while (stack.length) {
        const [a, b] = stack.pop() as [number, number]
        let far = -1
        let max = tol

        for (let i = a + 1; i < b; i++) {
            const d = gap(pts[i], pts[a], pts[b])

            if (d > max) {
                max = d
                far = i
            }
        }

        if (far >= 0) {
            keep[far] = 1
            stack.push([a, far], [far, b])
        }
    }

    return pts.filter((_, i) => keep[i])
}
