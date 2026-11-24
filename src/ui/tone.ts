export type Tone = {
    paper: string
    card: string
    fg: string
    mute: string
    edge: string
    sun: string
    sunInk: string
    back: string
    alert: string
}

export const light: Tone = {
    paper: '#f6f3ea',
    card: '#ffffff',
    fg: '#17150f',
    mute: '#6d685b',
    edge: '#e4dfd1',
    sun: '#ffc21a',
    sunInk: '#1d1600',
    back: '#7c3aed',
    alert: '#b42318',
}

export const dark: Tone = {
    ...light,
    paper: '#12110d',
    card: '#1c1a15',
    fg: '#f3efe3',
    mute: '#a8a292',
    edge: '#2e2b23',
    alert: '#ff8a7a',
}
