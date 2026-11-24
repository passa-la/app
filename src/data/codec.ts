import { strFromU8, strToU8 } from 'fflate'
import type { Feed } from '../domain/transit/feed.ts'
import { Mask } from './mask.ts'

const MAGIC = 0x414c5350
const VERSION = 1
const NONE = 0xffff
const E6 = 1e6

type Kind = 'u8' | 'u16' | 'u32' | 'i32'

type Typed = Uint8Array | Uint16Array | Uint32Array | Int32Array

export type Head = {
    feed: string
    tag: string | null
    built: string
    lines: [string, string, string, string, number][]
    stops: [string, string][]
    parts: Record<string, [number, number, Kind]>
}

export type Pack = {
    head: Head
    stopLat: Int32Array
    stopLon: Int32Array
    linkLine: Uint16Array
    linkDir: Uint8Array
    linkSeq: Uint16Array
    linkStop: Uint16Array
    linkDays: Uint8Array
    pathLine: Uint16Array
    pathDir: Uint8Array
    pathDays: Uint8Array
    pathStart: Uint32Array
    pathCoords: Int32Array
    patLine: Uint16Array
    patDir: Uint8Array
    patStart: Uint32Array
    patStops: Uint16Array
    runPat: Uint16Array
    runDays: Uint8Array
    runStart: Uint32Array
    runTimes: Uint16Array
}

const KINDS: Record<Kind, { new (b: ArrayBuffer, o: number, n: number): Typed; BYTES_PER_ELEMENT: number }> = {
    u8: Uint8Array,
    u16: Uint16Array,
    u32: Uint32Array,
    i32: Int32Array,
}

const kind = (a: Typed): Kind =>
    a instanceof Uint8Array ? 'u8' : a instanceof Uint16Array ? 'u16' : a instanceof Uint32Array ? 'u32' : 'i32'

const pad = (n: number) => (n + 3) & ~3

const e6 = (v: number) => Math.round(v * E6)

export const NO_STOP = NONE

export const encode = (feed: Feed, built: string): Uint8Array => {
    const net = feed.net
    const lineIx = new Map(net.lines.map((l, i) => [l.id, i]))
    const stopIx = new Map(net.stops.map((s, i) => [s.id, i]))

    if (net.stops.length >= NONE || net.lines.length >= NONE || net.patterns.length >= NONE) {
        throw new RangeError('Network too large for 16-bit indexes')
    }

    const links = net.links.filter((l) => lineIx.has(l.line) && stopIx.has(l.stop))
    const paths = net.paths.filter((p) => lineIx.has(p.line))
    const patIx = new Map(net.patterns.map((p, i) => [p.id, i]))
    const runs = net.runs.filter((r) => patIx.has(r.pattern))

    const pathStart = new Uint32Array(paths.length + 1)
    paths.forEach((p, i) => (pathStart[i + 1] = pathStart[i] + p.points.length * 2))
    const pathCoords = new Int32Array(pathStart[paths.length])
    paths.forEach((p, i) => p.points.forEach((pt, k) => pathCoords.set([e6(pt.lat), e6(pt.lon)], pathStart[i] + k * 2)))

    const patStart = new Uint32Array(net.patterns.length + 1)
    net.patterns.forEach((p, i) => (patStart[i + 1] = patStart[i] + p.stops.length))
    const patStops = new Uint16Array(patStart[net.patterns.length])
    net.patterns.forEach((p, i) => p.stops.forEach((s, k) => (patStops[patStart[i] + k] = stopIx.get(s) ?? NONE)))

    const runStart = new Uint32Array(runs.length + 1)
    runs.forEach((r, i) => (runStart[i + 1] = runStart[i] + r.times.length))
    const runTimes = new Uint16Array(runStart[runs.length])
    runs.forEach((r, i) => r.times.forEach((t, k) => (runTimes[runStart[i] + k] = Math.floor(t / 60))))

    const parts: [string, Typed][] = [
        ['stopLat', Int32Array.from(net.stops, (s) => e6(s.point.lat))],
        ['stopLon', Int32Array.from(net.stops, (s) => e6(s.point.lon))],
        ['linkLine', Uint16Array.from(links, (l) => lineIx.get(l.line) ?? 0)],
        ['linkDir', Uint8Array.from(links, (l) => l.dir)],
        ['linkSeq', Uint16Array.from(links, (l) => l.seq)],
        ['linkStop', Uint16Array.from(links, (l) => stopIx.get(l.stop) ?? 0)],
        ['linkDays', Uint8Array.from(links, (l) => Mask.of(l.days))],
        ['pathLine', Uint16Array.from(paths, (p) => lineIx.get(p.line) ?? 0)],
        ['pathDir', Uint8Array.from(paths, (p) => p.dir)],
        ['pathDays', Uint8Array.from(paths, (p) => Mask.of(p.days))],
        ['pathStart', pathStart],
        ['pathCoords', pathCoords],
        ['patLine', Uint16Array.from(net.patterns, (p) => lineIx.get(p.line) ?? 0)],
        ['patDir', Uint8Array.from(net.patterns, (p) => p.dir)],
        ['patStart', patStart],
        ['patStops', patStops],
        ['runPat', Uint16Array.from(runs, (r) => patIx.get(r.pattern) ?? 0)],
        ['runDays', Uint8Array.from(runs, (r) => Mask.of(r.days))],
        ['runStart', runStart],
        ['runTimes', runTimes],
    ]

    const layout: Record<string, [number, number, Kind]> = {}
    let size = 0

    for (const [name, a] of parts) {
        layout[name] = [size, a.length, kind(a)]
        size += pad(a.byteLength)
    }

    const head: Head = {
        feed: feed.version,
        tag: feed.tag,
        built,
        lines: net.lines.map((l) => [l.id, l.code, l.name, l.agency, Mask.of(l.days)]),
        stops: net.stops.map((s) => [s.id, s.name]),
        parts: layout,
    }

    const json = strToU8(JSON.stringify(head))
    const base = pad(12 + json.length)
    const out = new Uint8Array(base + size)
    const view = new DataView(out.buffer)

    view.setUint32(0, MAGIC, true)
    view.setUint32(4, VERSION, true)
    view.setUint32(8, json.length, true)
    out.set(json, 12)

    for (const [name, a] of parts) {
        out.set(new Uint8Array(a.buffer, a.byteOffset, a.byteLength), base + layout[name][0])
    }

    return out
}

export const decode = (raw: Uint8Array): Pack => {
    const bytes = raw.byteOffset % 4 ? raw.slice() : raw
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)

    if (view.getUint32(0, true) !== MAGIC) {
        throw new Error('Not a passa-la network file')
    }

    if (view.getUint32(4, true) !== VERSION) {
        throw new Error(`Unsupported network file version ${view.getUint32(4, true)}`)
    }

    const len = view.getUint32(8, true)
    const head = JSON.parse(strFromU8(bytes.subarray(12, 12 + len))) as Head
    const base = bytes.byteOffset + pad(12 + len)
    const pack: Record<string, unknown> = { head }

    for (const [name, [off, n, k]] of Object.entries(head.parts)) {
        pack[name] = new KINDS[k](bytes.buffer as ArrayBuffer, base + off, n)
    }

    return pack as Pack
}
