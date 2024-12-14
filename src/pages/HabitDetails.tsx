import React, { useState, useEffect } from 'react';
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
  IonCardContent
} from '@ionic/react';
import { useLocation } from 'react-router-dom';
import { HabitStorageAPI, type Habit, type HabitData} from './HabitStorage';
import { updateHabitHistory, useSampleData } from './home.functions';
import HabitDateEditModal from './HabitDateEditModal';

interface LocationState {
  habit: Habit;
}

const HabitDetails: React.FC = () => {
  const location = useLocation<LocationState>();
  const habit = location.state?.habit;
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString());
  const [habitHistory, setHabitHistory] = useState<Record<string, number | boolean>>({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDate, setEditingDate] = useState<string>('');

  useEffect(() => {
    const loadHabitData = async () => {
      if (habit?.id) {
        const data = await HabitStorageAPI.handleHabitData('load') as HabitData;
        setHabitHistory(data.history[habit.id] || {});
      }
    };
    loadHabitData();
  }, [habit]);

  const handleDateClick = async (isoString: string) => {
    const dateKey = isoString.split('T')[0];
    
    if (habit.type === 'checkbox') {
      const currentValue = !!habitHistory[dateKey];
      if (useSampleData) {
        setHabitHistory(prev => ({
          ...prev,
          [dateKey]: !currentValue
        }));
      } else {
        const date = new Date(dateKey + 'T12:00:00');
        const data = await updateHabitHistory(habit.id, !currentValue, date);
        setHabitHistory(data.history[habit.id] || {});
      }
    } else {
      setEditingDate(dateKey);
      setShowEditModal(true);
    }
  };

  const handleSaveDate = async (value: number | boolean) => {
    if (!habit?.id) return;
  
    if (useSampleData) {
      setHabitHistory(prev => ({
        ...prev,
        [editingDate]: value
      }));
    } else {
      const date = new Date(editingDate + 'T12:00:00');
      const data = await updateHabitHistory(habit.id, value, date);
      setHabitHistory(data.history[habit.id] || {});
    }
  };

  const getHighlightedDates = (isoString: string) => {
    const dateKey = isoString.split('T')[0];
    const value = habitHistory[dateKey];
    
    if (value === undefined) return undefined;

    if (typeof value === 'boolean') {
      return {
        textColor: value ? '#ffffff' : '#000000',
        backgroundColor: value ? '#10b981' : '#374151'
      };
    }

    if (habit?.goal) {
      if (value >= habit.goal) {
        return {
          textColor: '#ffffff',
          backgroundColor: '#10b981'
        };
      }
      if (value > 0) {
        return {
          textColor: '#000000',
          backgroundColor: '#f97316'
        };
      }
    }
    
    return {
      textColor: '#000000',
      backgroundColor: '#374151'
    };
  };

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
            <HabitDateEditModal
              isOpen={showEditModal}
              onClose={() => setShowEditModal(false)}
              onSave={handleSaveDate}
              habit={habit}
              date={editingDate}
              currentValue={habitHistory[editingDate]}
            />
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default HabitDetails;