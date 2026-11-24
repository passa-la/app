import { Box } from '../domain/geo/box.ts'
import { Point } from '../domain/geo/point.ts'
import { Region } from '../domain/geo/region.ts'

export const area = new Region(Box.of([-9.6, -41.5, -7.1, -34.7]), new Point(-8.0631, -34.8711), 'Pernambuco')
