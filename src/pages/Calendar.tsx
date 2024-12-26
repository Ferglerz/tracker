// HabitCalendar.tsx
import React, { useCallback, useState } from 'react';
import {
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonDatetime,
} from '@ionic/react';
import { arrowBack, create } from 'ionicons/icons';
import { HabitEntity } from './HabitEntity';
import { getDateKey } from './Utilities';
import DateEditModal from './DateEditModal';
import { formatDateKey } from './Utilities';

interface Props {
  habit: HabitEntity;
  onClose: () => void;
  onValueChange: (value: number | boolean) => Promise<void>;
}

const HabitCalendar: React.FC<Props> = ({
  habit,
  onClose,
  onValueChange,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString());
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentValue, setCurrentValue] = useState<number | boolean>(
    habit.type === 'checkbox' ? habit.isChecked : habit.quantity
  );
  const [currentGoal, setCurrentGoal] = useState<number>(habit.goal || 0);

  const resetToToday = useCallback(() => {
    const today = new Date().toISOString();
    setSelectedDate(today);

    // Get today's values
    const todayKey = formatDateKey(new Date());
    const todayValue = habit.history[todayKey];

    if (habit.type === 'checkbox') {
      setCurrentValue(todayValue as boolean || false);
    } else {
      if (Array.isArray(todayValue)) {
        setCurrentValue(todayValue[0] || 0);
        setCurrentGoal(todayValue[1] || habit.goal || 0);
      } else {
        setCurrentValue(0);
        setCurrentGoal(habit.goal || 0);
      }
    }
  }, [habit]);

  const handleDateClick = useCallback(async (isoString: string) => {
    const dateKey = getDateKey(isoString);
    if (!dateKey) return;

    const dateValue = habit.getValueForDate(new Date(dateKey));

    if (habit.type === 'checkbox') {
      setCurrentValue(dateValue as boolean || false);
    } else if (Array.isArray(dateValue)) {
      setCurrentValue(dateValue[0] || 0);
      setCurrentGoal(dateValue[1] || habit.goal || 0);
    } else {
      setCurrentValue(0);
      setCurrentGoal(habit.goal || 0);
    }

    setSelectedDate(isoString);
  }, [habit]);

  const handleSaveDate = useCallback(async (value: number, goal: number) => {
    const date = new Date(selectedDate);
    await habit.setValue(value, date);
    setCurrentValue(value);
    setCurrentGoal(goal);
    setShowEditModal(false);
  }, [habit, selectedDate]);

  const getHighlightedDates = useCallback((isoString: string) => {
    const dateKey = getDateKey(isoString);
    if (!dateKey) return undefined;

    try {
      const value = habit.history[dateKey];
      if (!value) return undefined;

      let isComplete = false;
      if (habit.type === 'checkbox') {
        isComplete = value === true;
      } else if (Array.isArray(value)) {
        const [quantity, goal] = value;
        isComplete = goal > 0 ? quantity >= goal : quantity > 0;
      }

      return {
        textColor: '#ffffff',
        backgroundColor: isComplete ? '#2dd36f' : '#ffc409'
      };
    } catch (error) {
      console.error('Error in getHighlightedDates:', error);
      return undefined;
    }
  }, [habit]);

  return (
    <div className="calendar-container" style={{
      padding: '16px',
      backgroundColor: 'transparent'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <IonButton
          fill="clear"
          onClick={() => {
            resetToToday();
            onClose();
          }}
        >
          <IonIcon slot="icon-only" icon={arrowBack} />
        </IonButton>
        {habit.type === 'quantity' && (
          <IonButton
            fill="clear"
            onClick={() => setShowEditModal(true)}
          >
            <IonIcon slot="icon-only" icon={create} />
          </IonButton>
        )}
      </div>

      <IonCard style={{ margin: '0 auto', maxWidth: '400px' }}>
        <IonCardContent>
          <IonDatetime
            presentation="date"
            preferWheel={false}
            value={selectedDate}
            onIonChange={e => {
              if (e.detail.value) {
                const dateValue = Array.isArray(e.detail.value)
                  ? e.detail.value[0]
                  : e.detail.value;
                handleDateClick(dateValue);
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
          date={selectedDate}
        />
      )}
    </div>
  );
};

export default React.memo(HabitCalendar);