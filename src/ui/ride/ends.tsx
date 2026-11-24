import { StyleSheet, Text, TextInput, View } from 'react-native'
import { Button } from '../button.tsx'
import { useTone } from '../theme.ts'

export type End = 'from' | 'to'

type Props = {
    text: Record<End, string>
    field: End
    onText: (f: End, v: string) => void
    onField: (f: End) => void
    onSwap: () => void
}

const HINT: Record<End, string> = { from: 'De onde você sai?', to: 'Pra onde você vai?' }
const TAG: Record<End, string> = { from: 'De', to: 'Para' }

export function Ends({ text, field, onText, onField, onSwap }: Props) {
    const t = useTone()

    return (
        <View style={s.row}>
            <View style={s.fields}>
                {(['from', 'to'] as End[]).map((f) => (
                    <View key={f} style={[s.box, { backgroundColor: t.card, borderColor: field === f ? t.sun : t.edge }]}>
                        <Text style={[s.tag, { color: t.mute }]}>{TAG[f]}</Text>
                        <TextInput
                            value={text[f]}
                            onChangeText={(v) => onText(f, v)}
                            onFocus={() => onField(f)}
                            placeholder={HINT[f]}
                            placeholderTextColor={t.mute}
                            autoCorrect={false}
                            selectTextOnFocus
                            style={[s.input, { color: t.fg }]}
                        />
                    </View>
                ))}
            </View>
            <Button variant="ghost" label="Inverter origem e destino" onPress={onSwap}>
                <Text style={[s.swap, { color: t.fg }]}>⇅</Text>
            </Button>
        </View>
    )
}

const s = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    fields: { flex: 1, gap: 8 },
    box: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 14 },
    tag: { width: 34, fontSize: 13, fontWeight: '600' },
    input: { flex: 1, paddingVertical: 11, fontSize: 16 },
    swap: { fontSize: 22 },
})
