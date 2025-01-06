import { 
    IonTitle,
    IonToolbar,
    IonIcon,
    IonButtons,
    IonButton 
} from '@ionic/react'
import { add, downloadOutline, gridOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';

export const TopToolbar: React.FC<{
    onExport: () => Promise<void>;
    hasHabits: boolean;
    onNewHabit: () => void;
  }> = ({ onExport, hasHabits, onNewHabit }) => {
    const history = useHistory();
  
    return (
      <IonToolbar>
        <IonButtons slot="start">
          {hasHabits && (
            <IonButton
              onClick={() => history.push('/widget-config')}
              style={{
                '--color': 'var(--neutral-button)'
              }}
            >
              <IonIcon slot="icon-only" icon={gridOutline} />
            </IonButton>
          )}
        </IonButtons>
        <IonTitle className="ion-text-center">Habits</IonTitle>
        <IonButtons slot="end">
          {hasHabits && (
            <IonButton 
              onClick={onExport}
              style={{
                '--color': 'var(--neutral-button)'
              }}
            >
              <IonIcon slot="icon-only" icon={downloadOutline} />
            </IonButton>
          )}
          <IonButton
            onClick={onNewHabit}
            style={{
              '--color': 'var(--neutral-button)'
            }}
          >
            <IonIcon slot="icon-only" icon={add} />
          </IonButton>
        </IonButtons>
      </IonToolbar>
    );
  };