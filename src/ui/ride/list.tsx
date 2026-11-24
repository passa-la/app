import { ScrollView, StyleSheet, Text, View } from 'react-native'
import type { Day } from '../../domain/transit/day.ts'
import type { Ride } from '../../domain/transit/ride.ts'
import { Button } from '../button.tsx'
import { Chips, meters } from '../chips.tsx'
import { Code } from '../code.tsx'
import { DAYS } from '../format.ts'
import { useTone } from '../theme.ts'

type Props = {
    rides: Ride[]
    path: string
    day: Day
    today: Day
    onDay: (d: Day) => void
    radius: number
    onRadius: (m: number) => void
    onRide: (r: Ride) => void
}

export function Rides({ rides, path, day, today, onDay, radius, onRadius, onRide }: Props) {
    const t = useTone()
    const when = DAYS[day].when
    const n = rides.length

    return (
        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
            <Chips day={day} today={today} onDay={onDay} radius={radius} onRadius={onRadius} />

            {n > 0 ? (
                <Text style={[s.small, { color: t.mute }]}>
                    <Text style={{ color: t.fg, fontWeight: '600' }}>{n === 1 ? '1 linha direta' : `${n} linhas diretas`}</Text> {when} · {path}
                </Text>
            ) : (
                <Text style={[s.dash, { color: t.mute, borderColor: t.edge }]}>
                    Nenhuma linha direta entre esses lugares {when}. Tenta aumentar a distância ou outro dia.
                </Text>
            )}

            <View>
                {rides.map((r, i) => (
                    <View key={r.line.id}>
                        {i > 0 && <View style={[s.sep, { backgroundColor: t.edge }]} />}
                        <Button variant="row" onPress={() => onRide(r)}>
                            <Code code={r.line.code} />
                            <View style={s.text}>
                                <Text style={[s.name, { color: t.fg }]} numberOfLines={2}>
                                    {r.line.name}
                                </Text>
                                <Text style={[s.small, { color: t.mute }]}>
                                    {r.hops()} {r.hops() === 1 ? 'parada' : 'paradas'} · anda {meters(r.board.meters)} + {meters(r.drop.meters)}
                                </Text>
                            </View>
                        </Button>
                    </View>
                ))}
            </View>
        </ScrollView>
    )
}

const s = StyleSheet.create({
    body: { gap: 14, paddingBottom: 48 },
    small: { fontSize: 14 },
    dash: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 16, padding: 16, fontSize: 14 },
    sep: { height: StyleSheet.hairlineWidth },
    text: { flex: 1, gap: 2 },
    name: { fontSize: 16 },
})
