import * as Notifications from 'expo-notifications'

const CHANNEL = 'bus'

Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
})

export const alarm = {
    async ready(): Promise<boolean> {
        await Notifications.setNotificationChannelAsync(CHANNEL, { name: 'Avisos de ônibus', importance: Notifications.AndroidImportance.HIGH })

        if (!(await Notifications.requestPermissionsAsync()).granted) {
            return false
        }

        const exact = await Notifications.getExactAlarmPermissionsAsync()

        if (!exact.granted) {
            await Notifications.requestExactAlarmPermissionsAsync()
        }

        return true
    },

    set(at: Date, title: string, body: string): Promise<string> {
        return Notifications.scheduleNotificationAsync({
            content: { title, body, sound: true },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: CHANNEL },
        })
    },

    cancel(id: string): Promise<void> {
        return Notifications.cancelScheduledNotificationAsync(id)
    },

    async list(): Promise<string[]> {
        return (await Notifications.getAllScheduledNotificationsAsync()).map((n) => n.identifier)
    },
}
