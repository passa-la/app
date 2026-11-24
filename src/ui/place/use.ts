import { useEffect, useState } from 'react'
import type { Place } from '../../domain/geo/place.ts'
import type { Kit } from '../net.tsx'

const WAIT = 300

export const usePlaces = (kit: Kit | null, q: string) => {
    const [list, setList] = useState<Place[]>([])
    const [busy, setBusy] = useState(false)
    const [fail, setFail] = useState(false)

    useEffect(() => {
        if (!kit || q.trim().length < 3) {
            setList([])
            setBusy(false)
            return
        }

        let live = true
        setBusy(true)

        const timer = setTimeout(() => {
            kit.lookup
                .run(q)
                .then((found) => live && (setList(found), setFail(false)))
                .catch(() => live && (setList([]), setFail(true)))
                .finally(() => live && setBusy(false))
        }, WAIT)

        return () => {
            live = false
            clearTimeout(timer)
        }
    }, [kit, q])

    return { list, busy, fail }
}
