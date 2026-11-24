import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { NetProvider } from '../ui/net.tsx'

export default function Layout() {
    return (
        <NetProvider>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }} />
        </NetProvider>
    )
}
