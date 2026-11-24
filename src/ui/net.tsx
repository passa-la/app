import { createContext, type ReactNode, useContext, useEffect, useState } from 'react'
import { Find } from '../cases/find.ts'
import { Lookup } from '../cases/lookup.ts'
import { Search } from '../cases/search.ts'
import { Show } from '../cases/show.ts'
import { Trip } from '../cases/trip.ts'
import { decode } from '../data/codec.ts'
import { Net } from '../data/net.ts'
import { Direct } from '../domain/transit/direct.ts'
import { Nearby } from '../domain/transit/nearby.ts'
import { Timetable } from '../domain/transit/timetable.ts'
import { area } from '../infra/area.ts'
import { data, type Meta } from '../infra/data.ts'
import { Photon } from '../infra/photon.ts'
import { shelf } from '../infra/shelf.ts'

export type Kit = {
    net: Net
    find: Find
    lookup: Lookup
    search: Search
    show: Show
    trip: Trip
    ms: number
}

type State = { kit: Kit | null; fail: string | null }

const DAY = 86400000

const Ctx = createContext<State>({ kit: null, fail: null })

const build = (net: Net, ms: number): Kit => ({
    net,
    find: new Find(net),
    lookup: new Lookup(new Photon(), area),
    search: new Search(new Nearby(net)),
    show: new Show(net, new Timetable(net)),
    trip: new Trip(new Direct(net)),
    ms,
})

export function NetProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<State>({ kit: null, fail: null })

    useEffect(() => {
        let live = true
        const start = Date.now()

        const fresh = async (meta: Meta) => {
            if (Date.now() - shelf.get('checked', 0) < DAY) {
                return
            }

            const remote = await data.remote()
            shelf.set('checked', Date.now())

            if (!remote || remote.built <= meta.built) {
                return
            }

            const bytes = await data.pull()
            const net = new Net(decode(bytes))
            data.keep(bytes)
            shelf.set('net', remote)

            if (live) {
                setState({ kit: build(net, 0), fail: null })
            }
        }

        data.local(shelf.get<Meta | null>('net', null))
            .then(({ bytes, meta }) => {
                if (!live) {
                    return
                }

                setState({ kit: build(new Net(decode(bytes)), Date.now() - start), fail: null })
                fresh(meta).catch(() => {})
            })
            .catch((e: Error) => live && setState({ kit: null, fail: e.message }))

        return () => {
            live = false
        }
    }, [])

    return <Ctx.Provider value={state}>{children}</Ctx.Provider>
}

export const useNet = () => useContext(Ctx)
