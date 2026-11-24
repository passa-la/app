import { File, Paths } from 'expo-file-system'

const file = new File(Paths.document, 'passa-la.json')

let data: Record<string, unknown> | null = null

const load = (): Record<string, unknown> => {
    if (data) {
        return data
    }

    try {
        data = file.exists ? (JSON.parse(file.textSync()) as Record<string, unknown>) : {}
    } catch {
        data = {}
    }

    return data
}

export const shelf = {
    get<T>(key: string, fallback: T): T {
        return (load()[key] as T | undefined) ?? fallback
    },

    set(key: string, value: unknown): void {
        const all = load()
        all[key] = value

        if (!file.exists) {
            file.create()
        }

        file.writeSync(JSON.stringify(all))
    },
}
