// TopToolbar.tsx
import {
  IonTitle,
  IonToolbar,
  IonIcon,
  IonButtons,
  IonButton
} from '@ionic/react';
import { handleSettings } from '@utils/Storage';
import { add, downloadOutline, gridOutline, hammerOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { applyGridVisibility, getTransform, useAnimatedPress } from '@utils/Utilities';

const TopToolbar: React.FC<{
  onExport: () => Promise<void>;
  hasHabits: boolean;
  onNewHabit: () => void;
  initialHistoryGridSetting: boolean;
}> = ({ onExport, hasHabits, onNewHabit, initialHistoryGridSetting }) => {
  const history = useHistory();
  const [isGridVisible, setIsGridVisible] = useState(initialHistoryGridSetting);
  
  // Create animation states for each button
  const configButton = useAnimatedPress();
  const gridButton = useAnimatedPress();
  const exportButton = useAnimatedPress();
  const addButton = useAnimatedPress();

  // Apply initial visibility when the component mounts
  useEffect(() => {
    applyGridVisibility(initialHistoryGridSetting);
    setIsGridVisible(initialHistoryGridSetting);
  }, [initialHistoryGridSetting]);

  const toggleHistoryGrid = async () => {
    try {
      const settings = await handleSettings('load');
      const currentValue = settings.historyGrid ?? true;
      const newValue = !currentValue;
      await handleSettings('save', { ...settings, historyGrid: newValue });
      applyGridVisibility(newValue);
      setIsGridVisible(newValue);
      gridButton.handlePress();
    } catch (error) {
      console.error('Error toggling history grid:', error);
    }
  };

  return (
    <div className="top-toolbar ion-no-padding ion-no-margin">
      <IonTitle className="app-title ion-text-center">SIMPLE<span className="cursive">Habits</span></IonTitle>
      <IonToolbar>
        <IonButtons slot="start">
          {hasHabits && (
            <div>
              <IonButton
                onClick={() => {
                  configButton.handlePress(() => history.push('/widget-config'));
                }}
                style={{
                  transform: getTransform(configButton.isPressed, 'scale'),
                  transition: 'all 0.2s ease-in-out',
                }}
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
              >
                <IonIcon 
                  slot="icon-only" 
                  icon={gridOutline} 
                />
              </IonButton>
            </div>
          )}
        </IonButtons>
        <IonButtons slot="end">
          {hasHabits && (
            <IonButton
              onClick={() => {
                exportButton.handlePress(onExport);
              }}
              style={{
                transition: 'all 0.2s ease-in-out',
                transform: getTransform(exportButton.isPressed, 'scale')
              }}
            >
              <IonIcon slot="icon-only" icon={downloadOutline} />
            </IonButton>
          )}
          <IonButton
            onClick={() => {
              addButton.handlePress(onNewHabit);
            }}
            style={{
              transition: 'all 0.2s ease-in-out',
              transform: getTransform(addButton.isPressed, 'scale')
            }}
          >
            <IonIcon slot="icon-only" icon={add} />
          </IonButton>
        </IonButtons>
      </IonToolbar>
    </div>
  );
};

export { TopToolbar };