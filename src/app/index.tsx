import { useEffect, useMemo, useState } from 'react'
import { BackHandler, FlatList, Keyboard, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button } from '../ui/button.tsx'
import { Code } from '../ui/code.tsx'
import { LinePanel } from '../ui/line/panel.tsx'
import { useLine } from '../ui/line/use.ts'
import { LineMap } from '../ui/map/line.tsx'
import { useNet } from '../ui/net.tsx'
import { height, Sheet, type Snap } from '../ui/sheet.tsx'
import { useTone } from '../ui/theme.ts'

export default function Home() {
    const t = useTone()
    const top = useSafeAreaInsets().top
    const { height: screen } = useWindowDimensions()
    const { kit, fail } = useNet()
    const [q, setQ] = useState('')
    const [open, setOpen] = useState<string | null>(null)
    const [snap, setSnap] = useState<Snap>('mid')
    const line = useLine(kit, open)
    const found = useMemo(() => (kit && q.trim() ? kit.find.run(q) : []), [kit, q])

    useEffect(() => {
        const sub = BackHandler.addEventListener('hardwareBackPress', () => {
            if (open) {
                setOpen(null)
                return true
            }

            return false
        })

        return () => sub.remove()
    }, [open])

    const choose = (id: string) => {
        Keyboard.dismiss()
        setOpen(id)
        setSnap('mid')
    }

    return (
        <View style={[s.page, { backgroundColor: t.paper }]}>
            <LineMap
                ways={open ? (line.detail?.ways ?? []) : []}
                focus={line.way?.dir ?? null}
                board={line.leg?.board?.stop ?? null}
                drop={line.end ? (line.leg?.drop?.stop ?? null) : null}
                onStop={line.tap}
                bottom={height(snap === 'full' ? 'mid' : snap, screen)}
            />

            <View style={[s.mark, { top: top + 12, backgroundColor: t.fg }]} pointerEvents="none">
                <Text style={[s.brand, { color: t.paper }]}>
                    passa lá<Text style={{ color: t.sun }}>?</Text>
                </Text>
            </View>

            <Sheet snap={snap} onSnap={setSnap}>
                {open && line.detail ? (
                    <LinePanel state={line} onClose={() => setOpen(null)} />
                ) : (
                    <View style={s.find}>
                        <TextInput
                            value={q}
                            onChangeText={setQ}
                            onFocus={() => setSnap('full')}
                            placeholder="Ex.: 823 ou Jardim Brasil"
                            placeholderTextColor={t.mute}
                            autoCorrect={false}
                            returnKeyType="search"
                            style={[s.field, { backgroundColor: t.card, borderColor: t.edge, color: t.fg }]}
                        />

                        {!kit && !fail && <Text style={[s.note, { color: t.mute }]}>Abrindo as linhas…</Text>}
                        {fail && <Text style={[s.note, { color: t.alert }]}>Não deu pra abrir as linhas: {fail}</Text>}
                        {kit && q.trim() === '' && <Text style={[s.note, { color: t.mute }]}>Digita o número ou o nome da linha.</Text>}
                        {kit && q.trim() !== '' && !found.length && (
                            <Text style={[s.note, { color: t.mute }]}>Nenhuma linha com esse número ou nome.</Text>
                        )}

                        <FlatList
                            data={found}
                            keyExtractor={(l) => l.id}
                            keyboardShouldPersistTaps="handled"
                            ItemSeparatorComponent={() => <View style={[s.sep, { backgroundColor: t.edge }]} />}
                            renderItem={({ item }) => (
                                <Button variant="row" onPress={() => choose(item.id)}>
                                    <Code code={item.code} />
                                    <Text style={[s.name, { color: t.fg }]} numberOfLines={2}>
                                        {item.name}
                                    </Text>
                                </Button>
                            )}
                        />

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
    field: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16 },
    note: { fontSize: 14 },
    sep: { height: StyleSheet.hairlineWidth },
    name: { flex: 1, fontSize: 16 },
    foot: { fontSize: 12, textAlign: 'center', paddingVertical: 8 },
})
