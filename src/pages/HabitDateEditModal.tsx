// HabitDateEditModal.tsx

import React, { useCallback, useMemo } from 'react';
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
import type { Habit } from './HabitStorage';
import { errorHandler } from './ErrorUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (value: number) => Promise<void>;
  habit: Habit;
  date: string;
  currentValue?: number;
}

const HabitDateEditModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  habit,
  date,
  currentValue
}) => {
  const [value, setValue] = React.useState<number>(currentValue || 0);

  // Reset value when modal opens with new data
  React.useEffect(() => {
    setValue(currentValue || 0);
  }, [currentValue, isOpen]);

  const handleSave = useCallback(async () => {
    try {
      await onSave(value);
      onClose();
    } catch (error) {
      errorHandler.handleError(error, 'Failed to save habit value');
    }
  }, [value, onSave, onClose]);

  const dateDisplay = useMemo(() => {
    return new Date(date).toLocaleDateString();
  }, [date]);

  const inputLabel = useMemo(() => {
    return `${habit.name} ${habit.unit ? `(${habit.unit})` : ''}`;
  }, [habit.name, habit.unit]);

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
        {habit.goal && (
          <div className="ion-padding-top ion-text-center">
            Goal: {habit.goal} {habit.unit}
          </div>
        )}
      </IonContent>
    </IonModal>
  );
};

export default React.memo(HabitDateEditModal);
