import { createReadStream } from 'node:fs'
import { Unzip, UnzipInflate } from 'fflate'

export async function* lines(file: string, name: string): AsyncGenerator<string[]> {
    const out: string[] = []
    const dec = new TextDecoder()
    let rest = ''
    let fail: Error | null = null

    const unzip = new Unzip((f) => {
        if (f.name !== name) {
            return
        }

        f.ondata = (err, chunk, final) => {
            if (err) {
                fail = err
                return
            }

            const parts = (rest + dec.decode(chunk, { stream: !final })).split(/\r?\n/)
            rest = final ? '' : (parts.pop() ?? '')

            for (const p of parts) {
                out.push(p)
            }
        }

        f.start()
    })

    unzip.register(UnzipInflate)

    for await (const chunk of createReadStream(file)) {
        unzip.push(chunk as Uint8Array)

        if (fail) {
            throw fail
        }

        if (out.length) {
            yield out.splice(0)
        }
    }

    unzip.push(new Uint8Array(0), true)

    if (out.length) {
        yield out.splice(0)
    }
}
