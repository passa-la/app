import { Camera, type CameraRef, GeoJSONSource, Layer, Map } from '@maplibre/maplibre-react-native'
import { useEffect, useMemo, useRef } from 'react'
import { StyleSheet } from 'react-native'
import type { Point } from '../../domain/geo/point.ts'
import type { Stop } from '../../domain/transit/stop.ts'
import type { Way } from '../../domain/transit/way.ts'
import { useTone } from '../theme.ts'

const STYLE = 'https://tiles.openfreemap.org/styles/liberty'
const INK = '#17150f'
const HUB: [number, number] = [-34.8711, -8.0631]
const SIDE = 3
const DIM = 0.22
const PAD = { top: 40, right: 40, bottom: 40, left: 40 }

type Props = {
    ways: Way[]
    focus: number | null
    board: Stop | null
    drop: Stop | null
    onStop: (id: string) => void
}

const pair = (p: Point): [number, number] => [p.lon, p.lat]

const dot = (s: Stop, props: Record<string, string | number>): GeoJSON.Feature => ({
    type: 'Feature',
    properties: props,
    geometry: { type: 'Point', coordinates: pair(s.point) },
})

const box = (pts: Point[]): [number, number, number, number] | null => {
    if (!pts.length) {
        return null
    }

    const lons = pts.map((p) => p.lon)
    const lats = pts.map((p) => p.lat)

    return [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)]
}

export function LineMap({ ways, focus, board, drop, onStop }: Props) {
    const t = useTone()
    const cam = useRef<CameraRef>(null)
    const shown = useMemo(() => ways.filter((w) => focus === null || w.dir === focus), [ways, focus])

    const paths = useMemo<GeoJSON.FeatureCollection>(
        () => ({
            type: 'FeatureCollection',
            features: ways
                .filter((w) => w.points.length > 1)
                .map((w) => ({ type: 'Feature', properties: { dir: w.dir }, geometry: { type: 'LineString', coordinates: w.points.map(pair) } })),
        }),
        [ways],
    )

    const stops = useMemo<GeoJSON.FeatureCollection>(
        () => ({ type: 'FeatureCollection', features: shown.flatMap((w) => w.stops.map((s) => dot(s, { id: s.id, dir: w.dir }))) }),
        [shown],
    )

    const marks = useMemo<GeoJSON.FeatureCollection>(
        () => ({
            type: 'FeatureCollection',
            features: [...(drop ? [dot(drop, { kind: 'drop' })] : []), ...(board ? [dot(board, { kind: 'board' })] : [])],
        }),
        [board, drop],
    )

    const bounds = useMemo(() => box(shown.flatMap((w) => (w.points.length ? w.points : w.stops.map((s) => s.point)))), [shown])
    const key = bounds?.join(',') ?? ''

    useEffect(() => {
        if (bounds) {
            cam.current?.fitBounds(bounds, { padding: PAD, duration: 500 })
        }
    }, [key])

    const round = { 'line-cap': 'round', 'line-join': 'round' } as const

    return (
        <Map style={s.map} mapStyle={STYLE} logo={false} compass={false}>
            <Camera ref={cam} initialViewState={bounds ? { bounds, padding: PAD } : { center: HUB, zoom: 11 }} />

            <GeoJSONSource id="paths" data={paths}>
                <Layer
                    id="path-case"
                    type="line"
                    layout={round}
                    paint={{
                        'line-color': INK,
                        'line-width': 8,
                        'line-offset': SIDE,
                        'line-opacity': focus === null ? 1 : ['match', ['get', 'dir'], focus, 1, DIM],
                    }}
                />
                <Layer
                    id="path-line"
                    type="line"
                    layout={round}
                    paint={{
                        'line-color': ['match', ['get', 'dir'], 1, t.back, t.sun],
                        'line-width': 4.5,
                        'line-offset': SIDE,
                        'line-opacity': focus === null ? 1 : ['match', ['get', 'dir'], focus, 1, DIM],
                    }}
                />
            </GeoJSONSource>

            <GeoJSONSource
                id="stops"
                data={stops}
                onPress={(e) => {
                    const id = e.nativeEvent.features[0]?.properties?.id

                    if (id !== undefined) {
                        onStop(String(id))
                    }
                }}
            >
                <Layer
                    id="stops"
                    type="circle"
                    paint={{
                        'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 2.5, 15, 6],
                        'circle-color': '#ffffff',
                        'circle-stroke-color': INK,
                        'circle-stroke-width': 1.5,
                    }}
                />
            </GeoJSONSource>

            <GeoJSONSource id="marks" data={marks}>
                <Layer
                    id="drop"
                    type="circle"
                    filter={['==', ['get', 'kind'], 'drop']}
                    paint={{ 'circle-radius': 8, 'circle-color': INK, 'circle-stroke-color': t.sun, 'circle-stroke-width': 4 }}
                />
                <Layer
                    id="board"
                    type="circle"
                    filter={['==', ['get', 'kind'], 'board']}
                    paint={{ 'circle-radius': 9, 'circle-color': '#ffffff', 'circle-stroke-color': INK, 'circle-stroke-width': 4.5 }}
                />
            </GeoJSONSource>
        </Map>
    )
}

const s = StyleSheet.create({
    map: { flex: 1 },
})
