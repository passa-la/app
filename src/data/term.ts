const FROM = 'áàâãäåéèêëíìîïóòôõöúùûüçñýÿ'
const TO = 'aaaaaaeeeeiiiiooooouuuucnyy'

export const term = (s: string): string =>
    [...s.toLowerCase()]
        .map((c) => {
            const i = FROM.indexOf(c)

            return i >= 0 ? TO[i] : c
        })
        .join('')
        .replace(/\s+/g, ' ')
        .trim()
