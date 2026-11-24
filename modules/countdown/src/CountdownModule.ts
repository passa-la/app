import { requireOptionalNativeModule } from 'expo'

export type Item = { id: string; title: string; text: string; at: number }

export type Plan = { id: string; title: string; text: string; start: number; at: number }

type Native = {
    show(items: Item[]): void
    clear(): void
    plan(items: Plan[]): void
    done(): string[]
    end(id: string): void
}

export default requireOptionalNativeModule<Native>('Countdown')
