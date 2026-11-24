import { StyleSheet, Text, View } from 'react-native'
import { useTone } from './theme.ts'

export function Code({ code, big = false }: { code: string; big?: boolean }) {
    const t = useTone()

    return (
        <View style={[s.box, { backgroundColor: t.sun }, big && s.big]}>
            <Text style={[s.text, { color: t.sunInk }, big && s.bigText]}>{code}</Text>
        </View>
    )
}

const s = StyleSheet.create({
    box: { minWidth: 56, alignItems: 'center', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
    big: { minWidth: 68, paddingVertical: 6 },
    text: { fontSize: 16, fontWeight: '700', fontVariant: ['tabular-nums'] },
    bigText: { fontSize: 20 },
})
