// HabitDateEditModal.tsx
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonButtons
} from '@ionic/react';
import { HabitEntity } from './HabitEntity';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (value: number, goal: number) => Promise<void>;
  habit: HabitEntity;
  date: string;
}

const HabitDateEditModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  habit,
  date,
}) => {
  const [value, setValue] = useState<number>(0);
  const [goal, setGoal] = useState<number>(habit.goal || 0);

  useEffect(() => {
    const dateObject = new Date(date);
    const historicalData = habit.getValueForDate(dateObject); 

    if (historicalData && Array.isArray(historicalData)) {
      setValue(historicalData[0] || 0); 
      setGoal(historicalData[1] || habit.goal || 0); 
    } else {
      setValue(0);
      setGoal(habit.goal || 0);
    }
  }, [habit, date, isOpen]); 

  const handleSave = useCallback(async () => {
    try {
      await onSave(value, goal);
      onClose();
    } catch (error) {
      // Error handling is done by the parent component
    }
  }, [value, goal, onSave, onClose]);

  const dateDisplay = useMemo(() => {
    return new Date(date).toLocaleDateString();
  }, [date]);

  const inputLabel = useMemo(() => {
    return `${habit.name} ${habit.unit ? `(${habit.unit})` : ''}`;
  }, [habit]);

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{dateDisplay}</IonTitle>
          <IonButtons slot="start">
            <IonButton onClick={onClose}>Cancel</IonButton>
          </IonButtons>
          <IonButtons slot="end">
            <IonButton strong onClick={handleSave}>Save</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonItem>
          <IonLabel position="stacked">{inputLabel}</IonLabel>
          <IonInput
            type="number"
            value={value}
            onIonInput={e => setValue(Number(e.detail.value))}
            min="0"
            step="1"
          />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">Goal {habit.unit ? `(${habit.unit})` : ''}</IonLabel>
          <IonInput
            type="number"
            value={goal}
            onIonInput={e => setGoal(Number(e.detail.value))}
            min="0"
            step="1"
          />
        </IonItem>
      </IonContent>
    </IonModal>
  );
};

export default React.memo(HabitDateEditModal);