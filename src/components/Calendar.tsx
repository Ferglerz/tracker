import React, { useCallback, useState } from 'react';
import {
  IonButton,
  IonDatetime,
  IonHeader,
  IonTextarea,
  IonItem,
} from '@ionic/react';
import { HabitEntity } from '@utils/HabitEntity';
import DateEditModal from '@components/DateEditModal';
import { UpdateOptions } from '@utils/HabitEntity';
import { adjustColor, getContrastText } from '@utils/Utilities';
import { useCurrentDate } from '@utils/useCurrentDate';

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
  const globalToday = useCurrentDate();
  const [selectedDate, setSelectedDate] = useState<string>(globalToday);
  const [note, setNote] = useState<string>(habit.history[globalToday]?.note || '');
  const [showEditModal, setShowEditModal] = useState(false);

  const previousGlobalToday = React.useRef(globalToday);
  React.useEffect(() => {
    if (previousGlobalToday.current !== globalToday) {
      if (selectedDate === previousGlobalToday.current) {
        setSelectedDate(globalToday);
        setNote(habit.history[globalToday]?.note || '');
      }
      previousGlobalToday.current = globalToday;
    }
  }, [globalToday, selectedDate, habit.history]);

  const maxDate = `${globalToday}T23:59:59`;

  const resetToToday = useCallback(() => {
    setSelectedDate(globalToday);
  }, [globalToday]);

  const handleDateClick = useCallback(
    async (date: string) => {
      setSelectedDate(date);
      setNote(habit.history[date]?.note || '');
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
          [selectedDate]: { quantity, goal, note: habit.history[selectedDate]?.note },
        },
      };
      await habit.update(newValue);
      setShowEditModal(false);
    },
    [habit, selectedDate]
  );

  const handleNoteBlur = useCallback(async () => {
    const currentEntry = habit.history[selectedDate] || { quantity: 0, goal: habit.goal };
    if (currentEntry.note !== note) {
      await habit.update({
        dateString: selectedDate,
        history: {
          [selectedDate]: { quantity: currentEntry.quantity, goal: currentEntry.goal, note }
        }
      });
    }
  }, [habit, selectedDate, note]);

  const getHighlightedDates = useCallback(
    (date: string) => {
      try {
        const value = habit.history[date];
        if (!value) return undefined;

        if (habit.type === 'checkbox') {
          return value.quantity > 0
            ? {
              textColor: getContrastText(habit.bgColor),
              backgroundColor: habit.bgColor,
            }
            : undefined;
        } else {
          const { quantity, goal } = value;
          const isComplete = goal > 0 ? quantity >= goal : quantity > 0;

          if (isComplete) {
            return {
              textColor: getContrastText(habit.bgColor),
              backgroundColor: habit.bgColor,
            };
          } else if (quantity > 0) {
            const rgbaColor = adjustColor(habit.bgColor, { opacity: 0.5 });
            return {
              textColor: getContrastText(rgbaColor),
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
      </IonHeader>
      <IonDatetime
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
        max={maxDate}
      />

      <IonItem style={{ '--background': 'transparent', marginTop: '10px' }}>
        <IonTextarea
          placeholder={`Add a journal note for ${selectedDate}...`}
          value={note}
          onIonInput={e => setNote(e.detail.value || '')}
          onIonBlur={handleNoteBlur}
          autoGrow={true}
          rows={3}
          style={{ fontSize: '14px' }}
        />
      </IonItem>

      <DateEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveDate}
        habit={habit}
        date={selectedDate}
      />
    </div>
  );
};

export default React.memo(HabitCalendar);