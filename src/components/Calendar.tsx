import React, { useCallback, useState } from 'react';
import {
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonDatetime,
} from '@ionic/react';
import { arrowBack, create } from 'ionicons/icons';
import { HabitEntity } from '@utils/HabitEntity';
import DateEditModal from '@components/DateEditModal';

interface Props {
  habit: HabitEntity;
  onClose: () => void;
  onValueChange: (value: number) => Promise<void>;
  onDateSelected?: (date: string) => void;
}

const HabitCalendar: React.FC<Props> = ({
  habit,
  onClose,
  onValueChange,
  onDateSelected
}) => {
  const getTodayString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [showEditModal, setShowEditModal] = useState(false);

  const resetToToday = useCallback(() => {
    const today = getTodayString();
    setSelectedDate(today);
  }, []);

  const handleDateClick = useCallback(async (date: string) => {
    onDateSelected?.(date);
    setSelectedDate(date);

    if (habit.type === 'checkbox') {
      const dateValue = habit.history[date]?.quantity ?? 0;
      const newValue = dateValue > 0 ? 0 : 1;
      await habit.increment(newValue - dateValue, date);
      await onValueChange(newValue);
    }
  }, [habit, onDateSelected, onValueChange]);

  const handleSaveDate = useCallback(async (value: number, goal: number) => {
    const currentValue = habit.history[selectedDate]?.quantity ?? 0;
    await habit.increment(value - currentValue, selectedDate);
    setShowEditModal(false);
  }, [habit, selectedDate]);

  const getHighlightedDates = useCallback((date: string) => {
    try {
      const value = habit.history[date];
      if (!value) return undefined;

      if (habit.type === 'checkbox') {
        return value.quantity > 0
          ? {
              textColor: '#000000',
              backgroundColor: habit.bgColor,
            }
          : undefined;
      } else {
        const { quantity, goal } = value;
        const isComplete = goal > 0 ? quantity >= goal : quantity > 0;

        if (isComplete) {
          return {
            textColor: '#000000',
            backgroundColor: habit.bgColor,
          };
        } else if (quantity > 0) {
          const rgbaColor = habit.bgColor.startsWith('#')
            ? `${habit.bgColor}80`
            : `rgba(${habit.bgColor.replace('rgb(', '').replace(')', '')}, 0.5)`;

          return {
            textColor: '#000000',
            backgroundColor: rgbaColor,
          };
        }
      }
    } catch (error) {
      console.error('Error in getHighlightedDates:', error);
      return undefined;
    }
  }, [habit]);

  return (
    <div className="calendar-container" style={{
      display: 'flex',
      width: '100%',
      backgroundColor: 'background',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '16px',
        width: '60px',
      }}>
        <IonButton
          fill="clear"
          onClick={() => {
            resetToToday();
            onClose();
          }}
          style={{
            '--color': habit.bgColor,
            margin: 0,
            height: '36px',
          }}
        >
          <IonIcon slot="icon-only" icon={arrowBack} />
        </IonButton>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
      }}>
        <IonCard style={{
          margin: '0',
          padding: '0px',
          width: '100%',
          maxWidth: '400px',
          background: 'transparent',
        }}>
          <IonCardContent style={{ padding: '0' }}>
            <style>
              {`
                .calendar-custom {
                  --ion-color-primary: ${habit.bgColor} !important;
                  --ion-color-primary-contrast: #ffffff !important;
                  margin: auto !important;
                }
                
                .calendar-custom::part(calendar-day) {
                  color: var(--ion-text-color);
                }

                .calendar-custom::part(calendar-day-active) {
                  color: #ffffff !important;
                  background-color: ${habit.bgColor} !important;
                }

                .calendar-custom::part(calendar-day-today) {
                  border-color: ${habit.bgColor} !important;
                }
              `}
            </style>
            <IonDatetime
              presentation="date"
              preferWheel={false}
              value={selectedDate}
              onIonChange={(e) => {
                if (e.detail.value) {
                  const date = (e.detail.value as string).split('T')[0];
                  handleDateClick(date);
                }
              }}
              highlightedDates={getHighlightedDates}
              className="calendar-custom"
            />
          </IonCardContent>
        </IonCard>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '16px',
        width: '60px',
      }}>
        {habit.type === 'quantity' && (
          <IonButton
            fill="clear"
            onClick={() => setShowEditModal(true)}
            style={{
              '--color': habit.bgColor,
              margin: 0,
              height: '36px',
            }}
          >
            <IonIcon slot="icon-only" icon={create} />
          </IonButton>
        )}
      </div>

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