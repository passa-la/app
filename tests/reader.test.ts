import { beforeAll, describe, expect, it } from 'vitest'
import type { Feed } from '../src/domain/transit/feed.ts'
import { Reader } from '../tools/gtfs/reader.ts'
import { feed, zip } from './helpers.ts'

describe('reader', () => {
    let f: Feed

    beforeAll(async () => {
        f = await feed()
    })

    const days = (d: string[]) => d.join('+')

    it('reads version and tag', () => {
        expect(f.version).toBe('v-test')
        expect(f.tag).toBe('"tag"')
    })

    it('keeps only live bus lines with the days they run', () => {
        expect(f.net.lines.map((l) => l.code)).toEqual(['100', '200'])
        expect(f.net.lines[0].days).toEqual(['weekday', 'sunday'])
        expect(f.net.lines[1].days).toEqual(['weekday'])
        expect(f.net.lines[0].agency).toBe('Empresa Teste')
    })

    it('cleans stop names and keeps only served stops', () => {
        expect(Object.fromEntries(f.net.stops.map((s) => [s.id, s.name]))).toEqual({ S1: '', S2: 'Ti Teste', S3: '' })
    })

    it('orders stops per direction and day from the main trip', () => {
        const links = f.net.links.map((l) => `${l.line}:${l.dir}:${l.seq}:${l.stop}:${days(l.days)}`).sort()

        expect(links).toEqual([
            '100:0:0:S1:weekday+sunday',
            '100:0:1:S2:sunday',
            '100:0:1:S3:weekday',
            '100:0:2:S3:sunday',
            '100:1:0:S3:weekday+sunday',
            '100:1:1:S1:weekday+sunday',
            '200:0:0:S2:weekday',
        ])
    })

    it('keeps the most used shape of each direction per day', () => {
        const paths = f.net.paths.map((p) => `${p.line}:${p.dir}:${days(p.days)}:${p.points.length}`).sort()

        expect(paths).toEqual(['100:0:sunday:3', '100:0:weekday:3', '100:1:weekday+sunday:2', '200:0:weekday:2'])

        const week = f.net.paths.find((p) => p.line === '100' && p.dir === 0 && days(p.days) === 'weekday')

        expect(week?.points.map((p) => p.lat)).toEqual([-8.0001, -8.01, -8.02])
    })

    it('keeps every trip with its times, grouped by stop pattern', () => {
        const stops = new Map(f.net.patterns.map((p) => [p.id, `${p.line}:${p.dir}:${p.stops.join('>')}`]))
        const runs = f.net.runs.map((r) => `${stops.get(r.pattern)}@${r.times.join(',')}:${days(r.days)}`).sort()

        expect(stops.size).toBe(5)
        expect(runs).toEqual([
            '100:0:S1>S2>S3@32400,33000,33600:sunday',
            '100:0:S1>S3@18000,18600:weekday',
            '100:0:S1>S3@21600,22200:weekday',
            '100:0:S1>S4@25200,25800:weekday',
            '100:1:S3>S1@21600,22200:weekday',
            '100:1:S3>S1@36000,36600:sunday',
            '100:1:S3>S1@88200,88800:weekday',
            '200:0:S2@25200:weekday',
        ])
    })

    it('refuses stop times that split a trip', async () => {
        const file = zip({
            'stop_times.txt':
                'trip_id,arrival_time,departure_time,stop_id,stop_sequence\nT1,05:00:00,05:00:00,S1,1\nT7,06:00:00,06:00:00,S1,1\nT1,05:10:00,05:10:00,S3,2\n',
        })

        await expect(new Reader().read(file, null, '20261123')).rejects.toThrow('splits trip T1')
    })

    it('reads quoted fields with commas', async () => {
        const file = zip({ 'stops.txt': 'stop_id,stop_name,stop_lat,stop_lon\nS1,"Praça, Centro",-8.0001,-34.85\nS2,S2,-8.005,-34.85\nS3,S3,-8.02,-34.85\n' })
        const g = await new Reader().read(file, null, '20261123')

        expect(g.net.stops[0].name).toBe('Praça, Centro')
    })
})
