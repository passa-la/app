import { useEffect, useState } from 'react'
import { AppState } from 'react-native'
import { Point } from '../domain/geo/point.ts'
import { sense } from '../infra/sense.ts'
import { shelf } from '../infra/shelf.ts'

export type Geo = 'ask' | 'busy' | 'on' | 'denied'

const TURN = 3

export const useMe = () => {
    const [geo, setGeo] = useState<Geo>('ask')
    const [me, setMe] = useState<Point | null>(null)
    const [deg, setDeg] = useState<number | null>(null)
    const [active, setActive] = useState(AppState.currentState === 'active')

    useEffect(() => {
        const sub = AppState.addEventListener('change', (s) => setActive(s === 'active'))

        if (shelf.get<string>('geo', '') === 'on') {
            sense.granted().then((ok) => ok && setGeo('on'))
        }

        return () => sub.remove()
    }, [])

    useEffect(() => {
        if (geo !== 'on' || !active) {
            return
        }

        let live = true
        const stops: (() => void)[] = []

        sense.watch((f) => live && setMe(new Point(f.lat, f.lon))).then((s) => (live ? stops.push(s) : s()))
        sense
            .heading((d) => live && setDeg((old) => (old === null || Math.abs(((d - old + 540) % 360) - 180) >= TURN ? d : old)))
            .then((s) => (live ? stops.push(s) : s()))
            .catch(() => {})

        return () => {
            live = false
            stops.forEach((s) => s())
        }
    }, [geo, active])

    return {
        geo,
        me,
        deg,
        start: async () => {
            setGeo('busy')
            const ok = await sense.ask()
            setGeo(ok ? 'on' : 'denied')
            shelf.set('geo', ok ? 'on' : 'off')
        },
    }
}
