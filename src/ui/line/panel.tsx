import { ScrollView, StyleSheet, Text, View } from 'react-native'
import type { Place } from '../../domain/geo/place.ts'
import type { Stop } from '../../domain/transit/stop.ts'
import { Button } from '../button.tsx'
import { Chips, meters } from '../chips.tsx'
import { Code } from '../code.tsx'
import { clock, DAYS, hours, label, wait } from '../format.ts'
import { useTone } from '../theme.ts'
import type { LineState } from './use.ts'

const named = (s: Stop) => s.name || `Parada ${s.id}`

const PACE = 75

export function LinePanel({ state, dest = null, onClose }: { state: LineState; dest?: Place | null; onClose: () => void }) {
    const t = useTone()
    const { detail: d, day, today, end, way, leg, tab, table } = state

    if (!d) {
        return null
    }

    const soon = tab?.next ?? null
    const first = soon?.[0]
    const when = DAYS[day].when
    const ride = tab?.ride()
    const arrive = ride && first?.end ? `Próximo chega ~${clock(first.end)} · ${ride} min de ônibus` : ride ? `~${ride} min de ônibus` : ''

    return (
        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
            <View style={s.head}>
                <Code code={d.line.code} big />
                <View style={s.title}>
                    <Text style={[s.name, { color: t.fg }]}>{d.line.name}</Text>
                    <Text style={[s.small, { color: t.mute }]}>{d.line.agency}</Text>
                </View>
                <Button variant="ghost" label="Fechar linha" onPress={onClose}>
                    <Text style={[s.close, { color: t.fg }]}>✕</Text>
                </Button>
            </View>

            <Chips day={day} today={today} onDay={state.pick} runs={(k) => d.line.runs(k)} />

            {!d.ways.length && <Text style={[s.dash, { color: t.mute, borderColor: t.edge }]}>Essa linha não roda {when}. Escolhe outro dia.</Text>}

            {d.ways.length > 1 && (
                <View style={s.chips}>
                    {d.ways.map((w) => (
                        <Button key={w.dir} variant="chip" on={w.dir === way?.dir} onPress={() => state.show(w.dir)}>
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
                        <Text style={[s.small, { color: t.alert }]}>
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
                                <Button variant="ghost" onPress={state.toggle} style={s.left}>
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

            {leg?.drop && (end || dest) && (
                <View style={[s.card, { backgroundColor: t.card, borderColor: t.edge }]}>
                    <Text style={[s.over, { color: t.mute }]}>ONDE DESCER · {label(leg.dir).toUpperCase()}</Text>
                    <Text style={[s.stop, { color: t.fg }]}>{named(leg.drop.stop)}</Text>
                    {dest && (
                        <Text style={[s.small, { color: t.mute }]}>
                            {meters(leg.drop.meters)} de {dest.name} · {Math.max(1, Math.round(leg.drop.meters / PACE))} min a pé
                        </Text>
                    )}
                    {arrive !== '' && <Text style={[s.small, { color: t.mute }]}>{arrive}</Text>}
                    {end && (
                        <Button variant="ghost" onPress={state.unend} style={s.left}>
                            <Text style={[s.small, { color: t.mute }]}>Tirar essa parada</Text>
                        </Button>
                    )}
                </View>
            )}

            {way && (
                <View>
                    <Text style={[s.over, { color: t.mute }]}>
                        PARADAS · {label(way.dir).toUpperCase()} · {way.stops.length}
                    </Text>
                    {way.stops.map((st, i) => {
                        const a = leg?.board?.stop.id === st.id && leg.board.seq === i
                        const b = end !== null && leg?.drop?.stop.id === st.id && leg.drop.seq === i

                        return (
                            <Button key={`${st.id}-${i}`} variant="row" onPress={() => state.tap(st.id)} style={s.row}>
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
    )
}

const s = StyleSheet.create({
    body: { gap: 14, paddingBottom: 48 },
    head: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    close: { fontSize: 18 },
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
