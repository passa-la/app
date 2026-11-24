import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { Occurrence } from '../../domain/routine/agenda.ts'
import { Button } from '../button.tsx'
import { clock, wait } from '../format.ts'
import { useTone } from '../theme.ts'

const ZONE = 3 * 3600

const hm = (ms: number) => clock(Math.floor(ms / 1000) - ZONE)

type Props = {
    live: Occurrence
    next: { bus: number; arrive: number | null } | null
    now: number
    top: number
    onOpen: () => void
    onDone: () => void
}

export function Bar({ live, next, now, top, onOpen, onDone }: Props) {
    const t = useTone()
    const r = live.routine
    const left = next ? Math.max(0, Math.floor((next.bus - now) / 60000)) : null

    return (
        <View style={[s.wrap, { top }]} pointerEvents="box-none">
            <Pressable onPress={onOpen} style={[s.bar, { backgroundColor: t.fg }]} accessibilityRole="button" accessibilityLabel="Abrir a rotina no mapa">
                <View style={[s.code, { backgroundColor: t.sun }]}>
                    <Text style={[s.codeText, { color: t.sunInk }]}>{r.code}</Text>
                </View>
                <View style={s.text}>
                    <Text style={[s.main, { color: t.paper }]} numberOfLines={1}>
                        {next ? `Ônibus ${wait(left ?? 0)} · ${hm(next.bus)}` : 'Sem mais ônibus hoje'}
                    </Text>
                    <Text style={[s.sub, { color: t.edge }]} numberOfLines={1}>
                        {r.from}
                        {next?.arrive ? ` · chega ~${hm(next.arrive)}` : ''}
                    </Text>
                </View>
                <Button variant="chip" onPress={onDone} style={s.done}>
                    <Text style={[s.sub, { color: t.fg }]}>Desci</Text>
                </Button>
            </Pressable>
        </View>
    )
}

const s = StyleSheet.create({
    wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: 12 },
    bar: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 999, paddingLeft: 8, paddingRight: 8, paddingVertical: 8, maxWidth: 520, width: '100%', elevation: 8 },
    code: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
    codeText: { fontSize: 14, fontWeight: '700' },
    text: { flex: 1 },
    main: { fontSize: 15, fontWeight: '600' },
    sub: { fontSize: 12 },
    done: { paddingHorizontal: 12, paddingVertical: 6 },
})
