import { useColorScheme } from 'react-native'
import { dark, light, type Tone } from './tone.ts'

export const useTone = (): Tone => (useColorScheme() === 'dark' ? dark : light)
