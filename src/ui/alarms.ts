import { useEffect, useRef, useState } from 'react'
import { alarm } from '../infra/alarm.ts'
import { shelf } from '../infra/shelf.ts'

export const LEADS = [10, 5, 1]

export type Alert = {
    id: string
    key: string
    line: string
    code: string
    stop: string
    name: string
    bus: number
    lead: number
}

type Ask = Omit<Alert, 'id' | 'lead'> & { title: string; body: string }

const live = (all: Alert[]) => all.filter((a) => a.bus > Date.now())

export const useAlarms = () => {
    const [all, setAll] = useState<Alert[]>(() => live(shelf.get<Alert[]>('alerts', [])))
    const [lead, setLead] = useState<number>(() => shelf.get('lead', 5))
    const [fail, setFail] = useState<string | null>(null)
    const now = useRef(all)

    const keep = (next: Alert[]) => {
        now.current = next
        shelf.set('alerts', next)
        setAll(next)
    }

    useEffect(() => {
        alarm
            .list()
            .then((ids) => keep(live(now.current).filter((a) => ids.includes(a.id))))
            .catch(() => {})
    }, [])

    const find = (key: string) => now.current.find((a) => a.key === key) ?? null

    return {
        all,
        lead,
        fail,
        find,
        ready: () => alarm.ready().catch(() => false),
        prune: () => now.current.length !== live(now.current).length && keep(live(now.current)),
        cancel: async (key: string) => {
            const a = find(key)

            if (a) {
                await alarm.cancel(a.id).catch(() => {})
                keep(now.current.filter((x) => x.key !== key))
            }
        },
        set: async (ask: Ask, min: number) => {
            if (!(await alarm.ready())) {
                setFail('Libera as notificações do passa lá? nas configurações pra receber o aviso.')
                return
            }

            setFail(null)
            const old = find(ask.key)

            if (old) {
                await alarm.cancel(old.id).catch(() => {})
            }

            const { title, body, ...rest } = ask
            const id = await alarm.set(new Date(ask.bus - min * 60000), title, body)
            keep([...now.current.filter((x) => x.key !== ask.key), { ...rest, id, lead: min }])
            setLead(min)
            shelf.set('lead', min)
        },
    }
}

export type Alarms = ReturnType<typeof useAlarms>
