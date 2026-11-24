import type { Network } from './network.ts'

export class Feed {
    readonly version: string
    readonly tag: string | null
    readonly net: Network

    constructor(version: string, tag: string | null, net: Network) {
        this.version = version
        this.tag = tag
        this.net = net
    }
}
