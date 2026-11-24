import { StyleSheet, Text, useColorScheme, View } from 'react-native'
import { dark, light } from '../ui/tone.ts'

export default function Home() {
    const t = useColorScheme() === 'dark' ? dark : light

    return (
        <View style={[s.page, { backgroundColor: t.paper }]}>
            <View style={[s.mark, { backgroundColor: t.fg }]}>
                <Text style={[s.brand, { color: t.paper }]}>
                    passa lá<Text style={{ color: t.sun }}>?</Text>
                </Text>
            </View>
            <Text style={[s.note, { color: t.mute }]}>Linhas e horários de ônibus do Grande Recife, direto no celular.</Text>
        </View>
    )
}

const s = StyleSheet.create({
    page: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
    mark: { borderRadius: 999, paddingHorizontal: 20, paddingVertical: 10 },
    brand: { fontSize: 28, fontWeight: '700' },
    note: { fontSize: 16, textAlign: 'center' },
})
