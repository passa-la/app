import { type ReactNode, useEffect, useMemo, useRef } from 'react'
import { Animated, PanResponder, StyleSheet, useWindowDimensions, View } from 'react-native'
import { useTone } from './theme.ts'

export type Snap = 'peek' | 'mid' | 'full'

const PEEK = 168
const ORDER: Snap[] = ['peek', 'mid', 'full']
const GRIP = 36
const TAP = 6

type Props = {
    snap: Snap
    onSnap: (s: Snap) => void
    children: ReactNode
}

export const height = (s: Snap, screen: number) => (s === 'peek' ? PEEK : s === 'mid' ? screen * 0.5 : screen * 0.9)

export function Sheet({ snap, onSnap, children }: Props) {
    const t = useTone()
    const { height: screen } = useWindowDimensions()
    const top = (s: Snap) => screen - height(s, screen)
    const y = useRef(new Animated.Value(top(snap))).current
    const base = useRef(top(snap))

    useEffect(() => {
        base.current = top(snap)
        Animated.spring(y, { toValue: base.current, useNativeDriver: true, bounciness: 2 }).start()
    }, [snap, screen])

    const pan = useMemo(
        () =>
            PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
                onPanResponderMove: (_, g) => y.setValue(Math.max(top('full'), base.current + g.dy)),
                onPanResponderRelease: (_, g) => {
                    if (Math.abs(g.dy) < TAP) {
                        onSnap(snap === 'full' ? 'mid' : 'full')
                        return
                    }

                    const at = base.current + g.dy + g.vy * 120
                    const next = ORDER.reduce((a, b) => (Math.abs(top(b) - at) < Math.abs(top(a) - at) ? b : a))

                    if (next === snap) {
                        Animated.spring(y, { toValue: base.current, useNativeDriver: true, bounciness: 2 }).start()
                    }

                    onSnap(next)
                },
            }),
        [snap, screen, onSnap],
    )

    return (
        <Animated.View style={[s.sheet, { backgroundColor: t.paper, height: screen, transform: [{ translateY: y }] }]}>
            <View {...pan.panHandlers} accessible accessibilityRole="adjustable" accessibilityLabel="Gaveta" style={s.grip}>
                <View style={[s.bar, { backgroundColor: t.edge }]} />
            </View>
            <View style={[s.body, { height: height('full', screen) - GRIP }]}>{children}</View>
        </Animated.View>
    )
}

const s = StyleSheet.create({
    sheet: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 16,
    },
    grip: { height: GRIP, alignItems: 'center', justifyContent: 'center' },
    bar: { width: 44, height: 5, borderRadius: 3 },
    body: { paddingHorizontal: 16 },
})
