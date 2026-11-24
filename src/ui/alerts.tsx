import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { Alert } from './alarms.ts'
import { Button } from './button.tsx'
import { Code } from './code.tsx'
import { Icon } from './icon.tsx'
import { clock, wait } from './format.ts'
import { useTone } from './theme.ts'

const ZONE = 3 * 3600

const at = (ms: number) => clock(Math.floor(ms / 1000) - ZONE)

export function Bell({ count, onPress }: { count: number; onPress: () => void }) {
    const t = useTone()

    return (
        <Button variant="plain" label={`${count} ${count === 1 ? 'aviso agendado' : 'avisos agendados'}`} onPress={onPress} style={s.bell}>
            <Icon name="bell" color={t.sunInk} size={18} />
            <Text style={[s.count, { color: t.sunInk }]}>{count}</Text>
        </Button>
    )
}

type Props = {
    open: boolean
    alerts: Alert[]
    onClose: () => void
    onLine: (a: Alert) => void
    onCancel: (key: string) => void
}

export function Alerts({ open, alerts, onClose, onLine, onCancel }: Props) {
    const t = useTone()
    const list = [...alerts].sort((a, b) => a.bus - b.bus)

    return (
        <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable style={s.back} onPress={onClose}>
                <Pressable style={[s.card, { backgroundColor: t.paper, borderColor: t.edge }]} onPress={() => {}}>
                    <View style={s.head}>
                        <Text style={[s.title, { color: t.fg }]}>Avisos agendados</Text>
                        <Button variant="ghost" label="Fechar" onPress={onClose}>
                            <Icon name="close" color={t.fg} size={22} />
                        </Button>
                    </View>
                    {!list.length && <Text style={[s.small, { color: t.mute }]}>Nenhum aviso agendado.</Text>}
                    <ScrollView>
                        {list.map((a, i) => (
                            <View key={a.key}>
                                {i > 0 && <View style={[s.sep, { backgroundColor: t.edge }]} />}
                                <View style={s.row}>
                                    <Button variant="row" onPress={() => onLine(a)} style={s.grow}>
                                        <Code code={a.code} />
                                        <View style={s.grow}>
                                            <Text style={[s.name, { color: t.fg }]} numberOfLines={1}>
                                                {a.name}
                                            </Text>
                                            <Text style={[s.small, { color: t.mute }]}>
                                                ônibus às {at(a.bus)} · avisa {a.lead} min antes · {wait(Math.floor((a.bus - Date.now()) / 60000))}
                                            </Text>
                                        </View>
                                    </Button>
                                    <Button variant="ghost" label="Cancelar aviso" onPress={() => onCancel(a.key)}>
                                        <Icon name="close" color={t.alert} />
                                    </Button>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                </Pressable>
            </Pressable>
        </Modal>
    )
}

const s = StyleSheet.create({
    bell: { paddingHorizontal: 12, paddingVertical: 8, elevation: 6 },
    count: { fontSize: 15, fontWeight: '700' },
    back: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-start', paddingTop: 80, paddingHorizontal: 16 },
    card: { borderWidth: 1, borderRadius: 20, padding: 16, maxHeight: '70%', gap: 8 },
    head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    title: { fontSize: 18, fontWeight: '600' },
    row: { flexDirection: 'row', alignItems: 'center' },
    grow: { flex: 1 },
    name: { fontSize: 15 },
    small: { fontSize: 13 },
    sep: { height: StyleSheet.hairlineWidth },
})
