import { useEffect, useState } from 'react'
import { AppState } from 'react-native'
import { Motion } from '../domain/geo/motion.ts'
import { Point } from '../domain/geo/point.ts'
import { sense } from '../infra/sense.ts'
import { shelf } from '../infra/shelf.ts'

export type Geo = 'ask' | 'busy' | 'on' | 'denied'

const TURN = 3
const EASE = 0.2
const JUMP = 60

const diff = (a: number, b: number) => ((a - b + 540) % 360) - 180

export const useMe = () => {
    const [geo, setGeo] = useState<Geo>('ask')
    const [me, setMe] = useState<Point | null>(null)
    const [deg, setDeg] = useState<number | null>(null)
    const [bus, setBus] = useState(false)
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

        const motion = new Motion()

        sense
            .watch((f) => {
                if (live) {
                    setMe(new Point(f.lat, f.lon))
                    setBus(motion.push(f))
                }
            })
            .then((s) => (live ? stops.push(s) : s()))
        let smooth: number | null = null
        let odd = 0

        sense
            .heading((d) => {
                if (!live) {
                    return
                }

                if (smooth === null) {
                    smooth = d
                } else if (Math.abs(diff(d, smooth)) > JUMP && odd < 3) {
                    odd++
                    return
                } else {
                    odd = 0
                    smooth = (smooth + EASE * diff(d, smooth) + 360) % 360
                }

                const now = smooth
                setDeg((old) => (old === null || Math.abs(diff(now, old)) >= TURN ? now : old))
            })
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
        bus,
        start: async () => {
            setGeo('busy')
            const ok = await sense.ask()
            setGeo(ok ? 'on' : 'denied')
            shelf.set('geo', ok ? 'on' : 'off')
        },
    }
}
