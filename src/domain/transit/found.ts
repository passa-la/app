import type { Pass } from './pass.ts'

export class Found {
    readonly passes: Pass[]
    readonly wide: boolean

    constructor(passes: Pass[], wide = false) {
        this.passes = passes
        this.wide = wide
    }
}
