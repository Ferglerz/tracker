import React, { useCallback, useState } from 'react';
import {
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonDatetime,
  IonBadge,
  IonHeader,
} from '@ionic/react';
import { arrowBack, create } from 'ionicons/icons';
import { HabitEntity } from '@utils/HabitEntity';
import DateEditModal from '@components/DateEditModal';
import { UpdateOptions } from '@utils/HabitEntity';

interface Props {
  habit: HabitEntity;
  onClose: () => void;
  onValueChange: (value: number, date: string) => Promise<void>;
  onDateSelected?: (date: string) => void;
}

const HabitCalendar: React.FC<Props> = ({
  habit,
  onClose,
  onValueChange,
  onDateSelected,
}) => {
  const getTodayString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(today.getDate()).padStart(2, '0')}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [showEditModal, setShowEditModal] = useState(false);

  const resetToToday = useCallback(() => {
    const today = getTodayString();
    setSelectedDate(today);
  }, []);

  const handleDateClick = useCallback(
    async (date: string) => {
      setSelectedDate(date);
      onDateSelected?.(date);

      if (habit.type === 'checkbox') {
        const dateValue = habit.history[date]?.quantity ?? 0;
        const newValue = dateValue > 0 ? 0 : 1;
        onValueChange(newValue, date);
      } else {
        // For quantity type, directly use onValueChange without increment
        const currentQuantity = habit.history[date]?.quantity || 0;
        onValueChange(currentQuantity, date);
      }
    },
    [habit, onDateSelected, onValueChange]
  );

  const handleSaveDate = useCallback(
    async (quantity: number, goal: number) => {
      const newValue: UpdateOptions = {
        dateString: selectedDate,
        history: {
          [selectedDate]: { quantity, goal },
        },
      };
      await habit.update(newValue);
      setShowEditModal(false);
    },
    [habit, selectedDate]
  );

  const getHighlightedDates = useCallback(
    (date: string) => {
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
    },
    [habit]
  );

  return (
    <div className="calendar-container">
      <IonHeader style={{ display: 'flex', justifyContent: 'space-between', padding: '10px' }}>
        <IonButton
          fill="clear"
          onClick={() => setShowEditModal(true)}
          style={{
            background: habit.bgColor,
            opacity: 0.9,
            color: '#FFFFFF',
            height: '36px',
            borderRadius: '5px',
            display: habit.type === 'quantity' ? 'block' : 'none'
          }}
        >
          Edit quantity and goal
        </IonButton>
        <IonButton
          fill="clear"
          onClick={() => {
            resetToToday();
            onClose();
          }}
          style={{
            background: habit.bgColor,
            opacity: 0.9,
            color: '#FFFFFF',
            height: '36px',
            borderRadius: '5px',
          }}
        >
          Done
        </IonButton>
      </IonHeader>      <IonDatetime
        presentation="date"
        size="cover"
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
        max={new Date().toISOString()}
      />

      <DateEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveDate}
        habit={habit}
        date={selectedDate}
      />

    </div >
  );
};

export default React.memo(HabitCalendar);