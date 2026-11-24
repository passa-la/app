import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { gzipSync } from 'fflate'
import { Feed } from '../../src/domain/transit/feed.ts'
import { Network } from '../../src/domain/transit/network.ts'
import { Path } from '../../src/domain/transit/path.ts'
import { encode } from '../../src/data/codec.ts'
import { Reader } from './reader.ts'
import { simplify } from './simplify.ts'

const FEED = 'https://www.granderecife.pe.gov.br/gtfs/gtfs.zip'
const AGENT = 'passa-la/1.0 (+https://github.com/passa-la/app)'

const arg = (name: string, fallback: string) => {
    const i = process.argv.indexOf(`--${name}`)

    return i >= 0 ? process.argv[i + 1] : fallback
}

const fetchFeed = async (url: string, dir: string): Promise<[string, string | null]> => {
    const res = await fetch(url, { headers: { 'User-Agent': AGENT } })

    if (!res.ok) {
        throw new Error(`GTFS download failed: ${res.status}`)
    }

    const file = join(dir, 'gtfs.zip')
    await writeFile(file, new Uint8Array(await res.arrayBuffer()))

    return [file, res.headers.get('etag')]
}

const main = async () => {
    const out = arg('out', 'assets')
    const dist = arg('dist', 'dist')
    const tmp = arg('tmp', 'tmp')
    await mkdir(out, { recursive: true })
    await mkdir(dist, { recursive: true })
    await mkdir(tmp, { recursive: true })

    const start = Date.now()
    const [zip, tag] = process.argv.includes('--zip') ? [arg('zip', ''), null] : await fetchFeed(arg('url', FEED), tmp)
    const feed = await new Reader().read(zip, tag)
    const net = feed.net
    const paths = net.paths.map((p) => new Path(p.line, p.dir, p.days, simplify(p.points)))
    const slim = new Feed(feed.version, feed.tag, new Network(net.lines, net.stops, net.links, paths, net.patterns, net.runs))
    const built = new Date().toISOString()
    const raw = encode(slim, built)
    const gz = gzipSync(raw, { level: 9 })
    const hash = createHash('sha256').update(gz).digest('hex')
    const meta = { feed: feed.version, tag, built, hash, size: gz.length, lines: net.lines.length }

    await writeFile(join(out, 'net.bin'), raw)
    await writeFile(join(dist, 'net.bin.gz'), gz)
    await writeFile(join(dist, 'net.json'), JSON.stringify(meta, null, 2) + '\n')

    const mb = (n: number) => (n / 1048576).toFixed(1)
    console.log(`feed ${feed.version}: ${net.lines.length} lines, ${net.stops.length} stops, ${net.patterns.length} patterns, ${net.runs.length} runs`)
    console.log(`raw ${mb(raw.length)} MB, gzip ${mb(gz.length)} MB, ${((Date.now() - start) / 1000).toFixed(1)} s, peak ${mb(process.memoryUsage().rss)} MB rss`)
}

await main()
