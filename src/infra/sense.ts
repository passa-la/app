import * as Location from 'expo-location'

export type Fix = { lat: number; lon: number; at: number; speed: number | null }

export const sense = {
    async ask(): Promise<boolean> {
        return (await Location.requestForegroundPermissionsAsync()).granted
    },

    async granted(): Promise<boolean> {
        return (await Location.getForegroundPermissionsAsync()).granted
    },

    async watch(on: (f: Fix) => void): Promise<() => void> {
        const sub = await Location.watchPositionAsync({ accuracy: Location.Accuracy.High, distanceInterval: 5, timeInterval: 3000 }, (p) =>
            on({ lat: p.coords.latitude, lon: p.coords.longitude, at: p.timestamp, speed: p.coords.speed ?? null }),
        )

        return () => sub.remove()
    },

    async heading(on: (deg: number) => void): Promise<() => void> {
        const sub = await Location.watchHeadingAsync((h) => on(h.trueHeading >= 0 ? h.trueHeading : h.magHeading))

        return () => sub.remove()
    },
}
