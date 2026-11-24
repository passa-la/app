import { useEffect, useMemo, useState } from 'react'
import type { Point } from '../../domain/geo/point.ts'
import { Day } from '../../domain/transit/day.ts'
import { Moment } from '../../domain/transit/moment.ts'
import type { Kit } from '../net.tsx'

const TICK = 30000

type Opts = { to?: Point | null; day: Day; onDay: (d: Day) => void }

export const useLine = (kit: Kit | null, id: string | null, { to = null, day, onDay }: Opts) => {
    const [stop, setStop] = useState<string | null>(null)
    const [end, setEnd] = useState<string | null>(null)
    const [focus, setFocus] = useState<number | null>(null)
    const [table, setTable] = useState(false)
    const [now, setNow] = useState(() => Date.now())

    useEffect(() => {
        const i = setInterval(() => setNow(Date.now()), TICK)

        return () => clearInterval(i)
    }, [])

    useEffect(() => {
        setStop(null)
        setEnd(null)
        setFocus(null)
        setTable(false)
    }, [id])

    const detail = useMemo(
        () => (kit && id ? kit.show.run(id, day, Moment.of(new Date(now)), { to, stop, end }) : null),
        [kit, id, day, now, to, stop, end],
    )

    const dir = detail ? (focus ?? detail.plan.best ?? detail.ways[0]?.dir ?? 0) : null
    const way = detail?.ways.find((w) => w.dir === dir) ?? detail?.ways[0] ?? null
    const leg = way ? (detail?.plan.legs.find((l) => l.dir === way.dir) ?? null) : null
    const tab = way ? (detail?.tables.get(way.dir) ?? null) : null

    return {
        detail,
        day,
        today: Day.of(new Date(now)),
        stop,
        end,
        way,
        leg,
        tab,
        table,
        toggle: () => setTable((v) => !v),
        show: (d: number) => setFocus(d),
        unend: () => setEnd(null),
        pick: (k: Day) => {
            onDay(k)
            setStop(null)
            setEnd(null)
            setFocus(null)
        },
        tap: (sid: string) => {
            if (stop && !end && sid !== stop) {
                setEnd(sid)
            } else {
                setStop(sid)
                setEnd(null)
            }

            setFocus(null)
        },
    }
}

export type LineState = ReturnType<typeof useLine>
