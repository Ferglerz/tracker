import React, { useState, useEffect, useRef } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonToggle,
} from '@ionic/react';
import { Habit } from './home.functions';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (value: number | boolean) => void;
  habit: Habit;
  date: string;
  currentValue?: number | boolean;
}

const HabitDateEditModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  habit,
  date,
  currentValue,
}) => {
  const [quantityValue, setQuantityValue] = useState<number>(0);
  const [checkboxValue, setCheckboxValue] = useState<boolean>(false);
  const lastSavedQuantity = useRef<number>(0);

  useEffect(() => {
    if (isOpen) {
      if (currentValue !== undefined) {
        if (habit.type === 'quantity') {
          setQuantityValue(currentValue as number);
        } else {
          setCheckboxValue(currentValue as boolean);
        }
      } else if (habit.type === 'quantity') {
        setQuantityValue(lastSavedQuantity.current);
      } else {
        setCheckboxValue(false);
      }
    }
  }, [isOpen, currentValue, habit.type]);

  const handleSave = () => {
    if (habit.type === 'quantity') {
      lastSavedQuantity.current = quantityValue;
      onSave(quantityValue);
    } else {
      onSave(checkboxValue);
    }
    onClose();
  };

  const title = currentValue !== undefined ? 'Edit Data' : 'Add Data';

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{title} for {date}</IonTitle>
          <IonButtons slot="start">
            <IonButton onClick={onClose}>Cancel</IonButton>
          </IonButtons>
          <IonButtons slot="end">
            <IonButton strong={true} onClick={handleSave}>
              Save
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="ion-padding">
          {habit.type === 'checkbox' ? (
            <IonItem>
              <IonLabel>Completed</IonLabel>
              <IonToggle
                checked={checkboxValue}
                onIonChange={e => setCheckboxValue(e.detail.checked)}
              />
            </IonItem>
          ) : (
            <IonItem>
              <IonLabel position="stacked">
                {habit.name} ({habit.unit})
                {habit.goal && ` (Goal: ${habit.goal} ${habit.unit})`}
              </IonLabel>
              <IonInput
                type="number"
                value={quantityValue}
                onIonInput={e => setQuantityValue(Number(e.detail.value))}
                min={0}
                max={habit.goal || undefined}
              />
            </IonItem>
          )}
        </div>
      </IonContent>
    </IonModal>
  );
};

export default HabitDateEditModal;