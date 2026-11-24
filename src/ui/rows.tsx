import { StyleSheet, Text, View } from 'react-native'
import { Button } from './button.tsx'
import { Code } from './code.tsx'
import { useTone } from './theme.ts'

export type Row = { key: string; code?: string; title: string; note?: string; star?: boolean; onPress: () => void }

export function Rows({ head, rows }: { head?: string; rows: Row[] }) {
    const t = useTone()

    if (!rows.length) {
        return null
    }

    return (
        <View>
            {head && <Text style={[s.head, { color: t.mute }]}>{head}</Text>}
            {rows.map((r, i) => (
                <View key={r.key}>
                    {i > 0 && <View style={[s.sep, { backgroundColor: t.edge }]} />}
                    <Button variant="row" onPress={r.onPress}>
                        {r.code !== undefined && <Code code={r.code} />}
                        <View style={s.text}>
                            <Text style={[s.title, { color: t.fg }]} numberOfLines={2}>
                                {r.title}
                            </Text>
                            {r.note ? (
                                <Text style={[s.note, { color: t.mute }]} numberOfLines={1}>
                                    {r.note}
                                </Text>
                            ) : null}
                        </View>
                        {r.star && <Text style={{ color: t.sun, fontSize: 18 }}>★</Text>}
                    </Button>
                </View>
            ))}
        </View>
    )
}

const s = StyleSheet.create({
    head: { fontSize: 13, fontWeight: '600', marginTop: 4, marginBottom: 2 },
    sep: { height: StyleSheet.hairlineWidth },
    text: { flex: 1, gap: 2 },
    title: { fontSize: 16 },
    note: { fontSize: 13 },
})
