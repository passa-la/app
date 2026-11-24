import { createContext, type ReactNode, useContext, useEffect, useState } from 'react'
import { Find } from '../cases/find.ts'
import { Search } from '../cases/search.ts'
import { Show } from '../cases/show.ts'
import { Trip } from '../cases/trip.ts'
import { decode } from '../data/codec.ts'
import { Net } from '../data/net.ts'
import { Direct } from '../domain/transit/direct.ts'
import { Nearby } from '../domain/transit/nearby.ts'
import { Timetable } from '../domain/transit/timetable.ts'
import { bundled } from '../infra/bundle.ts'

export type Kit = {
    net: Net
    find: Find
    search: Search
    show: Show
    trip: Trip
    ms: number
}

type State = { kit: Kit | null; fail: string | null }

const Ctx = createContext<State>({ kit: null, fail: null })

const build = (net: Net, ms: number): Kit => ({
    net,
    find: new Find(net),
    search: new Search(new Nearby(net)),
    show: new Show(net, new Timetable(net)),
    trip: new Trip(new Direct(net)),
    ms,
})

export function NetProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<State>({ kit: null, fail: null })

    useEffect(() => {
        const start = Date.now()

        bundled()
            .then((bytes) => setState({ kit: build(new Net(decode(bytes)), Date.now() - start), fail: null }))
            .catch((e: Error) => setState({ kit: null, fail: e.message }))
    }, [])

    return <Ctx.Provider value={state}>{children}</Ctx.Provider>
}

export const useNet = () => useContext(Ctx)
