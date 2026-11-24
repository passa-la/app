import type { ReactNode } from 'react'
import { Pressable, type StyleProp, StyleSheet, type ViewStyle } from 'react-native'
import type { Tone } from './tone.ts'
import { useTone } from './theme.ts'

export type Variant = 'plain' | 'ghost' | 'chip' | 'row'

type Props = {
    children: ReactNode
    onPress?: () => void
    variant?: Variant
    on?: boolean
    disabled?: boolean
    label?: string
    style?: StyleProp<ViewStyle>
}

const look = (t: Tone, v: Variant, on: boolean): ViewStyle => {
    switch (v) {
        case 'plain':
            return { backgroundColor: t.sun, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 }
        case 'ghost':
            return { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 }
        case 'chip':
            return {
                borderRadius: 999,
                borderWidth: 1,
                borderColor: on ? t.fg : t.edge,
                backgroundColor: on ? t.fg : t.card,
                paddingHorizontal: 12,
                paddingVertical: 7,
            }
        case 'row':
            return { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 12 }
    }
}

export function Button({ children, onPress, variant = 'plain', on = false, disabled = false, label, style }: Props) {
    const t = useTone()

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected: on, disabled }}
            style={({ pressed }) => [s.base, look(t, variant, on), pressed && s.pressed, disabled && s.off, style]}
        >
            {children}
        </Pressable>
    )
}

const s = StyleSheet.create({
    base: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    pressed: { opacity: 0.7 },
    off: { opacity: 0.45 },
})
