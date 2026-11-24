import { useEffect, useMemo, useRef, useState } from 'react'
import { AppState } from 'react-native'
import type { Point } from '../../domain/geo/point.ts'
import { Agenda } from '../../domain/routine/agenda.ts'
import type { Routine } from '../../domain/routine/routine.ts'
import { countdown } from '../../infra/countdown.ts'
import { shelf } from '../../infra/shelf.ts'
import { clock } from '../format.ts'
import type { Kit } from '../net.tsx'

const NEAR = 60
const KEEP = 20
const ZONE = 3 * 3600

const hm = (ms: number) => clock(Math.floor(ms / 1000) - ZONE)

export const useRoutines = (kit: Kit | null, now: number, me: Point | null) => {
    const [all, setAll] = useState<Routine[]>(() => shelf.get('routines', []))
    const [done, setDone] = useState<string[]>(() => shelf.get('done', []))
    const agenda = useMemo(() => (kit ? new Agenda(kit.net) : null), [kit])
    const ref = useRef(done)

    const keep = (next: Routine[]) => {
        shelf.set('routines', next)
        setAll(next)
    }

    const finish = (key: string) => {
        if (ref.current.includes(key)) {
            return
        }

        const next = [...ref.current, key].slice(-KEEP)
        ref.current = next
        shelf.set('done', next)
        setDone(next)
        countdown.end(key)
    }

    useEffect(() => {
        const pull = () => countdown.done().forEach(finish)
        pull()
        const sub = AppState.addEventListener('change', (st) => st === 'active' && pull())

        return () => sub.remove()
    }, [])

    useEffect(() => {
        if (!agenda) {
            return
        }

        countdown.plan(
            agenda
                .ahead(all, Date.now(), 7)
                .filter((o) => o.bus !== null)
                .map((o) => ({
                    id: o.key,
                    title: `${o.routine.code} · ônibus às ${hm(o.bus as number)}`,
                    text: `${o.routine.from} → ${o.routine.to}`,
                    start: o.start,
                    at: o.bus as number,
                })),
        )
    }, [agenda, all])

    const live = useMemo(() => (agenda ? agenda.live(all, now, new Set(done)) : null), [agenda, all, now, done])
    const next = useMemo(() => (agenda && live ? agenda.next(live, now) : null), [agenda, live, now])

    useEffect(() => {
        if (!live || !me || !kit) {
            return
        }

        const end = kit.net.stop(live.routine.end)

        if (end && me.to(end.point) <= NEAR) {
            finish(live.key)
        }
    }, [live, me, kit])

    return {
        all,
        live,
        next,
        finish,
        save: (r: Routine) => keep([...all.filter((x) => x.id !== r.id), r]),
        remove: (id: string) => keep(all.filter((x) => x.id !== id)),
        toggle: (id: string) => keep(all.map((x) => (x.id === id ? { ...x, on: !x.on } : x))),
    }
}

export type Routines = ReturnType<typeof useRoutines>
