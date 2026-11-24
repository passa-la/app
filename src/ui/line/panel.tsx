import { useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import type { Place } from '../../domain/geo/place.ts'
import type { Walk } from '../../domain/geo/walk.ts'
import type { Stop } from '../../domain/transit/stop.ts'
import { Button } from '../button.tsx'
import { Chips, meters } from '../chips.tsx'
import { Code } from '../code.tsx'
import { Icon } from '../icon.tsx'
import type { Alarms } from '../alarms.ts'
import type { Fav } from '../marks.ts'
import type { Geo } from '../me.ts'
import { Nick } from '../nick.tsx'
import { Remind } from './remind.tsx'
import { clock, DAYS, hours, label, wait } from '../format.ts'
import { useTone } from '../theme.ts'
import type { LineState } from './use.ts'

const named = (s: Stop) => s.name || `Parada ${s.id}`

const PACE = 75

type Props = {
    state: LineState
    dest?: Place | null
    fav?: Fav | null
    onStar?: () => void
    onNick?: (v: string) => void
    onClose: () => void
    from?: string | null
    geo?: Geo
    onLocate?: () => void
    alarms?: Alarms
    walk?: Walk | null
    onRoutine?: () => void
}

export function LinePanel({ state, dest = null, fav = null, onStar, onNick, onClose, from = null, geo, onLocate, alarms, walk = null, onRoutine }: Props) {
    const t = useTone()
    const { detail: d, day, today, end, way, leg, tab, table } = state
    const [ask, setAsk] = useState<string | null>(null)

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
                {onRoutine && (
                    <Button variant="ghost" label="Rotinas" onPress={onRoutine}>
                        <Icon name="calendar-clock" color={t.fg} size={22} />
                    </Button>
                )}
                {onStar && (
                    <Button variant="ghost" label={fav ? 'Tirar das favoritas' : 'Favoritar'} onPress={onStar}>
                        <Icon name={fav ? 'star' : 'star-outline'} color={fav ? t.sun : t.fg} size={22} />
                    </Button>
                )}
                <Button variant="ghost" label="Fechar linha" onPress={onClose}>
                    <Icon name="close" color={t.fg} size={22} />
                </Button>
            </View>

            {fav && onNick && <Nick key={fav.id} value={fav.nick} hint="Ex.: trabalho, casa da vó" onChange={onNick} />}

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

            {onLocate && geo !== 'on' && d.ways.length > 0 && (
                <View style={[s.card, s.ask, { backgroundColor: t.card, borderColor: t.edge }]}>
                    <Text style={[s.small, s.grow, { color: t.fg }]}>
                        {geo === 'denied'
                            ? 'Sua localização está bloqueada. Libera nas configurações do Android pra ver onde pegar.'
                            : 'Liga sua localização pra ver onde pegar e o caminho a pé.'}
                    </Text>
                    {geo !== 'denied' && (
                        <Button onPress={onLocate} disabled={geo === 'busy'}>
                            <Text style={[s.small, { color: t.sunInk, fontWeight: '600' }]}>Usar</Text>
                        </Button>
                    )}
                </View>
            )}

            {d.ways.length > 0 && !leg?.board && (
                <Text style={[s.dash, { color: t.mute, borderColor: t.edge }]}>Toca numa parada no mapa pra ver a que horas o ônibus passa nela.</Text>
            )}

            {leg?.board && (
                <View style={[s.card, { backgroundColor: t.card, borderColor: t.edge }]}>
                    <Text style={[s.over, { color: t.mute }]}>ONDE PEGAR · {label(leg.dir).toUpperCase()}</Text>
                    <Text style={[s.stop, { color: t.fg }]}>{named(leg.board.stop)}</Text>
                    {from && leg.board.meters > 0 && (
                        <Text style={[s.small, { color: t.mute }]}>
                            {walk
                                ? `${meters(walk.meters)} de ${from} · ${Math.max(1, Math.round(walk.seconds / 60))} min a pé`
                                : `${meters(leg.board.meters)} de ${from} · ${Math.max(1, Math.round(leg.board.meters / PACE))} min a pé`}
                        </Text>
                    )}

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
                                    {soon.map((b, i) => {
                                        const k = `${d.line.id}|${leg.board?.stop.id}|${b.at}`
                                        const left = tab.wait(b)
                                        const set = alarms?.find(k) ?? null
                                        const bus = Date.now() + (b.at - tab.now) * 1000
                                        const where = named(leg.board!.stop)
                                        const tail = b.end !== null ? ` · chega ~${clock(b.end)}` : ''

                                        return (
                                            <View key={i} style={s.slot}>
                                                <View style={s.next}>
                                                    <Text style={[s.grow, { color: t.fg }]}>
                                                        <Text style={s.at}>{clock(b.at)}</Text>
                                                        {b.end !== null && <Text style={{ color: t.mute }}>{`  → chega ${clock(b.end)}`}</Text>}
                                                    </Text>
                                                    <Text style={[s.small, { color: t.mute }]}>{wait(left)}</Text>
                                                    {alarms && left > 1 && (
                                                        <Button
                                                            variant="chip"
                                                            on={!!set}
                                                            label={set ? `Aviso ${set.lead} min antes` : 'Me avisar'}
                                                            onPress={() => setAsk(ask === k ? null : k)}
                                                            style={s.bell}
                                                        >
                                                            <Icon name={set ? 'bell' : 'bell-off-outline'} color={set ? t.paper : t.fg} size={16} />
                                                            {set && <Text style={{ fontSize: 14, color: t.paper }}>{set.lead}</Text>}
                                                        </Button>
                                                    )}
                                                </View>
                                                {alarms && ask === k && (
                                                    <Remind
                                                        left={left}
                                                        current={set}
                                                        lead={alarms.lead}
                                                        onPick={(min) => {
                                                            setAsk(null)
                                                            alarms.set(
                                                                {
                                                                    key: k,
                                                                    line: d.line.id,
                                                                    code: d.line.code,
                                                                    stop: leg.board!.stop.id,
                                                                    name: where,
                                                                    bus,
                                                                    title: `${d.line.code} passa em ${min} min`,
                                                                    body: `${where} às ${clock(b.at)}${tail}`,
                                                                },
                                                                min,
                                                            )
                                                        }}
                                                        onCancel={() => {
                                                            setAsk(null)
                                                            alarms.cancel(k)
                                                        }}
                                                    />
                                                )}
                                            </View>
                                        )
                                    })}
                                    {alarms?.fail && <Text style={[s.small, { color: t.alert }]}>{alarms.fail}</Text>}
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

        </ScrollView>
    )
}

const s = StyleSheet.create({
    body: { gap: 14, paddingBottom: 48 },
    head: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
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
    slot: { gap: 8 },
    next: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    grow: { flex: 1 },
    ask: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    bell: { paddingHorizontal: 8, paddingVertical: 4, gap: 4 },
    at: { fontSize: 20, fontWeight: '700', fontVariant: ['tabular-nums'] },
    left: { alignSelf: 'flex-start', marginLeft: -12 },
    hour: { flexDirection: 'row', gap: 14 },
    h: { width: 24, fontWeight: '600', fontVariant: ['tabular-nums'] },
    mins: { flex: 1, fontVariant: ['tabular-nums'] },
})
