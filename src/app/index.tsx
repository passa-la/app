import { useEffect, useMemo, useState } from 'react'
import { BackHandler, FlatList, Keyboard, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Place } from '../domain/geo/place.ts'
import type { Point } from '../domain/geo/point.ts'
import { Day } from '../domain/transit/day.ts'
import type { Ride } from '../domain/transit/ride.ts'
import { useAlarms } from '../ui/alarms.ts'
import { Button } from '../ui/button.tsx'
import { Code } from '../ui/code.tsx'
import { LinePanel } from '../ui/line/panel.tsx'
import { useLine } from '../ui/line/use.ts'
import { Board } from '../ui/map/board.tsx'
import { place as toPlace, type Spot, useMarks } from '../ui/marks.ts'
import { useMe } from '../ui/me.ts'
import { useNet } from '../ui/net.tsx'
import { Near } from '../ui/place/near.tsx'
import { usePlaces } from '../ui/place/use.ts'
import { type End, Ends } from '../ui/ride/ends.tsx'
import { Rides } from '../ui/ride/list.tsx'
import { type Row, Rows } from '../ui/rows.tsx'
import { height, Sheet, type Snap } from '../ui/sheet.tsx'
import { useTone } from '../ui/theme.ts'
import { useWalk } from '../ui/walk.ts'

type Mode = 'place' | 'line' | 'ride'

const MODES: Record<Mode, string> = { place: 'Lugar', line: 'Linha', ride: 'De → Para' }

const HINTS: Record<Mode, string> = {
    place: 'Pra onde você vai? Ex.: Patteo Olinda',
    line: 'Ex.: 823 ou Jardim Brasil',
    ride: '',
}

export default function Home() {
    const t = useTone()
    const top = useSafeAreaInsets().top
    const { height: screen } = useWindowDimensions()
    const { kit, fail } = useNet()
    const [mode, setMode] = useState<Mode>('place')
    const [q, setQ] = useState('')
    const [place, setPlace] = useState<Place | null>(null)
    const [radius, setRadius] = useState(1000)
    const [day, setDay] = useState<Day>(() => Day.of(new Date()))
    const [open, setOpen] = useState<string | null>(null)
    const [snap, setSnap] = useState<Snap>('mid')
    const [ends, setEnds] = useState<Record<End, Place | null>>({ from: null, to: null })
    const [text, setText] = useState<Record<End, string>>({ from: '', to: '' })
    const [field, setField] = useState<End>('from')
    const [start, setStart] = useState<{ stop: string | null; end: string | null } | null>(null)
    const marks = useMarks()
    const me = useMe()
    const alarms = useAlarms()
    const ride = mode === 'ride'
    const dest = ride ? ends.to : place
    const typing = ride && text[field].trim().length >= 3 && text[field] !== ends[field]?.name
    const line = useLine(kit, open, { to: dest?.point ?? null, from: ride ? (ends.from?.point ?? null) : me.me, start, day, onDay: setDay })
    const places = usePlaces(kit, mode === 'place' && !place ? q : typing ? text[field] : '')
    const rides = useMemo(
        () => (kit && ends.from && ends.to ? kit.trip.run(ends.from.point, ends.to.point, day, radius) : []),
        [kit, ends, day, radius],
    )
    const lines = useMemo(() => (kit && mode === 'line' && q.trim() ? kit.find.run(q) : []), [kit, mode, q])
    const origin = ride ? (ends.from?.point ?? null) : me.me
    const walk = useWalk(kit?.walker ?? null, open ? origin : null, open ? (line.leg?.board?.stop.point ?? null) : null)
    const found = useMemo(() => (kit && place ? kit.search.run(place.point, day, radius) : null), [kit, place, day, radius])

    useEffect(() => {
        const sub = BackHandler.addEventListener('hardwareBackPress', () => {
            if (open) {
                setOpen(null)
                return true
            }

            if (place) {
                setPlace(null)
                return true
            }

            return false
        })

        return () => sub.remove()
    }, [open, place])

    const look = (id: string, ctx: string) => {
        const l = kit?.net.find(id)

        if (l) {
            marks.look(l, ctx)
        }
    }

    const openLine = (id: string) => {
        Keyboard.dismiss()
        setStart(null)
        setOpen(id)
        setSnap('mid')
        look(id, mode === 'place' && place ? `Perto de ${place.name}` : 'Busca por linha')
    }

    const openRide = (r: Ride) => {
        Keyboard.dismiss()
        setStart({ stop: r.board.stop.id, end: r.drop.stop.id })
        setOpen(r.line.id)
        setSnap('mid')
        look(r.line.id, `${ends.from?.name ?? ''} → ${ends.to?.name ?? ''}`)
    }

    const spotRows = (on: (s: Spot) => void): Row[] =>
        marks.spots.map((sp) => ({ key: `${sp.lat},${sp.lon}`, title: sp.nick || sp.name, note: sp.nick ? sp.name : sp.label, onPress: () => on(sp) }))

    const favRows: Row[] = marks.favs.map((f) => ({
        key: `f${f.id}`,
        code: f.code,
        title: f.nick || f.name,
        note: f.nick ? f.name : undefined,
        star: true,
        onPress: () => openLine(f.id),
    }))

    const seenRows: Row[] = marks.seen.map((x) => ({
        key: `s${x.id}`,
        code: x.code,
        title: x.name,
        note: x.ctx,
        star: !!marks.fav(x.id),
        onPress: () => openLine(x.id),
    }))

    const pick = (p: Place) => {
        const other: End = field === 'from' ? 'to' : 'from'
        setEnds({ ...ends, [field]: p })
        setText({ ...text, [field]: p.name })

        if (!ends[other]) {
            setField(other)
        } else {
            Keyboard.dismiss()
            setSnap('mid')
        }
    }

    const tap = (p: Point) => {
        if (open || mode === 'line') {
            return
        }

        const spot = new Place('Ponto no mapa', '', p)
        const set = (x: Place) => (ride ? pick(x) : go(x))
        set(spot)

        kit?.lookup
            .name(p)
            .then((named) => {
                if (named) {
                    ride ? setEnds((e) => ({ ...e, [field]: named })) : setPlace((old) => (old === spot ? named : old))
                    ride && setText((x) => ({ ...x, [field]: named.name }))
                }
            })
            .catch(() => {})
    }

    const here = () => {
        if (me.me) {
            pick(new Place('Minha localização', '', me.me))
        } else {
            me.start()
        }
    }

    const flip = () => {
        setEnds({ from: ends.to, to: ends.from })
        setText({ from: text.to, to: text.from })
    }

    const go = (p: Place) => {
        Keyboard.dismiss()
        setPlace(p)
        setSnap('mid')
    }

    const swap = (m: Mode) => {
        setMode(m)
        setQ('')
        setPlace(null)
        setOpen(null)
    }

    const note = (text: string, alert = false) => <Text style={[s.note, { color: alert ? t.alert : t.mute }]}>{text}</Text>

    return (
        <View style={[s.page, { backgroundColor: t.paper }]}>
            <Board
                ways={open ? (line.detail?.ways ?? []) : []}
                focus={line.way?.dir ?? null}
                board={line.leg?.board?.stop ?? null}
                drop={line.end || dest ? (line.leg?.drop?.stop ?? null) : null}
                onStop={line.tap}
                bottom={height(snap === 'full' ? 'mid' : snap, screen)}
                places={(ride ? [ends.from, ends.to] : [place]).filter((x): x is Place => x !== null).map((x) => x.point)}
                radius={radius}
                me={me.me}
                deg={me.deg}
                bus={me.bus}
                onTap={tap}
                walk={walk?.points ?? []}
            />

            <View style={[s.mark, { top: top + 12, backgroundColor: t.fg }]} pointerEvents="none">
                <Text style={[s.brand, { color: t.paper }]}>
                    passa lá<Text style={{ color: t.sun }}>?</Text>
                </Text>
            </View>

            <Sheet snap={snap} onSnap={setSnap}>
                {open && line.detail ? (
                    <LinePanel
                        state={line}
                        dest={dest}
                        fav={marks.fav(line.detail.line.id)}
                        onStar={() => line.detail && marks.star(line.detail.line)}
                        onNick={(v) => line.detail && marks.rename(line.detail.line.id, v)}
                        onClose={() => setOpen(null)}
                        from={ride ? (ends.from?.name ?? null) : me.me ? 'você' : null}
                        geo={me.geo}
                        onLocate={ride ? undefined : me.start}
                        alarms={alarms}
                        walk={walk}
                    />
                ) : mode === 'place' && place ? (
                    <Near
                        place={place}
                        found={found}
                        day={day}
                        today={line.today}
                        onDay={setDay}
                        radius={radius}
                        onRadius={setRadius}
                        onLine={openLine}
                        onClose={() => setPlace(null)}
                        saved={marks.spot(place)}
                        onSave={() => marks.save(place)}
                        onNick={(v) => marks.label(place, v)}
                    />
                ) : (
                    <View style={s.find}>
                        <View style={[s.modes, { backgroundColor: t.card, borderColor: t.edge }]}>
                            {(Object.keys(MODES) as Mode[]).map((m) => (
                                <Button key={m} variant="chip" on={mode === m} onPress={() => swap(m)} style={s.mode}>
                                    <Text style={[s.modeText, { color: mode === m ? t.paper : t.fg }]}>{MODES[m]}</Text>
                                </Button>
                            ))}
                        </View>

                        {ride && (
                            <Ends
                                text={text}
                                field={field}
                                onText={(f, v) => setText({ ...text, [f]: v })}
                                onField={(f) => {
                                    setField(f)
                                    setSnap('full')
                                }}
                                onSwap={flip}
                            />
                        )}

                        {ride && typing && (
                            <>
                                {places.busy && note('Procurando lugares…')}
                                {places.fail && note('Não deu pra buscar lugares agora. Confere a internet.', true)}
                                {!places.busy && !places.fail && !places.list.length && note('Nenhum lugar com esse nome em Pernambuco.')}
                                <FlatList
                                    data={places.list}
                                    keyExtractor={(p) => `${p.point.lat},${p.point.lon},${p.name}`}
                                    keyboardShouldPersistTaps="handled"
                                    ItemSeparatorComponent={() => <View style={[s.sep, { backgroundColor: t.edge }]} />}
                                    renderItem={({ item }) => (
                                        <Button variant="row" onPress={() => pick(item)}>
                                            <View style={s.text}>
                                                <Text style={[s.name, { color: t.fg }]} numberOfLines={1}>
                                                    {item.name}
                                                </Text>
                                                {item.label !== '' && (
                                                    <Text style={[s.label, { color: t.mute }]} numberOfLines={1}>
                                                        {item.label}
                                                    </Text>
                                                )}
                                            </View>
                                        </Button>
                                    )}
                                />
                            </>
                        )}

                        {ride && !typing && ends.from && ends.to && (
                            <Rides
                                rides={rides}
                                path={`${ends.from.name} → ${ends.to.name}`}
                                day={day}
                                today={line.today}
                                onDay={setDay}
                                radius={radius}
                                onRadius={setRadius}
                                onRide={openRide}
                            />
                        )}

                        {ride && !typing && text[field] === '' && (
                            <Rows
                                head="Sugestões"
                                rows={[
                                    ...(field === 'from'
                                        ? [{ key: 'here', title: 'Minha localização', note: me.me ? undefined : 'Toca pra ligar a localização', onPress: here }]
                                        : []),
                                    ...spotRows((sp) => pick(toPlace(sp))),
                                ]}
                            />
                        )}

                        {ride && !typing && (!ends.from || !ends.to) && note('Escolhe de onde você sai e pra onde vai: a gente mostra as linhas que levam direto, sem baldeação.')}

                        {!ride && (
                        <TextInput
                            value={q}
                            onChangeText={setQ}
                            onFocus={() => setSnap('full')}
                            placeholder={HINTS[mode]}
                            placeholderTextColor={t.mute}
                            autoCorrect={false}
                            returnKeyType="search"
                            style={[s.field, { backgroundColor: t.card, borderColor: t.edge, color: t.fg }]}
                        />
                        )}

                        {!kit && !fail && note('Abrindo as linhas…')}
                        {fail && note(`Não deu pra abrir as linhas: ${fail}`, true)}

                        {kit && mode === 'place' && (
                            <>
                                {q.trim().length < 3 && note('Digita pra onde você vai, ou toca no mapa, e a gente mostra os ônibus que passam a até 1 km de lá.')}
                                {q.trim() === '' && (
                                    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.lists}>
                                        <Rows head="Lugares salvos" rows={spotRows((sp) => go(toPlace(sp)))} />
                                        <Rows head="Favoritas" rows={favRows} />
                                        <Rows head="Ônibus recentes" rows={seenRows} />
                                    </ScrollView>
                                )}
                                {places.busy && note('Procurando lugares…')}
                                {places.fail && note('Não deu pra buscar lugares agora. Confere a internet.', true)}
                                {!places.busy && !places.fail && q.trim().length >= 3 && !places.list.length && note('Nenhum lugar com esse nome em Pernambuco.')}
                                <FlatList
                                    data={places.list}
                                    keyExtractor={(p) => `${p.point.lat},${p.point.lon},${p.name}`}
                                    keyboardShouldPersistTaps="handled"
                                    ItemSeparatorComponent={() => <View style={[s.sep, { backgroundColor: t.edge }]} />}
                                    renderItem={({ item }) => (
                                        <Button variant="row" onPress={() => go(item)}>
                                            <View style={s.text}>
                                                <Text style={[s.name, { color: t.fg }]} numberOfLines={1}>
                                                    {item.name}
                                                </Text>
                                                {item.label !== '' && (
                                                    <Text style={[s.label, { color: t.mute }]} numberOfLines={1}>
                                                        {item.label}
                                                    </Text>
                                                )}
                                            </View>
                                        </Button>
                                    )}
                                />
                            </>
                        )}

                        {kit && mode === 'line' && (
                            <>
                                {q.trim() === '' && note('Digita o número ou o nome da linha.')}
                                {q.trim() === '' && (
                                    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.lists}>
                                        <Rows head="Favoritas" rows={favRows} />
                                        <Rows head="Ônibus recentes" rows={seenRows} />
                                    </ScrollView>
                                )}
                                {q.trim() !== '' && !lines.length && note('Nenhuma linha com esse número ou nome.')}
                                <FlatList
                                    data={lines}
                                    keyExtractor={(l) => l.id}
                                    keyboardShouldPersistTaps="handled"
                                    ItemSeparatorComponent={() => <View style={[s.sep, { backgroundColor: t.edge }]} />}
                                    renderItem={({ item }) => (
                                        <Button variant="row" onPress={() => openLine(item.id)}>
                                            <Code code={item.code} />
                                            <Text style={[s.name, s.text, { color: t.fg }]} numberOfLines={2}>
                                                {item.name}
                                            </Text>
                                        </Button>
                                    )}
                                />
                            </>
                        )}

                        {kit && !ride && (
                            <Text style={[s.foot, { color: t.mute }]}>
                                {kit.net.lineCount()} linhas · feed {kit.net.feed}
                                {__DEV__ ? ` · abriu em ${kit.ms} ms` : ''}
                            </Text>
                        )}
                    </View>
                )}
            </Sheet>
        </View>
    )
}

const s = StyleSheet.create({
    page: { flex: 1 },
    mark: { position: 'absolute', left: 16, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 8 },
    brand: { fontSize: 20, fontWeight: '700' },
    find: { flex: 1, gap: 12 },
    modes: { flexDirection: 'row', alignSelf: 'flex-start', gap: 4, borderWidth: 1, borderRadius: 999, padding: 4 },
    mode: { borderWidth: 0 },
    modeText: { fontSize: 15 },
    field: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16 },
    note: { fontSize: 14 },
    sep: { height: StyleSheet.hairlineWidth },
    text: { flex: 1, gap: 2 },
    name: { fontSize: 16 },
    label: { fontSize: 13 },
    foot: { fontSize: 12, textAlign: 'center', paddingVertical: 8 },
    lists: { gap: 12, paddingBottom: 24 },
})
