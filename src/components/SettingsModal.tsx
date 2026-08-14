import React, { useRef } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonToggle,
  IonDatetime,
  IonIcon,
  useIonToast,
  type DatetimeCustomEvent,
  type ToggleCustomEvent,
} from '@ionic/react';
import { useSettings } from '@utils/useSettings';
import { cloudUploadOutline, downloadOutline } from 'ionicons/icons';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => Promise<void>;
  onImport: (file: File) => Promise<void>;
}

export const SettingsModal: React.FC<Props> = ({ isOpen, onClose, onExport, onImport }) => {
  const { settings, updateSettings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [present] = useIonToast();

  const handleReminderToggle = async (event: ToggleCustomEvent) => {
    const enabled = event.detail.checked;
    try {
      const status = await updateSettings({
        reminderEnabled: enabled,
        ...(enabled && !settings.reminderTime ? { reminderTime: '20:00' } : {}),
      });
      if (enabled && status === 'permission-denied') {
        await updateSettings({ reminderEnabled: false });
        present({
          message: 'Notification permission denied. Enable notifications in system settings.',
          duration: 3500,
          position: 'top',
          color: 'warning',
        });
      }
    } catch {
      present({
        message: 'Failed to update reminder settings.',
        duration: 2500,
        position: 'top',
        color: 'danger',
      });
    }
  };

  const handleTimeChange = async (event: DatetimeCustomEvent) => {
    // Value arrives as an ISO string, e.g. "2023-10-10T20:00:00".
    if (typeof event.detail.value === 'string') {
      const timePart = event.detail.value.split('T')[1]?.substring(0, 5);
      if (timePart) {
        try {
          const status = await updateSettings({ reminderTime: timePart });
          if (status === 'invalid-time') throw new Error('Invalid reminder time');
        } catch {
          present({
            message: 'Failed to update reminder time.',
            duration: 2500,
            position: 'top',
            color: 'danger',
          });
        }
      }
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await onImport(file);
        onClose();
      } catch {
        // Parent displays the operation-specific error; keep settings open.
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const handleExportClick = async () => {
    try {
      await onExport();
      onClose();
    } catch {
      // Parent displays the operation-specific error; keep settings open.
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Settings</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>Done</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList>
          <IonItem>
            <IonLabel>
              <h2>Daily Reminders</h2>
              <p>Get notified to check off your habits</p>
            </IonLabel>
            <IonToggle 
              aria-label="Daily reminders"
              checked={!!settings.reminderEnabled} 
              onIonChange={handleReminderToggle} 
            />
          </IonItem>
          {settings.reminderEnabled && (
            <IonItem>
              <IonLabel>Reminder Time</IonLabel>
              <IonDatetime
                aria-label="Reminder time"
                presentation="time"
                preferWheel={true}
                value={`1970-01-01T${settings.reminderTime || '20:00'}:00`}
                onIonChange={handleTimeChange}
                style={{ background: 'transparent' }}
              />
            </IonItem>
          )}

          <IonItem button onClick={handleExportClick}>
            <IonIcon icon={downloadOutline} slot="start" />
            <IonLabel>
              <h2>Export Data</h2>
              <p>Download your habits as a CSV file</p>
            </IonLabel>
          </IonItem>

          <IonItem button onClick={handleImportClick}>
            <IonIcon icon={cloudUploadOutline} slot="start" />
            <IonLabel>
              <h2>Import Data</h2>
              <p>Restore your habits from a CSV file</p>
            </IonLabel>
          </IonItem>
          <input
            aria-label="Import habits CSV file"
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleFileChange}
          />
        </IonList>
      </IonContent>
    </IonModal>
  );
};
