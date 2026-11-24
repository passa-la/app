import { describe, expect, it } from 'vitest'
import { Point } from '../src/domain/geo/point.ts'
import { Osrm } from '../src/infra/osrm.ts'

const from = new Point(-7.9947, -34.8394)
const to = new Point(-7.9939, -34.843)

describe('walking route', () => {
    it('follows the streets', async () => {
        const asked: string[] = []
        const get = async (url: string) => {
            asked.push(url)

            return {
                ok: true,
                json: async () => ({
                    code: 'Ok',
                    routes: [{ distance: 507.3, duration: 410, geometry: { coordinates: [[-34.8394, -7.9947], [-34.841, -7.994], [-34.843, -7.9939]] } }],
                }),
            }
        }
        const w = await new Osrm(get).walk(from, to)

        expect(asked[0]).toContain('/route/v1/foot/-34.83940,-7.99470;-34.84300,-7.99390')
        expect(w.exact).toBe(true)
        expect(Math.round(w.meters)).toBe(507)
        expect(w.points).toHaveLength(3)
    })

    it('walks in a straight line when routing is down', async () => {
        const w = await new Osrm(async () => ({ ok: false, json: async () => ({}) })).walk(from, to)

        expect(w.exact).toBe(false)
        expect(w.points).toHaveLength(2)
    })

    it('walks in a straight line offline', async () => {
        const w = await new Osrm(async () => {
            throw new Error('offline')
        }).walk(from, to)

        expect(w.exact).toBe(false)
    })
})
