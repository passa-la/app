import { describe, expect, it } from 'vitest'
import { Lookup } from '../src/cases/lookup.ts'
import { Point } from '../src/domain/geo/point.ts'
import { area } from '../src/infra/area.ts'
import { Photon } from '../src/infra/photon.ts'

const answer = (body: unknown, ok = true) => {
    const asked: string[] = []
    const get = async (url: string) => {
        asked.push(url)

        return { ok, status: ok ? 200 : 503, json: async () => body }
    }

    return { asked, get }
}

const patteo = {
    features: [
        {
            geometry: { coordinates: [-34.8407, -7.9939] },
            properties: { name: 'Patteo Olinda Shopping', street: 'Rua Doutor Eduardo de Morais', district: 'Casa Caiada', city: 'Olinda', state: 'Pernambuco', osm_key: 'shop', osm_value: 'mall' },
        },
        {
            geometry: { coordinates: [-34.8394, -7.9947] },
            properties: { name: 'Shopping Patteo Olinda', city: 'Olinda', state: 'Pernambuco', osm_key: 'highway', osm_value: 'bus_stop' },
        },
        {
            geometry: { coordinates: [-39.31, -7.21] },
            properties: { name: 'Pantec', city: 'Juazeiro do Norte', state: 'Ceará', osm_key: 'shop', osm_value: 'mall' },
        },
    ],
}

describe('places', () => {
    it('suggests places in the state only, skipping bus stops', async () => {
        const { asked, get } = answer(patteo)
        const found = await new Lookup(new Photon(get), area).run('patteo')

        expect(found.map((p) => [p.name, p.label])).toEqual([['Patteo Olinda Shopping', 'Rua Doutor Eduardo de Morais, Casa Caiada, Olinda']])
        expect(asked[0]).toContain('bbox=')
        expect(asked[0]).toContain('q=patteo')
    })

    it('needs three letters', async () => {
        const { asked, get } = answer(patteo)

        expect(await new Lookup(new Photon(get), area).run('ab')).toEqual([])
        expect(asked).toEqual([])
    })

    it('remembers a search', async () => {
        const { asked, get } = answer(patteo)
        const photon = new Photon(get)

        await photon.find('Patteo', area)
        await photon.find('patteo', area)

        expect(asked).toHaveLength(1)
    })

    it('names a tapped point, skipping bus stops', async () => {
        const { get } = answer({
            features: [
                { geometry: { coordinates: [-34.825, -7.744] }, properties: { name: 'Ponto 1', osm_key: 'highway', osm_value: 'bus_stop', state: 'Pernambuco' } },
                {
                    geometry: { coordinates: [-34.825, -7.744] },
                    properties: { name: 'Rua Argentina', district: 'Quatro Cantos', city: 'Ilha de Itamaracá', state: 'Pernambuco', osm_key: 'highway', osm_value: 'residential' },
                },
            ],
        })
        const p = await new Lookup(new Photon(get), area).name(new Point(-7.744, -34.825))

        expect([p?.name, p?.label, p?.point.lat]).toEqual(['Rua Argentina', 'Quatro Cantos, Ilha de Itamaracá', -7.744])
    })

    it('fails loudly when Photon is down', async () => {
        const { get } = answer({}, false)

        await expect(new Photon(get).find('patteo', area)).rejects.toThrow('Photon 503')
    })
})
