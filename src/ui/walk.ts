import { useEffect, useRef, useState } from 'react'
import type { Point } from '../domain/geo/point.ts'
import type { Walk } from '../domain/geo/walk.ts'
import type { Walker } from '../domain/geo/walker.ts'
import { gap } from './map/shape.ts'

const ASTRAY = 35
const AGAIN = 15000

export const useWalk = (walker: Walker | null, from: Point | null, to: Point | null): Walk | null => {
    const [walk, setWalk] = useState<Walk | null>(null)
    const seq = useRef(0)
    const last = useRef({ at: 0, slack: 0, key: '' })

    useEffect(() => {
        if (!walker || !from || !to) {
            seq.current++
            last.current.key = ''
            setWalk(null)
            return
        }

        const key = `${to.lat},${to.lon}`
        const moved = walk !== null && Date.now() - last.current.at > AGAIN && gap(walk.points, from) > last.current.slack + ASTRAY

        if (last.current.key === key && !moved) {
            return
        }

        if (last.current.key !== key) {
            setWalk(null)
        }

        const n = ++seq.current
        last.current = { at: Date.now(), slack: last.current.slack, key }

        walker.walk(from, to).then((w) => {
            if (n === seq.current) {
                last.current.slack = gap(w.points, from)
                setWalk(w)
            }
        })
    }, [walker, from, to])

    return walk
}
