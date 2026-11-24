import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import type { ComponentProps } from 'react'

export type Glyph = ComponentProps<typeof MaterialCommunityIcons>['name']

export function Icon({ name, color, size = 20 }: { name: Glyph; color: string; size?: number }) {
    return <MaterialCommunityIcons name={name} color={color} size={size} />
}
