import React, { useState } from 'react';
import {
  IonTitle,
  IonToolbar,
  IonIcon,
  IonButtons,
  IonButton,
  useIonToast,
} from '@ionic/react';
import { add, gridOutline, hammerOutline, settingsOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { getTransform, useAnimatedPress } from '@utils/Utilities';
import { useSettings } from '@utils/useSettings';
import { SettingsModal } from '@components/SettingsModal';

const TopToolbar: React.FC<{
  onExport: () => Promise<void>;
  onImport: (file: File) => Promise<void>;
  hasHabits: boolean;
  onNewHabit: () => void;
}> = ({ onExport, onImport, hasHabits, onNewHabit }) => {
  const history = useHistory();
  const [present] = useIonToast();
  const { settings, updateSettings } = useSettings();
  const isGridVisible = settings.historyGrid ?? true;

  // Create animation states for each button
  const configButton = useAnimatedPress();
  const settingsButton = useAnimatedPress();
  const gridButton = useAnimatedPress();
  const addButton = useAnimatedPress();
  const [showSettings, setShowSettings] = useState(false);

  const toggleHistoryGrid = async () => {
    try {
      await updateSettings({ historyGrid: !isGridVisible });
      gridButton.handlePress();
    } catch {
      present({
        message: 'Failed to update history grid setting.',
        duration: 2500,
        position: 'top',
        color: 'danger',
      });
    }
  };

  return (
    <div className="top-toolbar ion-no-padding ion-no-margin">
      <IonToolbar>
        <IonButtons slot="start">
          <IonButton
            onClick={() => {
              settingsButton.handlePress(() => setShowSettings(true));
            }}
            style={{
              transform: getTransform(settingsButton.isPressed, 'scale'),
              transition: 'all 0.2s ease-in-out',
            }}
            aria-label="Settings"
          >
            <IonIcon slot="icon-only" icon={settingsOutline} />
          </IonButton>
          {hasHabits && (
            <>
              <IonButton
                onClick={() => {
                  configButton.handlePress(() => history.push('/widget-config'));
                }}
                style={{
                  transform: getTransform(configButton.isPressed, 'scale'),
                  transition: 'all 0.2s ease-in-out',
                }}
                aria-label="Widget Configuration"
              >
                <IonIcon slot="icon-only" icon={hammerOutline} />
              </IonButton>
              <IonButton
                onClick={toggleHistoryGrid}
                style={{
                  transform: getTransform(gridButton.isPressed, 'scale'),
                  opacity: isGridVisible ? 1 : 0.3,
                  transition: 'all 0.2s ease-in-out',
                }}
                aria-label="Toggle History Grid"
              >
                <IonIcon
                  slot="icon-only"
                  icon={gridOutline}
                />
              </IonButton>
            </>
          )}
        </IonButtons>
        <IonTitle className="app-title ion-text-center">SIMPLE<span className="cursive">Habits</span></IonTitle>
        <IonButtons slot="end">
          <IonButton
            onClick={() => {
              addButton.handlePress(onNewHabit);
            }}
            style={{
              transition: 'all 0.2s ease-in-out',
              transform: getTransform(addButton.isPressed, 'scale')
            }}
            aria-label="Add New Habit"
          >
            <IonIcon slot="icon-only" icon={add} />
          </IonButton>
        </IonButtons>
      </IonToolbar>
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onExport={onExport}
        onImport={onImport}
      />
    </div>  );
};

export { TopToolbar };