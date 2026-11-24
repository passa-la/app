import { Point } from './point.ts'

const FAST = 5
const SLOW = 2.5
const BOARD = 3
const LEAVE = 60000

export type Fix = { lat: number; lon: number; at: number; speed?: number | null }

export class Motion {
    private last: Fix | null = null
    private fast = 0
    private calm: number | null = null
    private riding = false

    push(f: Fix): boolean {
        const v = f.speed !== null && f.speed !== undefined && f.speed >= 0 ? f.speed : this.pace(f)
        this.last = f

        if (v === null) {
            return this.riding
        }

        if (v > FAST) {
            this.fast++
            this.calm = null

            if (this.fast >= BOARD) {
                this.riding = true
            }

            return this.riding
        }

        this.fast = 0

        if (v < SLOW && this.riding) {
            this.calm ??= f.at

            if (f.at - this.calm >= LEAVE) {
                this.riding = false
                this.calm = null
            }
        }

        return this.riding
    }

    private pace(f: Fix): number | null {
        if (!this.last || f.at <= this.last.at) {
            return null
        }

        return new Point(this.last.lat, this.last.lon).to(new Point(f.lat, f.lon)) / ((f.at - this.last.at) / 1000)
    }
}
