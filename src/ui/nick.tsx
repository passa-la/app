import { useEffect, useState } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import { useTone } from './theme.ts'

const WAIT = 400

export function Nick({ value, hint, onChange }: { value: string; hint: string; onChange: (v: string) => void }) {
    const t = useTone()
    const [text, setText] = useState(value)

    useEffect(() => {
        if (text === value) {
            return
        }

        const timer = setTimeout(() => onChange(text), WAIT)

        return () => clearTimeout(timer)
    }, [text])

    return (
        <View style={[s.box, { backgroundColor: t.card, borderColor: t.edge }]}>
            <Text style={[s.tag, { color: t.mute }]}>APELIDO</Text>
            <TextInput value={text} onChangeText={setText} placeholder={hint} placeholderTextColor={t.mute} maxLength={30} style={[s.input, { color: t.fg }]} />
        </View>
    )
}

const s = StyleSheet.create({
    box: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, paddingHorizontal: 14 },
    tag: { fontSize: 12, fontWeight: '500', letterSpacing: 0.6 },
    input: { flex: 1, paddingVertical: 9, fontSize: 15 },
})
