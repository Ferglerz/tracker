import React from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonBackButton
} from '@ionic/react';
import { useLocation } from 'react-router-dom';
import { Habit } from './home.functions';

interface LocationState {
  habit: Habit;
}

const HabitDetails: React.FC = () => {
  const location = useLocation<LocationState>();
  const habit = location.state?.habit;

  if (!habit) {
    return <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Error</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="ion-padding">
          Habit not found
        </div>
      </IonContent>
    </IonPage>;
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>{habit.name}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="ion-padding">
          {/* We'll add more content here later */}
          <h2>{habit.name}</h2>
          <p>Type: {habit.type}</p>
          {habit.type === 'quantity' && (
            <>
              <p>Current: {habit.quantity} {habit.unit}</p>
              {habit.goal && <p>Goal: {habit.goal} {habit.unit}</p>}
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default HabitDetails;
