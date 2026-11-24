const EARTH = 6371000

const rad = (d: number) => (d * Math.PI) / 180

export class Point {
    readonly lat: number
    readonly lon: number

    constructor(lat: number, lon: number) {
        if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
            throw new RangeError(`Invalid point ${lat},${lon}`)
        }

        this.lat = lat
        this.lon = lon
    }

    to(p: Point): number {
        const a = rad(this.lat)
        const b = rad(p.lat)
        const h = Math.sin((b - a) / 2) ** 2 + Math.cos(a) * Math.cos(b) * Math.sin(rad(p.lon - this.lon) / 2) ** 2

        return 2 * EARTH * Math.asin(Math.min(1, Math.sqrt(h)))
    }
}
