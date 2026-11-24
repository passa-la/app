import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { Day } from '../domain/transit/day.ts'
import { Button } from './button.tsx'
import { DAYS } from './format.ts'
import { useTone } from './theme.ts'

export const RADII = [300, 500, 1000]

export const meters = (m: number) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1).replace('.0', '').replace('.', ',')} km`)

type Props = {
    day: Day
    today: Day
    onDay: (d: Day) => void
    runs?: (d: Day) => boolean
    radius?: number
    onRadius?: (m: number) => void
}

export function Chips({ day, today, onDay, runs = () => true, radius, onRadius }: Props) {
    const t = useTone()

    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row} keyboardShouldPersistTaps="handled">
            {Day.all.map((k) => (
                <Button key={k} variant="chip" on={day === k} onPress={() => onDay(k)}>
                    <Text style={[s.text, { color: day === k ? t.paper : t.fg }, !runs(k) && s.strike]}>{DAYS[k].name}</Text>
                    {k === today && <Text style={[s.tiny, { color: day === k ? t.paper : t.mute }]}>hoje</Text>}
                </Button>
            ))}
            {onRadius && <View style={[s.sep, { backgroundColor: t.edge }]} />}
            {onRadius &&
                RADII.map((m) => (
                    <Button key={m} variant="chip" on={radius === m} onPress={() => onRadius(m)}>
                        <Text style={[s.text, { color: radius === m ? t.paper : t.fg }]}>{meters(m)}</Text>
                    </Button>
                ))}
        </ScrollView>
    )
}

const s = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    text: { fontSize: 14 },
    tiny: { fontSize: 12 },
    strike: { textDecorationLine: 'line-through', opacity: 0.6 },
    sep: { width: 1, height: 24, marginHorizontal: 4 },
})
