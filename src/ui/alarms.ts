import { useState } from 'react'
import { alarm } from '../infra/alarm.ts'

export const useAlarms = () => {
    const [on, setOn] = useState<Record<string, string>>({})
    const [fail, setFail] = useState<string | null>(null)

    return {
        fail,
        has: (k: string) => k in on,
        toggle: async (k: string, at: Date, title: string, body: string) => {
            const id = on[k]

            if (id) {
                await alarm.cancel(id)
                setOn(({ [k]: _, ...rest }) => rest)
                return
            }

            if (!(await alarm.ready())) {
                setFail('Libera as notificações do passa lá? nas configurações pra receber o aviso.')
                return
            }

            setFail(null)
            const made = await alarm.set(at, title, body)
            setOn((all) => ({ ...all, [k]: made }))
        },
    }
}

export type Alarms = ReturnType<typeof useAlarms>
