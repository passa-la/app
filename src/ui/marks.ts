import { useState } from 'react'
import { Place } from '../domain/geo/place.ts'
import { Point } from '../domain/geo/point.ts'
import type { Line } from '../domain/transit/line.ts'
import { shelf } from '../infra/shelf.ts'

const KEEP = 6
const NICK = 30

export type Fav = { id: string; code: string; name: string; nick: string }
export type Spot = { name: string; label: string; lat: number; lon: number; nick: string }
export type Seen = { id: string; code: string; name: string; ctx: string }

const key = (lat: number, lon: number) => `${lat.toFixed(5)},${lon.toFixed(5)}`

const short = (s: string) => s.trim().slice(0, NICK)

export const place = (s: Spot) => new Place(s.nick || s.name, s.nick ? s.name : s.label, new Point(s.lat, s.lon))

export const useMarks = () => {
    const [favs, setFavs] = useState<Fav[]>(() => shelf.get('favs', []))
    const [spots, setSpots] = useState<Spot[]>(() => shelf.get('spots', []))
    const [seen, setSeen] = useState<Seen[]>(() => shelf.get('seen', []))

    const keep = <T>(name: string, set: (v: T) => void, v: T) => {
        shelf.set(name, v)
        set(v)
    }

    const fav = (id: string) => favs.find((f) => f.id === id) ?? null
    const spot = (p: Place) => spots.find((s) => key(s.lat, s.lon) === key(p.point.lat, p.point.lon)) ?? null

    return {
        favs,
        spots,
        seen,
        fav,
        spot,
        star: (l: Line) =>
            keep('favs', setFavs, fav(l.id) ? favs.filter((f) => f.id !== l.id) : [...favs, { id: l.id, code: l.code, name: l.name, nick: '' }]),
        rename: (id: string, nick: string) => keep('favs', setFavs, favs.map((f) => (f.id === id ? { ...f, nick: short(nick) } : f))),
        save: (p: Place) => {
            const old = spot(p)
            const next = old
                ? spots.filter((s) => s !== old)
                : [...spots, { name: p.name, label: p.label, lat: p.point.lat, lon: p.point.lon, nick: '' }]

            keep('spots', setSpots, next)
        },
        label: (p: Place, nick: string) => {
            const old = spot(p)
            keep('spots', setSpots, spots.map((s) => (s === old ? { ...s, nick: short(nick) } : s)))
        },
        look: (l: Line, ctx: string) =>
            keep('seen', setSeen, [{ id: l.id, code: l.code, name: l.name, ctx }, ...seen.filter((s) => s.id !== l.id)].slice(0, KEEP)),
    }
}

export type Marks = ReturnType<typeof useMarks>
