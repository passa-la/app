import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button } from '../ui/button.tsx'
import { Code } from '../ui/code.tsx'
import { useNet } from '../ui/net.tsx'
import { useTone } from '../ui/theme.ts'

export default function Home() {
    const t = useTone()
    const { kit, fail } = useNet()
    const [q, setQ] = useState('')
    const found = useMemo(() => (kit && q.trim() ? kit.find.run(q) : []), [kit, q])

    return (
        <SafeAreaView style={[s.page, { backgroundColor: t.paper }]}>
            <View style={[s.mark, { backgroundColor: t.fg }]}>
                <Text style={[s.brand, { color: t.paper }]}>
                    passa lá<Text style={{ color: t.sun }}>?</Text>
                </Text>
            </View>

            <TextInput
                value={q}
                onChangeText={setQ}
                placeholder="Ex.: 823 ou Jardim Brasil"
                placeholderTextColor={t.mute}
                autoCorrect={false}
                returnKeyType="search"
                style={[s.field, { backgroundColor: t.card, borderColor: t.edge, color: t.fg }]}
            />

            {!kit && !fail && <Text style={[s.note, { color: t.mute }]}>Abrindo as linhas…</Text>}
            {fail && <Text style={[s.note, { color: t.alert }]}>Não deu pra abrir as linhas: {fail}</Text>}
            {kit && q.trim() !== '' && !found.length && (
                <Text style={[s.note, { color: t.mute }]}>Nenhuma linha com esse número ou nome.</Text>
            )}

            <FlatList
                data={found}
                keyExtractor={(l) => l.id}
                keyboardShouldPersistTaps="handled"
                ItemSeparatorComponent={() => <View style={[s.sep, { backgroundColor: t.edge }]} />}
                renderItem={({ item }) => (
                    <Button variant="row" onPress={() => router.push({ pathname: '/line/[id]', params: { id: item.id } })}>
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
        </SafeAreaView>
    )
}

const s = StyleSheet.create({
    page: { flex: 1, paddingHorizontal: 16, gap: 12 },
    mark: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 18, paddingVertical: 8, marginTop: 8 },
    brand: { fontSize: 22, fontWeight: '700' },
    field: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16 },
    note: { fontSize: 14 },
    sep: { height: StyleSheet.hairlineWidth },
    name: { flex: 1, fontSize: 16 },
    foot: { fontSize: 12, textAlign: 'center', paddingBottom: 8 },
})
