import { LocalNotifications } from '@capacitor/local-notifications';
import { App as CapacitorApp } from '@capacitor/app';
import { HabitStorageWrapper } from './Storage';

export type NotificationSyncStatus =
  | 'scheduled'
  | 'disabled'
  | 'permission-denied'
  | 'invalid-time';

export class NotificationService {
  private static initialized = false;

  static async requestPermissions(): Promise<boolean> {
    const current = await LocalNotifications.checkPermissions();
    if (current.display === 'granted') return true;
    if (current.display === 'denied') return false;
    const { display } = await LocalNotifications.requestPermissions();
    return display === 'granted';
  }

  static async scheduleDailyReminder(timeString: string): Promise<NotificationSyncStatus> {
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(timeString);
    if (!match) return 'invalid-time';

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      await this.cancelReminders();
      return 'permission-denied';
    }

    const hour = Number(match[1]);
    const minute = Number(match[2]);
    await this.cancelReminders();
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 1, // Fixed ID for the daily reminder
          title: 'Habit Tracker',
          body: 'Time to check off your habits for today! 🚀',
          schedule: {
            on: {
              hour,
              minute,
            },
            repeats: true,
            allowWhileIdle: true,
          },
        },
      ],
    });
    return 'scheduled';
  }

  static async cancelReminders() {
    await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
  }

  static async syncFromSettings(): Promise<NotificationSyncStatus> {
    const settings = await HabitStorageWrapper.handleSettings('load');
    if (settings.reminderEnabled) {
      if (!settings.reminderTime) {
        await this.cancelReminders();
        return 'invalid-time';
      }
      const status = await this.scheduleDailyReminder(settings.reminderTime);
      if (status === 'invalid-time') await this.cancelReminders();
      return status;
    }
    await this.cancelReminders();
    return 'disabled';
  }

  static async initialize(): Promise<NotificationSyncStatus> {
    if (!this.initialized) {
      this.initialized = true;
      await CapacitorApp.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          void this.syncFromSettings().catch(error => {
            console.error('Failed to sync notifications on resume:', error);
          });
        }
      });
    }
    return this.syncFromSettings();
  }
}
