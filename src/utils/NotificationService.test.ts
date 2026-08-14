import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  checkPermissions: vi.fn(),
  requestPermissions: vi.fn(),
  schedule: vi.fn(),
  cancel: vi.fn(),
  handleSettings: vi.fn(),
}));

vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    checkPermissions: mocks.checkPermissions,
    requestPermissions: mocks.requestPermissions,
    schedule: mocks.schedule,
    cancel: mocks.cancel,
  },
}));
vi.mock('@capacitor/app', () => ({
  App: { addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }) },
}));
vi.mock('./Storage', () => ({
  HabitStorageWrapper: { handleSettings: mocks.handleSettings },
}));

import { NotificationService } from './NotificationService';

describe('NotificationService', () => {
  beforeEach(() => {
    Object.values(mocks).forEach(mock => mock.mockReset());
    mocks.cancel.mockResolvedValue(undefined);
    mocks.schedule.mockResolvedValue(undefined);
  });

  it('returns invalid-time without requesting permission', async () => {
    await expect(NotificationService.scheduleDailyReminder('25:00'))
      .resolves.toBe('invalid-time');
    expect(mocks.checkPermissions).not.toHaveBeenCalled();
  });

  it('reports denied permission and removes stale reminders', async () => {
    mocks.checkPermissions.mockResolvedValue({ display: 'denied' });

    await expect(NotificationService.scheduleDailyReminder('20:00'))
      .resolves.toBe('permission-denied');
    expect(mocks.cancel).toHaveBeenCalled();
    expect(mocks.schedule).not.toHaveBeenCalled();
  });

  it('reports invalid persisted time and cancels stale reminders', async () => {
    mocks.handleSettings.mockResolvedValue({
      reminderEnabled: true,
      reminderTime: 'bad',
    });

    await expect(NotificationService.syncFromSettings()).resolves.toBe('invalid-time');
    expect(mocks.cancel).toHaveBeenCalled();
  });
});
