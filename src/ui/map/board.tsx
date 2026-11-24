import { Camera, type CameraRef, GeoJSONSource, Images, Layer, Map } from '@maplibre/maplibre-react-native'
import { useEffect, useMemo, useRef } from 'react'
import { StyleSheet } from 'react-native'
import { Point } from '../../domain/geo/point.ts'
import type { Stop } from '../../domain/transit/stop.ts'
import type { Way } from '../../domain/transit/way.ts'
import { ring } from './shape.ts'
import { useTone } from '../theme.ts'

const STYLE = 'https://tiles.openfreemap.org/styles/liberty'
const ICONS = { me: require('../../../assets/me.png'), bus: require('../../../assets/bus.png'), cone: require('../../../assets/cone.png') }
const INK = '#17150f'
const HUB: [number, number] = [-34.8711, -8.0631]
const SIDE = 3
const DIM = 0.22
const EDGE = 40

type Props = {
    ways: Way[]
    focus: number | null
    board: Stop | null
    drop: Stop | null
    onStop: (id: string) => void
    bottom?: number
    places?: Point[]
    radius?: number
    me?: Point | null
    deg?: number | null
    onTap?: (p: Point) => void
    walk?: Point[]
    bus?: boolean
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

export function Board({ ways, focus, board, drop, onStop, bottom = 0, places = [], radius = 0, me = null, deg = null, onTap, walk = [], bus = false }: Props) {
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

    const area = useMemo<GeoJSON.FeatureCollection>(
        () => ({ type: 'FeatureCollection', features: radius ? places.map((p) => ring(p, radius)) : [] }),
        [places, radius],
    )

    const pin = useMemo<GeoJSON.FeatureCollection>(
        () => ({
            type: 'FeatureCollection',
            features: places.map((p) => ({ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: pair(p) } })),
        }),
        [places],
    )

    const steps = useMemo<GeoJSON.FeatureCollection>(
        () => ({
            type: 'FeatureCollection',
            features: walk.length > 1 ? [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: walk.map(pair) } }] : [],
        }),
        [walk],
    )

    const you = useMemo<GeoJSON.FeatureCollection>(
        () => ({
            type: 'FeatureCollection',
            features: me ? [{ type: 'Feature', properties: { deg: deg ?? 0, aim: deg === null ? 0 : 1, bus: bus ? 1 : 0 }, geometry: { type: 'Point', coordinates: pair(me) } }] : [],
        }),
        [me, deg, bus],
    )

    const bounds = useMemo(() => {
        const line = shown.flatMap((w) => (w.points.length ? w.points : w.stops.map((s) => s.point)))

        if (line.length) {
            return box([...line, ...places, ...(me ? [me] : [])])
        }

        if (places.length && radius) {
            const c = places.flatMap((p) => (ring(p, radius).geometry as GeoJSON.Polygon).coordinates[0])

            return box(c.map(([lon, lat]) => ({ lat, lon }) as Point))
        }

        return null
    }, [shown, places, radius])
    const key = `${bounds?.join(',') ?? ''}|${bottom}`
    const pad = { top: EDGE + 40, right: EDGE, bottom: EDGE + bottom, left: EDGE }

    useEffect(() => {
        if (bounds) {
            cam.current?.fitBounds(bounds, { padding: pad, duration: 500 })
        }
    }, [key])

    const round = { 'line-cap': 'round', 'line-join': 'round' } as const

    return (
        <Map
            style={s.map}
            mapStyle={STYLE}
            logo={false}
            compass={false}
            touchRotate={false}
            touchPitch={false}
            onPress={(e) => {
                const [lon, lat] = e.nativeEvent.lngLat

                onTap?.(new Point(lat, lon))
            }}
        >
            <Camera ref={cam} initialViewState={bounds ? { bounds, padding: pad } : { center: HUB, zoom: 11 }} />

            <GeoJSONSource id="area" data={area}>
                <Layer id="area-fill" type="fill" paint={{ 'fill-color': t.sun, 'fill-opacity': 0.14 }} />
                <Layer id="area-edge" type="line" paint={{ 'line-color': INK, 'line-width': 1.25, 'line-opacity': 0.55, 'line-dasharray': [3, 2] }} />
            </GeoJSONSource>

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

            <GeoJSONSource id="walk" data={steps}>
                <Layer
                    id="walk"
                    type="line"
                    layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                    paint={{ 'line-color': INK, 'line-width': 4, 'line-dasharray': [0.2, 1.8] }}
                />
            </GeoJSONSource>

            <GeoJSONSource
                id="stops"
                data={stops}
                onPress={(e) => {
                    const id = e.nativeEvent.features[0]?.properties?.id

                    if (id !== undefined) {
                        e.stopPropagation()
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

            <GeoJSONSource id="pin" data={pin}>
                <Layer id="pin" type="circle" paint={{ 'circle-radius': 9, 'circle-color': INK, 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 3 }} />
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

            <Images images={ICONS} />

            <GeoJSONSource id="you" data={you}>
                <Layer
                    id="you-cone"
                    type="symbol"
                    filter={['==', ['get', 'aim'], 1]}
                    layout={{
                        'icon-image': 'cone',
                        'icon-size': 0.32,
                        'icon-anchor': 'bottom',
                        'icon-rotate': ['get', 'deg'],
                        'icon-rotation-alignment': 'map',
                        'icon-pitch-alignment': 'map',
                        'icon-allow-overlap': true,
                        'icon-ignore-placement': true,
                    }}
                />
                <Layer
                    id="you"
                    type="symbol"
                    layout={{ 'icon-image': ['case', ['==', ['get', 'bus'], 1], 'bus', 'me'], 'icon-size': 0.25, 'icon-anchor': 'bottom', 'icon-allow-overlap': true, 'icon-ignore-placement': true }}
                />
            </GeoJSONSource>
        </Map>
    )
}

const s = StyleSheet.create({
    map: { flex: 1 },
})
