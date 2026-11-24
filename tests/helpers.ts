import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { zipSync } from 'fflate'
import { decode, encode } from '../src/data/codec.ts'
import { Net } from '../src/data/net.ts'
import { Reader } from '../tools/gtfs/reader.ts'

const DIR = join(import.meta.dirname, 'fixtures/gtfs')

export const zip = (swap: Record<string, string> = {}): string => {
    const files: Record<string, Uint8Array> = {}

    for (const f of readdirSync(DIR)) {
        files[f] = readFileSync(join(DIR, f))
    }

    for (const [f, text] of Object.entries(swap)) {
        files[f] = new TextEncoder().encode(text)
    }

    const file = join(tmpdir(), `passa-gtfs-${process.pid}-${Object.keys(swap).length}.zip`)
    writeFileSync(file, zipSync(files))

    return file
}

export const feed = () => new Reader().read(zip(), '"tag"', '20261123')

export const net = async () => new Net(decode(encode(await feed(), '2026-11-23T00:00:00Z')))

