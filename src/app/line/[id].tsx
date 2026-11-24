import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Day } from '../../domain/transit/day.ts'
import { Moment } from '../../domain/transit/moment.ts'
import type { Stop } from '../../domain/transit/stop.ts'
import { Button } from '../../ui/button.tsx'
import { Code } from '../../ui/code.tsx'
import { clock, DAYS, hours, label, wait } from '../../ui/format.ts'
import { useNet } from '../../ui/net.tsx'
import { LineMap } from '../../ui/map/line.tsx'
import { useTone } from '../../ui/theme.ts'

const TICK = 30000

const named = (s: Stop) => s.name || `Parada ${s.id}`

export default function LineScreen() {
    const { id } = useLocalSearchParams<{ id: string }>()
    const t = useTone()
    const { kit } = useNet()
    const [day, setDay] = useState<Day>(() => Day.of(new Date()))
    const [stop, setStop] = useState<string | null>(null)
    const [end, setEnd] = useState<string | null>(null)
    const [focus, setFocus] = useState<number | null>(null)
    const [table, setTable] = useState(false)
    const [now, setNow] = useState(() => Date.now())

    useEffect(() => {
        const i = setInterval(() => setNow(Date.now()), TICK)

        return () => clearInterval(i)
    }, [])

    const d = useMemo(() => kit?.show.run(id, day, Moment.of(new Date(now)), { stop, end }) ?? null, [kit, id, day, now, stop, end])

    if (!kit || !d) {
        return (
            <SafeAreaView style={[s.page, s.center, { backgroundColor: t.paper }]}>
                <Text style={{ color: t.mute }}>{kit ? 'Linha não encontrada.' : 'Abrindo a linha…'}</Text>
            </SafeAreaView>
        )
    }

    const dir = focus ?? d.plan.best ?? d.ways[0]?.dir ?? 0
    const way = d.ways.find((w) => w.dir === dir) ?? d.ways[0] ?? null
    const leg = way ? d.plan.legs.find((l) => l.dir === way.dir) : undefined
    const tab = way ? d.tables.get(way.dir) : undefined
    const soon = tab?.next ?? null
    const first = soon?.[0]
    const when = DAYS[day].when

    const tap = (sid: string) => {
        if (stop && !end && sid !== stop) {
            setEnd(sid)
        } else {
            setStop(sid)
            setEnd(null)
        }

        setFocus(null)
    }

    const pick = (k: Day) => {
        setDay(k)
        setStop(null)
        setEnd(null)
        setFocus(null)
    }

    const ride = tab?.ride()
    const arrive = ride && first?.end ? `Próximo chega ~${clock(first.end)} · ${ride} min de ônibus` : ride ? `~${ride} min de ônibus` : ''

    return (
        <SafeAreaView style={[s.page, { backgroundColor: t.paper }]}>
            <View style={s.map}>
                <LineMap ways={d.ways} focus={way?.dir ?? null} board={leg?.board?.stop ?? null} drop={end ? (leg?.drop?.stop ?? null) : null} onStop={tap} />
            </View>
            <ScrollView contentContainerStyle={s.body}>
                <View style={s.head}>
                    <Button variant="ghost" label="Voltar" onPress={() => router.back()}>
                        <Text style={[s.back, { color: t.fg }]}>‹</Text>
                    </Button>
                    <Code code={d.line.code} big />
                    <View style={s.title}>
                        <Text style={[s.name, { color: t.fg }]}>{d.line.name}</Text>
                        <Text style={[s.small, { color: t.mute }]}>{d.line.agency}</Text>
                    </View>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
                    {Day.all.map((k) => (
                        <Button key={k} variant="chip" on={day === k} onPress={() => pick(k)}>
                            <Text style={[s.chip, { color: day === k ? t.paper : t.fg }, !d.line.runs(k) && s.strike]}>{DAYS[k].name}</Text>
                            {k === Day.of(new Date(now)) && <Text style={[s.tiny, { color: day === k ? t.paper : t.mute }]}>hoje</Text>}
                        </Button>
                    ))}
                </ScrollView>

                {!d.ways.length && <Text style={[s.dash, { color: t.mute, borderColor: t.edge }]}>Essa linha não roda {when}. Escolhe outro dia.</Text>}

                {d.ways.length > 1 && (
                    <View style={s.chips}>
                        {d.ways.map((w) => (
                            <Button key={w.dir} variant="chip" on={w.dir === way?.dir} onPress={() => setFocus(w.dir)}>
                                <View style={[s.bar, { backgroundColor: w.dir === 1 ? t.back : t.sun }]} />
                                <Text style={[s.chip, { color: w.dir === way?.dir ? t.paper : t.fg }]}>{label(w.dir)}</Text>
                            </Button>
                        ))}
                    </View>
                )}

                {d.ways.length > 0 && !leg?.board && (
                    <Text style={[s.dash, { color: t.mute, borderColor: t.edge }]}>Toca numa parada no mapa ou na lista pra ver a que horas o ônibus passa nela.</Text>
                )}

                {leg?.board && (
                    <View style={[s.card, { backgroundColor: t.card, borderColor: t.edge }]}>
                        <Text style={[s.over, { color: t.mute }]}>ONDE PEGAR · {label(leg.dir).toUpperCase()}</Text>
                        <Text style={[s.stop, { color: t.fg }]}>{named(leg.board.stop)}</Text>

                        {d.ways.length > 1 && leg.drop && !leg.fits() && (
                            <Text style={[s.warn, { color: t.alert }]}>
                                Nesse sentido o ônibus passa por onde você desce antes de onde você pega. Dá uma olhada no outro sentido.
                            </Text>
                        )}

                        {tab && (
                            <View style={[s.times, { borderColor: t.edge }]}>
                                {soon && (
                                    <>
                                        <Text style={[s.over, { color: t.mute }]}>PRÓXIMOS ÔNIBUS · PREVISTO</Text>
                                        {!soon.length && tab.all.length > 0 && (
                                            <Text style={[s.small, { color: t.mute }]}>Nenhum ônibus passa mais hoje nessa parada.</Text>
                                        )}
                                        {soon.map((b, i) => (
                                            <View key={i} style={s.next}>
                                                <Text style={{ color: t.fg }}>
                                                    <Text style={s.at}>{clock(b.at)}</Text>
                                                    {b.end !== null && <Text style={{ color: t.mute }}>{`  → chega ${clock(b.end)}`}</Text>}
                                                </Text>
                                                <Text style={[s.small, { color: t.mute }]}>{wait(tab.wait(b))}</Text>
                                            </View>
                                        ))}
                                    </>
                                )}

                                {!tab.all.length && <Text style={[s.small, { color: t.mute }]}>Nenhum ônibus sai dessa parada {when}.</Text>}

                                {tab.all.length > 0 && (
                                    <Button variant="ghost" onPress={() => setTable(!table)} style={s.left}>
                                        <Text style={[s.small, { color: t.mute }]}>{table ? 'Esconder os horários' : `Todos os horários ${when}`}</Text>
                                    </Button>
                                )}

                                {table &&
                                    hours(tab.all.map((b) => b.at)).map((g, i) => (
                                        <View key={i} style={s.hour}>
                                            <Text style={[s.h, { color: t.fg }]}>{g.h}</Text>
                                            <Text style={[s.mins, { color: t.mute }]}>{g.m.join('   ')}</Text>
                                        </View>
                                    ))}
                            </View>
                        )}

                        <Text style={[s.tiny, { color: t.mute }]}>
                            {end ? 'Toca em outra parada pra escolher outro embarque.' : 'Toca na parada onde vai descer pra ver a que horas chega.'}
                        </Text>
                    </View>
                )}

                {leg?.drop && end && (
                    <View style={[s.card, { backgroundColor: t.card, borderColor: t.edge }]}>
                        <Text style={[s.over, { color: t.mute }]}>ONDE DESCER · {label(leg.dir).toUpperCase()}</Text>
                        <Text style={[s.stop, { color: t.fg }]}>{named(leg.drop.stop)}</Text>
                        {arrive !== '' && <Text style={[s.small, { color: t.mute }]}>{arrive}</Text>}
                        <Button variant="ghost" onPress={() => setEnd(null)} style={s.left}>
                            <Text style={[s.small, { color: t.mute }]}>Tirar essa parada</Text>
                        </Button>
                    </View>
                )}

                {way && (
                    <View>
                        <Text style={[s.over, { color: t.mute }]}>
                            PARADAS · {label(way.dir).toUpperCase()} · {way.stops.length}
                        </Text>
                        {way.stops.map((st, i) => {
                            const a = leg?.board?.stop.id === st.id && leg.board.seq === i
                            const b = leg?.drop?.stop.id === st.id && leg.drop.seq === i && end !== null

                            return (
                                <Button key={`${st.id}-${i}`} variant="row" onPress={() => tap(st.id)} style={s.row}>
                                    <View
                                        style={[
                                            s.dot,
                                            { borderColor: t.fg, backgroundColor: t.card },
                                            a && { borderWidth: 4 },
                                            b && { backgroundColor: t.fg, borderColor: t.sun, borderWidth: 4 },
                                        ]}
                                    />
                                    <Text style={[s.stopRow, { color: a || b ? t.fg : t.mute }, (a || b) && s.bold]} numberOfLines={1}>
                                        {named(st)}
                                    </Text>
                                </Button>
                            )
                        })}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    )
}

const s = StyleSheet.create({
    page: { flex: 1 },
    map: { height: '42%' },
    center: { alignItems: 'center', justifyContent: 'center' },
    body: { padding: 16, gap: 14 },
    head: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    back: { fontSize: 28, lineHeight: 30 },
    title: { flex: 1, gap: 2 },
    name: { fontSize: 20, fontWeight: '600' },
    small: { fontSize: 14 },
    tiny: { fontSize: 12 },
    chips: { flexDirection: 'row', gap: 8 },
    chip: { fontSize: 14 },
    strike: { textDecorationLine: 'line-through', opacity: 0.6 },
    bar: { width: 20, height: 6, borderRadius: 3 },
    dash: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 16, padding: 16, fontSize: 14 },
    card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 6 },
    over: { fontSize: 12, fontWeight: '500', letterSpacing: 0.6 },
    stop: { fontSize: 16, fontWeight: '600' },
    warn: { fontSize: 14 },
    times: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 6, paddingTop: 10, gap: 6 },
    next: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    at: { fontSize: 20, fontWeight: '700', fontVariant: ['tabular-nums'] },
    left: { alignSelf: 'flex-start', marginLeft: -12 },
    hour: { flexDirection: 'row', gap: 14 },
    h: { width: 24, fontWeight: '600', fontVariant: ['tabular-nums'] },
    mins: { flex: 1, fontVariant: ['tabular-nums'] },
    row: { paddingVertical: 9 },
    dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
    stopRow: { flex: 1, fontSize: 15 },
    bold: { fontWeight: '600' },
})
