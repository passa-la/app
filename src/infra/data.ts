import { Asset } from 'expo-asset'
import { File, Paths } from 'expo-file-system'
import { Gunzip } from 'fflate'

export type Meta = { feed: string; built: string }

const NET = require('../../assets/net.bin')
const META = require('../../assets/net.json') as Meta
const REMOTE = 'https://github.com/passa-la/app/releases/download/data'
const CHUNK = 65536

const saved = new File(Paths.document, 'net.bin')

const tick = () => new Promise((ok) => setTimeout(ok, 0))

const inflate = async (gz: Uint8Array): Promise<Uint8Array> => {
    const parts: Uint8Array[] = []
    const g = new Gunzip((chunk) => parts.push(chunk))

    for (let i = 0; i < gz.length; i += CHUNK) {
        g.push(gz.subarray(i, i + CHUNK), i + CHUNK >= gz.length)
        await tick()
    }

    const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
    let at = 0

    for (const p of parts) {
        out.set(p, at)
        at += p.length
    }

    return out
}

export const data = {
    async local(stamp: Meta | null): Promise<{ bytes: Uint8Array; meta: Meta }> {
        if (stamp && saved.exists && stamp.built > META.built) {
            return { bytes: await saved.bytes(), meta: stamp }
        }

        const [a] = await Asset.loadAsync(NET)

        if (!a.localUri) {
            throw new Error('Bundled network missing')
        }

        return { bytes: await new File(a.localUri).bytes(), meta: META }
    },

    async remote(): Promise<Meta | null> {
        const r = await fetch(`${REMOTE}/net.json`)

        if (!r.ok) {
            return null
        }

        const j = (await r.json()) as Meta

        return { feed: j.feed, built: j.built }
    },

    async pull(): Promise<Uint8Array> {
        const r = await fetch(`${REMOTE}/net.bin.gz`)

        if (!r.ok) {
            throw new Error(`Download failed: ${r.status}`)
        }

        return inflate(new Uint8Array(await r.arrayBuffer()))
    },

    keep(bytes: Uint8Array): void {
        if (!saved.exists) {
            saved.create()
        }

        saved.writeSync(bytes)
    },
}
