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
  IonButtons,
  IonFooter
} from '@ionic/react';
import { format, isValid, parseISO } from 'date-fns';
import { HabitEntity } from './HabitEntity';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (value: number, goal: number) => Promise<void>;
  habit: HabitEntity;
  date: string;
}

const DateEditModal: React.FC<Props> = ({
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
    const history = habit.getValueForDate(dateObject);

    if (history && Array.isArray(history)) {
      setValue(history[0] || 0);
      setGoal(history[1] || habit.goal || 0);
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
      console.error('Error saving:', error);
    }
  }, [value, goal, onSave, onClose]);

  const dateDisplay = useMemo(() => {
    // Add validation for the date string
    const parsedDate = parseISO(date);
    if (!isValid(parsedDate)) {
      return 'Invalid Date';
    }
    try {
      return format(parsedDate, 'MMMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  }, [date]);

  const inputLabel = useMemo(() => {
    return `${habit.name} ${habit.unit ? `(${habit.unit})` : ''}`;
  }, [habit]);

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      className="date-edit-modal"
      style={{
        '--width': '50%',
        '--height': '320px'
      } as React.CSSProperties}
    >
      <IonHeader>
        <IonToolbar>
          <IonTitle>{dateDisplay}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div style={{ maxWidth: '300px', margin: '0 auto' }}>
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
        </div>
      </IonContent>

      <IonFooter>
        <IonToolbar>
          <div className="ion-padding" style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '8px'
          }}>
            <IonButton
              expand="block"
              fill="outline"
              onClick={onClose}
              style={{ flex: 1 }}
            >
              Cancel
            </IonButton>
            <IonButton
              expand="block"
              onClick={handleSave}
              style={{
                '--color': habit.bgColor,
                flex: 1
              }}
            >
              Save
            </IonButton>
          </div>
        </IonToolbar>
      </IonFooter>
    </IonModal>
  );
};

export default React.memo(DateEditModal);


