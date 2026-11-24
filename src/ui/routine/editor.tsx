import { useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { type Routine, WEEK } from '../../domain/routine/routine.ts'
import type { Day } from '../../domain/transit/day.ts'
import type { Stop } from '../../domain/transit/stop.ts'
import type { Way } from '../../domain/transit/way.ts'
import { Button } from '../button.tsx'
import { Code } from '../code.tsx'
import { label } from '../format.ts'
import type { Kit } from '../net.tsx'
import { useTone } from '../theme.ts'

export type Seed = {
    id?: string | null
    line?: string | null
    dir?: number | null
    stop?: string | null
    end?: string | null
    time?: number | null
    days?: number[] | null
    on?: boolean
}

const DAYS: Day[] = ['weekday', 'saturday', 'sunday']
const SHORT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const LONG = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const PRESETS: [string, number[]][] = [
    ['Todo dia', WEEK.all],
    ['Seg a sex', WEEK.work],
    ['Fim de semana', WEEK.rest],
]

const named = (s: Stop) => s.name || `Parada ${s.id}`

const same = (a: number[], b: number[]) => a.length === b.length && a.every((x) => b.includes(x))

const typed = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 4)

    return d.length > 2 ? `${d.slice(0, 2)}:${d.slice(2)}` : d
}

const minutes = (v: string) => {
    const m = /^(\d{2}):(\d{2})$/.exec(v)

    return m && Number(m[1]) < 24 && Number(m[2]) < 60 ? Number(m[1]) * 60 + Number(m[2]) : null
}

const two = (n: number) => String(n).padStart(2, '0')

type Props = {
    kit: Kit
    seed: Seed
    edit: Routine | null
    onSave: (r: Routine) => void
    onCancel: () => void
    onMap: (seed: Seed) => void
}

export function Editor({ kit, seed, edit, onSave, onCancel, onMap }: Props) {
    const t = useTone()
    const [line, setLine] = useState<string | null>(edit?.line ?? seed.line ?? null)
    const [q, setQ] = useState('')
    const [dir, setDir] = useState<number | null>(edit?.dir ?? seed.dir ?? null)
    const [stop, setStop] = useState<string | null>(edit?.stop ?? seed.stop ?? null)
    const [end, setEnd] = useState<string | null>(edit?.end ?? seed.end ?? null)
    const first = edit?.time ?? seed.time ?? null
    const [time, setTime] = useState(first !== null ? `${two(Math.floor(first / 60))}:${two(first % 60)}` : '')
    const [days, setDays] = useState<number[]>(edit?.days ?? seed.days ?? WEEK.work)

    const info = line ? kit.net.find(line) : null
    const ways = useMemo<Way[]>(() => {
        for (const d of DAYS) {
            const w = line ? kit.net.ways(line, d) : []

            if (w.length) {
                return w
            }
        }

        return []
    }, [kit, line])
    const way = ways.find((w) => w.dir === dir) ?? ways.find((w) => w.stops.some((s) => s.id === stop)) ?? ways[0] ?? null
    const from = way?.stops.findIndex((s) => s.id === stop) ?? -1
    const board = from >= 0 ? way?.stops[from] : undefined
    const drop = way?.stops.find((s, i) => i > from && s.id === end)
    const at = minutes(time)
    const ready = info && way && board && drop && at !== null && days.length > 0
    const found = q.trim() ? kit.find.run(q).slice(0, 6) : []

    const pickLine = (id: string) => {
        setLine(id)
        setDir(null)
        setStop(null)
        setEnd(null)
        setQ('')
    }

    const save = () => {
        if (!ready) {
            return
        }

        onSave({
            id: edit?.id ?? seed.id ?? Date.now().toString(36),
            line: info.id,
            code: info.code,
            name: info.name,
            dir: way.dir,
            stop: board.id,
            end: drop.id,
            from: named(board),
            to: named(drop),
            time: at,
            days: [...days].sort(),
            on: edit?.on ?? seed.on ?? true,
        })
    }

    const map = () =>
        line &&
        onMap({
            id: edit?.id ?? seed.id ?? null,
            line,
            dir: way?.dir ?? null,
            time: at,
            days,
            on: edit?.on ?? seed.on ?? true,
        })

    return (
        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            <Text style={[s.over, { color: t.mute }]}>LINHA</Text>
            {info ? (
                <View style={s.row}>
                    <Code code={info.code} />
                    <Text style={[s.name, { color: t.fg }]} numberOfLines={2}>
                        {info.name}
                    </Text>
                    <Button variant="ghost" onPress={() => setLine(null)}>
                        <Text style={[s.small, { color: t.mute }]}>Trocar</Text>
                    </Button>
                </View>
            ) : (
                <>
                    <TextInput
                        value={q}
                        onChangeText={setQ}
                        placeholder="Número ou nome da linha"
                        placeholderTextColor={t.mute}
                        autoCorrect={false}
                        style={[s.field, { color: t.fg, borderColor: t.edge, backgroundColor: t.card }]}
                    />
                    {found.map((l) => (
                        <Button key={l.id} variant="row" onPress={() => pickLine(l.id)}>
                            <Code code={l.code} />
                            <Text style={[s.name, { color: t.fg }]} numberOfLines={1}>
                                {l.name}
                            </Text>
                        </Button>
                    ))}
                </>
            )}

            {ways.length > 1 && (
                <View style={s.row}>
                    {ways.map((w) => (
                        <Button
                            key={w.dir}
                            variant="chip"
                            on={w.dir === way?.dir}
                            onPress={() => {
                                setDir(w.dir)
                                setStop(null)
                                setEnd(null)
                            }}
                        >
                            <View style={[s.bar, { backgroundColor: w.dir === 1 ? t.back : t.sun }]} />
                            <Text style={[s.small, { color: w.dir === way?.dir ? t.paper : t.fg }]}>{label(w.dir)}</Text>
                        </Button>
                    ))}
                </View>
            )}

            {way && (
                <View style={[s.stops, { borderColor: t.edge, backgroundColor: t.card }]}>
                    <View style={s.row}>
                        <View style={[s.dot, { borderColor: t.fg, backgroundColor: '#ffffff' }]} />
                        <Text style={[s.small, s.grow, { color: board ? t.fg : t.mute }]} numberOfLines={1}>
                            {board ? named(board) : 'Onde você pega'}
                        </Text>
                    </View>
                    <View style={s.row}>
                        <View style={[s.dot, { borderColor: t.sun, backgroundColor: t.fg }]} />
                        <Text style={[s.small, s.grow, { color: drop ? t.fg : t.mute }]} numberOfLines={1}>
                            {drop ? named(drop) : 'Onde você desce'}
                        </Text>
                    </View>
                    <Button variant={board && drop ? 'ghost' : 'plain'} onPress={map} style={s.left}>
                        <Text style={[s.small, { color: board && drop ? t.mute : t.sunInk, fontWeight: board && drop ? '400' : '600' }]}>
                            {board && drop ? 'Trocar no mapa' : 'Marcar no mapa'}
                        </Text>
                    </Button>
                </View>
            )}

            <Text style={[s.over, { color: t.mute }]}>HORÁRIO</Text>
            <TextInput
                value={time}
                onChangeText={(v) => setTime(typed(v))}
                placeholder="07:00"
                placeholderTextColor={t.mute}
                keyboardType="number-pad"
                maxLength={5}
                style={[s.field, s.time, { color: t.fg, borderColor: at === null && time.length === 5 ? t.alert : t.edge, backgroundColor: t.card }]}
            />

            <Text style={[s.over, { color: t.mute }]}>DIAS</Text>
            <View style={s.row}>
                {PRESETS.map(([name, set]) => (
                    <Button key={name} variant="chip" on={same(days, set)} onPress={() => setDays(set)}>
                        <Text style={[s.small, { color: same(days, set) ? t.paper : t.fg }]}>{name}</Text>
                    </Button>
                ))}
            </View>
            <View style={s.row}>
                {SHORT.map((d, i) => (
                    <Button
                        key={i}
                        variant="chip"
                        label={LONG[i]}
                        on={days.includes(i)}
                        onPress={() => setDays(days.includes(i) ? days.filter((x) => x !== i) : [...days, i])}
                        style={s.day}
                    >
                        <Text style={[s.small, { color: days.includes(i) ? t.paper : t.fg }]}>{d}</Text>
                    </Button>
                ))}
            </View>

            <View style={[s.row, s.end]}>
                <Button variant="ghost" onPress={onCancel}>
                    <Text style={[s.small, { color: t.mute }]}>Cancelar</Text>
                </Button>
                <Button disabled={!ready} onPress={save}>
                    <Text style={[s.small, { color: t.sunInk, fontWeight: '600' }]}>Salvar rotina</Text>
                </Button>
            </View>
        </ScrollView>
    )
}

const s = StyleSheet.create({
    body: { gap: 10, paddingBottom: 12 },
    over: { fontSize: 12, fontWeight: '500', letterSpacing: 0.6, marginTop: 4 },
    row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
    end: { justifyContent: 'flex-end', marginTop: 8 },
    name: { flex: 1, fontSize: 15 },
    small: { fontSize: 14 },
    field: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16 },
    time: { width: 110, fontVariant: ['tabular-nums'] },
    stops: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 10 },
    dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 3 },
    grow: { flex: 1 },
    left: { alignSelf: 'flex-start' },
    bar: { width: 18, height: 6, borderRadius: 3 },
    day: { minWidth: 40, justifyContent: 'center' },
})
