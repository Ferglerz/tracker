import {
  IonTitle,
  IonToolbar,
  IonIcon,
  IonButtons,
  IonButton
} from '@ionic/react'
import { add, downloadOutline, gridOutline, refreshOutline, flash, alertCircleOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { HabitEntity } from '@utils/HabitEntity';
import { HabitStorageWrapper } from '@utils/Storage';

export const TopToolbar: React.FC<{
  onExport: () => Promise<void>;
  hasHabits: boolean;
  onNewHabit: () => void;
}> = ({ onExport, hasHabits, onNewHabit }) => {
  const history = useHistory();

  const getFirstQuantity = async () => {
    try {
      const data = await HabitStorageWrapper.handleHabitData('load');
      if (data.habits.length > 0) {
        const firstHabit = data.habits[0];
        alert(firstHabit.quantity);
      }
    }
  catch (error) {
      console.error('Error fetching first quantity:', error);
    }
    return 0;
  };

  const simulateExternalChange = async () => {
    try {
      // Load current data
      const data = await HabitStorageWrapper.handleHabitData('load');

      if (data.habits.length > 0) {
        // Get the first habit
        const firstHabit = data.habits[0];
        const today = new Date().toISOString().split('T')[0];

        // Modify the habit's quantity for today
        if (!firstHabit.history[today]) {
          firstHabit.history[today] = { quantity: 0, goal: firstHabit.goal || 0 };
        }
        firstHabit.history[today].quantity = 0;

        // Save the modified data back to storage
        await HabitStorageWrapper.handleHabitData('save', data, firstHabit.id);

        console.log('Simulated external change: Set first habit quantity to 0');
      }
    } catch (error) {
      console.error('Failed to simulate external change:', error);
    }
  };

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
      </IonButtons><IonButton
        onClick={simulateExternalChange}
        style={{
          '--color': 'var(--neutral-button)'
        }}
      >
        <IonIcon slot="icon-only" icon={flash} />
      </IonButton>
      <IonButton
        onClick={HabitEntity.forceRefresh}
        style={{
          '--color': 'var(--neutral-button)'
        }}
      >
        <IonIcon slot="icon-only" icon={refreshOutline} />
      </IonButton>
      <IonTitle className="ion-text-center">Habits</IonTitle>
      <IonButtons slot="end">
        {hasHabits && (
          <>
            <IonButton
              onClick={getFirstQuantity}
              style={{
                '--color': 'var(--neutral-button)'
              }}
            >
              <IonIcon slot="icon-only" icon={alertCircleOutline} />
            </IonButton>

            <IonButton
              onClick={onExport}
              style={{
                '--color': 'var(--neutral-button)'
              }}
            >
              <IonIcon slot="icon-only" icon={downloadOutline} />
            </IonButton>

          </>
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