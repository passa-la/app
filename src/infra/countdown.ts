import native, { type Item, type Plan } from '../../modules/countdown/src/CountdownModule.ts'

export const countdown = {
    show(items: Item[]): void {
        native?.show(items)
    },

    clear(): void {
        native?.clear()
    },

    plan(items: Plan[]): void {
        native?.plan(items)
    },

    done(): string[] {
        return native?.done() ?? []
    },

    end(id: string): void {
        native?.end(id)
    },
}
