import { useState } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import { type Alert, LEADS } from '../alarms.ts'
import { Button } from '../button.tsx'
import { useTone } from '../theme.ts'

const MAX = 120

type Props = {
    left: number
    current: Alert | null
    lead: number
    onPick: (min: number) => void
    onCancel: () => void
}

export function Remind({ left, current, lead, onPick, onCancel }: Props) {
    const t = useTone()
    const [own, setOwn] = useState(false)
    const [text, setText] = useState('')
    const chosen = current?.lead ?? null
    const custom = Number(text)
    const ok = Number.isInteger(custom) && custom >= 1 && custom < Math.min(left, MAX)

    return (
        <View style={[s.box, { backgroundColor: t.paper, borderColor: t.edge }]}>
            <Text style={[s.small, { color: t.mute }]}>Me avisa quanto tempo antes?</Text>
            <View style={s.row}>
                {LEADS.map((m) => (
                    <Button key={m} variant="chip" on={chosen === m || (chosen === null && lead === m && m < left)} disabled={m >= left} onPress={() => onPick(m)}>
                        <Text style={[s.chip, { color: chosen === m || (chosen === null && lead === m && m < left) ? t.paper : t.fg }]}>{m} min</Text>
                    </Button>
                ))}
                <Button variant="chip" on={own || (chosen !== null && !LEADS.includes(chosen))} onPress={() => setOwn(!own)}>
                    <Text style={[s.chip, { color: own || (chosen !== null && !LEADS.includes(chosen)) ? t.paper : t.fg }]}>
                        {chosen !== null && !LEADS.includes(chosen) ? `${chosen} min` : 'Outro'}
                    </Text>
                </Button>
            </View>
            {own && (
                <View style={s.row}>
                    <TextInput
                        value={text}
                        onChangeText={(v) => setText(v.replace(/\D/g, '').slice(0, 3))}
                        keyboardType="number-pad"
                        placeholder="minutos"
                        placeholderTextColor={t.mute}
                        onSubmitEditing={() => ok && onPick(custom)}
                        style={[s.input, { color: t.fg, borderColor: t.edge, backgroundColor: t.card }]}
                    />
                    <Button disabled={!ok} onPress={() => onPick(custom)}>
                        <Text style={[s.chip, { color: t.sunInk, fontWeight: '600' }]}>Avisar</Text>
                    </Button>
                </View>
            )}
            {current && (
                <Button variant="ghost" onPress={onCancel} style={s.left}>
                    <Text style={[s.small, { color: t.alert }]}>Cancelar o aviso de {current.lead} min</Text>
                </Button>
            )}
        </View>
    )
}

const s = StyleSheet.create({
    box: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 10 },
    row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
    chip: { fontSize: 14 },
    small: { fontSize: 13 },
    input: { width: 110, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, fontSize: 15 },
    left: { alignSelf: 'flex-start', marginLeft: -12 },
})
