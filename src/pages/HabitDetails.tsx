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
} from '@ionic/react';
import { useLocation, useParams } from 'react-router-dom';
import { HabitModel } from './HabitModel';
import { errorHandler } from './ErrorUtils';
import { formatDateKey } from './HabitUtils';
import HabitDateEditModal from './HabitDateEditModal';

interface RouteParams {
  id: string;
}

interface LocationState {
  habitData?: {
    id: string;
    name: string;
    type: 'checkbox' | 'quantity';
    unit?: string;
    goal?: number;
    bgColor: string;
  };
}

const HabitDetails: React.FC = () => {
  const location = useLocation<LocationState>();
  const { id } = useParams<RouteParams>();
  const [habit, setHabit] = useState<HabitModel | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString());
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDate, setEditingDate] = useState<string>('');
  const [, setForceUpdate] = useState(0);

  useEffect(() => {
    const loadHabit = async () => {
      try {
        let habitModel: HabitModel;
        
        if (location.state?.habitData) {
          habitModel = await HabitModel.create(location.state.habitData);
        } else if (id) {
          const habits = await HabitModel.getAll();
          const existingHabit = habits.find(h => h.id === id);
          if (!existingHabit) {
            throw new Error('Habit not found');
          }
          habitModel = await HabitModel.create(existingHabit);
        } else {
          throw new Error('No habit ID provided');
        }

        setHabit(habitModel);

        const subscription = habitModel.changes.subscribe(() => {
          setForceUpdate(prev => prev + 1);
        });

        return () => subscription.unsubscribe();
      } catch (error) {
        errorHandler.handleError(error, 'Failed to load habit');
      }
    };

    loadHabit();
  }, [location.state?.habitData, id]);

  const handleDateClick = useCallback(async (isoString: string) => {
    if (!habit) return;
    
    // Ensure we have a valid date by creating a new Date object
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      errorHandler.handleError(new Error('Invalid date'), 'Invalid date selected');
      return;
    }
    
    const dateKey = formatDateKey(date);
    
    try {
      if (habit.type === 'checkbox') {
        const currentValue = habit.getValueForDate(date) as boolean;
        await habit.setChecked(!currentValue, date);
      } else {
        setEditingDate(dateKey);
        setShowEditModal(true);
      }
    } catch (error) {
      errorHandler.handleError(error, 'Failed to update habit');
    }
  }, [habit]);

  const handleSaveDate = useCallback(async (value: number) => {
    if (!habit) return;
  
    try {
      const date = new Date(editingDate);
      await habit.setValue(value, date);
    } catch (error) {
      errorHandler.handleError(error, 'Failed to save habit value');
    }
  }, [habit, editingDate]);

  const getHighlightedDates = useCallback((isoString: string) => {
    if (!habit) return undefined;
    
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return undefined;
      
      const status = habit.getStatusForDate(date);
      if (status === 'none') return undefined;
      
      return {
        textColor: '#ffffff',
        backgroundColor: status === 'complete' ? '#2dd36f' : '#ffc409'
      };
    } catch {
      return undefined;
    }
  }, [habit]);

  if (!habit) {
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
                  const dateValue = Array.isArray(e.detail.value) ? e.detail.value[0] : e.detail.value;
                  const date = new Date(dateValue);
                  if (!isNaN(date.getTime())) {
                    setSelectedDate(dateValue);
                    handleDateClick(dateValue);
                  }
                }
              }}
              highlightedDates={getHighlightedDates}
              className="calendar-custom"
            />
            </IonCardContent>
          </IonCard>

          {habit.type === 'quantity' && (
            <HabitDateEditModal
              isOpen={showEditModal}
              onClose={() => setShowEditModal(false)}
              onSave={handleSaveDate}
              habit={habit}
              date={editingDate}
              currentValue={habit.getValueForDate(new Date(editingDate)) as number}
            />
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default React.memo(HabitDetails);