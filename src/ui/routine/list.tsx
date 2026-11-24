import { useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import { type Routine, WEEK } from '../../domain/routine/routine.ts'
import { Button } from '../button.tsx'
import { Code } from '../code.tsx'
import { Icon } from '../icon.tsx'
import type { Kit } from '../net.tsx'
import { useTone } from '../theme.ts'
import { Editor, type Seed } from './editor.tsx'
import type { Routines } from './use.ts'

const SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

const same = (a: number[], b: number[]) => a.length === b.length && a.every((x) => b.includes(x))

const when = (r: Routine) => {
    const h = `${String(Math.floor(r.time / 60)).padStart(2, '0')}:${String(r.time % 60).padStart(2, '0')}`
    const d = same(r.days, WEEK.all) ? 'todo dia' : same(r.days, WEEK.work) ? 'seg a sex' : same(r.days, WEEK.rest) ? 'fim de semana' : r.days.map((x) => SHORT[x]).join(', ')

    return `${h} · ${d}`
}

type Props = {
    open: boolean
    kit: Kit | null
    routines: Routines
    seed: Seed
    draft: Seed | null
    onDraft: () => void
    onMap: (seed: Seed) => void
    onClose: () => void
}

export function Plans({ open, kit, routines, seed, draft, onDraft, onMap, onClose }: Props) {
    const t = useTone()
    const [edit, setEdit] = useState<Routine | 'new' | null>(null)
    const list = [...routines.all].sort((a, b) => a.time - b.time)

    const close = () => {
        setEdit(null)
        onDraft()
        onClose()
    }

    const back = () => {
        setEdit(null)
        onDraft()
    }

    const editing = draft !== null || edit !== null

    return (
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => (editing ? back() : close())}>
            <Pressable style={s.back} onPress={close}>
                <Pressable style={[s.card, { backgroundColor: t.paper, borderColor: t.edge }]} onPress={() => {}}>
                    <View style={s.head}>
                        <Text style={[s.title, { color: t.fg }]}>{editing ? (draft?.id || (edit && edit !== 'new') ? 'Editar rotina' : 'Nova rotina') : 'Rotinas'}</Text>
                        <Button variant="ghost" label="Fechar" onPress={close}>
                            <Icon name="close" color={t.fg} size={22} />
                        </Button>
                    </View>

                    {editing && kit ? (
                        <Editor
                            key={JSON.stringify(draft)}
                            kit={kit}
                            seed={draft ?? seed}
                            edit={draft || edit === 'new' ? null : edit}
                            onCancel={back}
                            onMap={(sd) => {
                                setEdit(null)
                                onMap(sd)
                            }}
                            onSave={(r) => {
                                routines.save(r)
                                back()
                            }}
                        />
                    ) : (
                        <>
                            {!list.length && (
                                <Text style={[s.small, { color: t.mute }]}>
                                    Uma rotina avisa no horário quanto falta pro ônibus da sua parada, todo dia que você escolher.
                                </Text>
                            )}
                            <ScrollView>
                                {list.map((r, i) => (
                                    <View key={r.id}>
                                        {i > 0 && <View style={[s.sep, { backgroundColor: t.edge }]} />}
                                        <View style={s.row}>
                                            <Button variant="row" onPress={() => setEdit(r)} style={s.grow}>
                                                <Code code={r.code} />
                                                <View style={s.grow}>
                                                    <Text style={[s.name, { color: r.on ? t.fg : t.mute }]} numberOfLines={1}>
                                                        {r.from} → {r.to}
                                                    </Text>
                                                    <Text style={[s.small, { color: t.mute }]}>{when(r)}</Text>
                                                </View>
                                            </Button>
                                            <Switch
                                                value={r.on}
                                                onValueChange={() => routines.toggle(r.id)}
                                                thumbColor={r.on ? t.sun : undefined}
                                                accessibilityLabel={r.on ? 'Desligar rotina' : 'Ligar rotina'}
                                            />
                                            <Button variant="ghost" label="Excluir rotina" onPress={() => routines.remove(r.id)}>
                                                <Icon name="close" color={t.alert} />
                                            </Button>
                                        </View>
                                    </View>
                                ))}
                            </ScrollView>
                            <Button onPress={() => setEdit('new')} disabled={!kit} style={s.add}>
                                <Text style={[s.small, { color: t.sunInk, fontWeight: '600' }]}>+ Nova rotina</Text>
                            </Button>
                        </>
                    )}
                </Pressable>
            </Pressable>
        </Modal>
    )
}

const s = StyleSheet.create({
    back: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-start', paddingTop: 70, paddingHorizontal: 12 },
    card: { borderWidth: 1, borderRadius: 20, padding: 16, maxHeight: '86%', gap: 8 },
    head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    title: { fontSize: 18, fontWeight: '600' },
    row: { flexDirection: 'row', alignItems: 'center' },
    grow: { flex: 1 },
    name: { fontSize: 15 },
    small: { fontSize: 14 },
    sep: { height: StyleSheet.hairlineWidth },
    add: { alignSelf: 'flex-start', marginTop: 6 },
})
