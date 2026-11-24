import { useEffect, useMemo, useState } from 'react'
import { BackHandler, FlatList, Keyboard, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { Place } from '../domain/geo/place.ts'
import { Day } from '../domain/transit/day.ts'
import { Button } from '../ui/button.tsx'
import { Code } from '../ui/code.tsx'
import { LinePanel } from '../ui/line/panel.tsx'
import { useLine } from '../ui/line/use.ts'
import { Board } from '../ui/map/board.tsx'
import { useNet } from '../ui/net.tsx'
import { Near } from '../ui/place/near.tsx'
import { usePlaces } from '../ui/place/use.ts'
import { height, Sheet, type Snap } from '../ui/sheet.tsx'
import { useTone } from '../ui/theme.ts'

type Mode = 'place' | 'line'

const HINTS: Record<Mode, string> = {
    place: 'Pra onde você vai? Ex.: Patteo Olinda',
    line: 'Ex.: 823 ou Jardim Brasil',
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
    const line = useLine(kit, open, { to: place?.point ?? null, day, onDay: setDay })
    const places = usePlaces(kit, mode === 'place' && !place ? q : '')
    const lines = useMemo(() => (kit && mode === 'line' && q.trim() ? kit.find.run(q) : []), [kit, mode, q])
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

    const openLine = (id: string) => {
        Keyboard.dismiss()
        setOpen(id)
        setSnap('mid')
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
                drop={line.end || place ? (line.leg?.drop?.stop ?? null) : null}
                onStop={line.tap}
                bottom={height(snap === 'full' ? 'mid' : snap, screen)}
                place={place?.point ?? null}
                radius={place ? radius : 0}
            />

            <View style={[s.mark, { top: top + 12, backgroundColor: t.fg }]} pointerEvents="none">
                <Text style={[s.brand, { color: t.paper }]}>
                    passa lá<Text style={{ color: t.sun }}>?</Text>
                </Text>
            </View>

            <Sheet snap={snap} onSnap={setSnap}>
                {open && line.detail ? (
                    <LinePanel state={line} dest={place} onClose={() => setOpen(null)} />
                ) : place ? (
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
                    />
                ) : (
                    <View style={s.find}>
                        <View style={[s.modes, { backgroundColor: t.card, borderColor: t.edge }]}>
                            {(['place', 'line'] as Mode[]).map((m) => (
                                <Button key={m} variant="chip" on={mode === m} onPress={() => swap(m)} style={s.mode}>
                                    <Text style={[s.modeText, { color: mode === m ? t.paper : t.fg }]}>{m === 'place' ? 'Lugar' : 'Linha'}</Text>
                                </Button>
                            ))}
                        </View>

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

                        {!kit && !fail && note('Abrindo as linhas…')}
                        {fail && note(`Não deu pra abrir as linhas: ${fail}`, true)}

                        {kit && mode === 'place' && (
                            <>
                                {q.trim().length < 3 && note('Digita pra onde você vai e a gente mostra os ônibus que passam a até 1 km de lá.')}
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

                        {kit && (
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
})
