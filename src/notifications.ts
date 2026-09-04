import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function scheduleDailyPackingReminder(hour = 19, minute = 0) {
  const permissions = await Notifications.requestPermissionsAsync();
  if (!permissions.granted) return false;

  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Prépare ton sac',
      body: 'Vérifie les cours de demain et les affaires à prendre.',
      data: { type: 'packing-reminder' },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
  });
  return true;
}
