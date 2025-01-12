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

const TopToolbar: React.FC<{
  onExport: () => Promise<void>;
  hasHabits: boolean;
  onNewHabit: () => void;
}> = ({ onExport, hasHabits, onNewHabit }) => {
  const history = useHistory();

  const toggleHistoryGrid = async () => {
    try {
      const settings = await handleSettings('load');
      const currentValue = settings.historyGrid ?? true;
      await handleSettings('save', { ...settings, historyGrid: !currentValue });
      // Remove the refreshHabits call as it's no longer needed
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
                  onClick={() => history.push('/widget-config')}
                >
                  <IonIcon slot="icon-only" icon={hammerOutline} />
                </IonButton>
                <IonButton
                  onClick={toggleHistoryGrid}
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
                onClick={onExport}
              >
                <IonIcon slot="icon-only" icon={downloadOutline} />
              </IonButton>
            )}
            <IonButton
              onClick={onNewHabit}
            >
              <IonIcon slot="icon-only" icon={add} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </div>
  );
};

export { TopToolbar };