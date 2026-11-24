import { ScrollView, StyleSheet, Text, View } from 'react-native'
import type { Place } from '../../domain/geo/place.ts'
import type { Day } from '../../domain/transit/day.ts'
import type { Found } from '../../domain/transit/found.ts'
import { Button } from '../button.tsx'
import { Chips, meters } from '../chips.tsx'
import { Code } from '../code.tsx'
import { DAYS } from '../format.ts'
import { useTone } from '../theme.ts'

type Props = {
    place: Place
    found: Found | null
    day: Day
    today: Day
    onDay: (d: Day) => void
    radius: number
    onRadius: (m: number) => void
    onLine: (id: string) => void
    onClose: () => void
}

export function Near({ place, found, day, today, onDay, radius, onRadius, onLine, onClose }: Props) {
    const t = useTone()
    const when = DAYS[day].when
    const n = found?.passes.length ?? 0

    const head = !found
        ? ''
        : !found.wide
          ? `${n === 1 ? '1 linha passa' : `${n} linhas passam`} a até ${meters(radius)} de lá ${when}`
          : n
            ? `Nenhum ônibus passa a até ${meters(radius)} de lá ${when}. Os mais perto:`
            : `Nenhum ônibus a até 5 km de lá ${when}. Por enquanto a gente só cobre a Região Metropolitana do Recife.`

    return (
        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
            <View style={s.head}>
                <View style={s.title}>
                    <Text style={[s.name, { color: t.fg }]} numberOfLines={2}>
                        {place.name}
                    </Text>
                    {place.label !== '' && <Text style={[s.small, { color: t.mute }]}>{place.label}</Text>}
                </View>
                <Button variant="ghost" label="Trocar o destino" onPress={onClose}>
                    <Text style={[s.close, { color: t.fg }]}>✕</Text>
                </Button>
            </View>

            <Chips day={day} today={today} onDay={onDay} radius={radius} onRadius={onRadius} />

            {head !== '' && <Text style={[s.small, { color: t.mute }]}>{head}</Text>}

            <View>
                {found?.passes.map((p, i) => (
                    <View key={p.line.id}>
                        {i > 0 && <View style={[s.sep, { backgroundColor: t.edge }]} />}
                        <Button variant="row" onPress={() => onLine(p.line.id)}>
                            <Code code={p.line.code} />
                            <View style={s.title}>
                                <Text style={[s.line, { color: t.fg }]} numberOfLines={2}>
                                    {p.line.name}
                                </Text>
                                <Text style={[s.small, { color: t.mute }]} numberOfLines={1}>
                                    {meters(p.meters)} até {p.stop.name || `a parada ${p.stop.id}`}
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
    head: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    title: { flex: 1, gap: 2 },
    name: { fontSize: 20, fontWeight: '600' },
    line: { fontSize: 16 },
    small: { fontSize: 14 },
    close: { fontSize: 18 },
    sep: { height: StyleSheet.hairlineWidth },
})
