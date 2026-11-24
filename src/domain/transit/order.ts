const numeric = (s: string) => s !== '' && !Number.isNaN(Number(s))

export const text = (a: string, b: string): number => {
    if (numeric(a) && numeric(b)) {
        return Number(a) - Number(b)
    }

    return a < b ? -1 : a > b ? 1 : 0
}

export const by = (a: (number | string)[], b: (number | string)[]): number => {
    for (let i = 0; i < a.length; i++) {
        const x = a[i]
        const y = b[i]
        const d = typeof x === 'number' && typeof y === 'number' ? x - y : text(String(x), String(y))

        if (d !== 0) {
            return d
        }
    }

    return 0
}
