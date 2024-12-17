import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonDatetime,
  IonCard,
  IonCardContent,
  IonModal,
  IonItem,
  IonLabel,
  IonInput,
  IonButton
} from '@ionic/react';
import { useLocation } from 'react-router-dom';
import { HabitStorageAPI, type Habit, type HabitData } from './HabitStorage';
import { updateHabitHistory } from './HabitOperations';
import { errorHandler } from './ErrorUtils';
import { formatDateKey, getHighlightStyle } from './HabitUtils';

interface LocationState {
  habit: Habit;
}

interface DateEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (value: number) => Promise<void>;
  habit: Habit;
  date: string;
  currentValue?: number;
}

const DateEditModal: React.FC<DateEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  habit,
  date,
  currentValue
}) => {
  const [value, setValue] = React.useState<number>(currentValue || 0);

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

const HabitDetails: React.FC = () => {
  const location = useLocation<LocationState>();
  const habit = useMemo(() => location.state?.habit, [location.state]);
  
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString());
  const [habitHistory, setHabitHistory] = useState<Record<string, number | boolean>>({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDate, setEditingDate] = useState<string>('');

  useEffect(() => {
    const loadHabitData = async () => {
      if (!habit?.id) return;
      
      try {
        const data = await HabitStorageAPI.handleHabitData('load') as HabitData;
        setHabitHistory(data.history[habit.id] || {});
      } catch (error) {
        errorHandler.handleError(error, 'Failed to load habit history');
      }
    };
    
    loadHabitData();
  }, [habit?.id]);

  const handleDateClick = useCallback(async (isoString: string) => {
    if (!habit?.id) return;
    
    const dateKey = formatDateKey(new Date(isoString));
    
    try {
      if (habit.type === 'checkbox') {
        const currentValue = !!habitHistory[dateKey];
        const date = new Date(dateKey + 'T12:00:00');
        const data = await updateHabitHistory(habit.id, !currentValue, date);
        setHabitHistory(data.history[habit.id] || {});
      } else {
        setEditingDate(dateKey);
        setShowEditModal(true);
      }
    } catch (error) {
      errorHandler.handleError(error, 'Failed to update habit');
    }
  }, [habit?.id, habit?.type, habitHistory]);

  const handleSaveDate = useCallback(async (value: number | boolean) => {
    if (!habit?.id) return;
  
    try {
        const date = new Date(editingDate + 'T12:00:00');
        const data = await updateHabitHistory(habit.id, value, date);
        setHabitHistory(data.history[habit.id] || {});
    } catch (error) {
      errorHandler.handleError(error, 'Failed to save habit value');
    }
  }, [habit?.id, editingDate]);

  const getHighlightedDates = useCallback((isoString: string) => {
    const dateKey = formatDateKey(new Date(isoString));
    const value = habitHistory[dateKey];
    
    if (value === undefined) return undefined;
    
    return getHighlightStyle(value, habit!);
  }, [habit, habitHistory]);

  if (!habit?.id) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/home" />
            </IonButtons>
            <IonTitle>Error</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="ion-padding">Habit not found</div>
        </IonContent>
      </IonPage>
    );
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
          <IonCard>
            <IonCardContent>
              <IonDatetime
                presentation="date"
                preferWheel={false}
                value={selectedDate}
                onIonChange={e => {
                  if (e.detail.value) {
                    setSelectedDate(e.detail.value.toString());
                    handleDateClick(e.detail.value.toString());
                  }
                }}
                highlightedDates={getHighlightedDates}
                className="calendar-custom"
              />
            </IonCardContent>
          </IonCard>

          {habit.type === 'quantity' && (
            <DateEditModal
              isOpen={showEditModal}
              onClose={() => setShowEditModal(false)}
              onSave={handleSaveDate}
              habit={habit}
              date={editingDate}
              currentValue={habitHistory[editingDate] as number}
            />
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default React.memo(HabitDetails);