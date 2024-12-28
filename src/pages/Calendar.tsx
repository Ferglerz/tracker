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

    const todayKey = formatDateKey(new Date());
    const todayValue = habit.history[todayKey];

    if (habit.type === 'checkbox') {
        setCurrentValue(todayValue?.isChecked ?? false);
    } else {
        setCurrentValue(todayValue?.quantity ?? 0);
        setCurrentGoal(todayValue?.goal ?? habit.goal ?? 0);
    }
}, [habit]);

const handleDateClick = useCallback(async (isoString: string) => {
  const dateKey = getDateKey(isoString);
  if (!dateKey) return;

  const date = new Date(isoString);
  
  // Get UTC components
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  
  // Create date in local timezone using UTC components
  const localDate = new Date(year, month, day);
  
  const dateValue = habit.history[dateKey];

  if (habit.type === 'checkbox') {
    // Toggle the checkbox value for the selected date
    const newValue = !(dateValue?.isChecked ?? false);
    await habit.setChecked(newValue, localDate);
    setCurrentValue(newValue);
  } else {
    setCurrentValue(dateValue?.quantity ?? 0);
    setCurrentGoal(dateValue?.goal ?? habit.goal ?? 0);
  }

  setSelectedDate(isoString);
}, [habit]);



  const handleSaveDate = useCallback(async (value: number, goal: number) => {
    const date = new Date(selectedDate);
    await habit.setValue(value, date, goal);  // Pass the goal parameter
    setCurrentValue(value);
    setCurrentGoal(goal);
    setShowEditModal(false);
      alert(JSON.stringify(Object.entries(habit.history).slice(-20).reduce<Record<string, unknown>>((acc, [key, value]) => {
        acc[key] = value
        return acc
      }, {}), null, 2))
}, [habit, selectedDate]);

const getHighlightedDates = useCallback((isoString: string) => {
  const dateKey = getDateKey(isoString);
  if (!dateKey) return undefined;

  try {
    const value = habit.history[dateKey];
    if (!value) return undefined;

    let isComplete = false;
    if (habit.type === 'checkbox') {
      isComplete = value.isChecked;
      // For checkbox type, we only want complete (green) or none (transparent)
      return value.isChecked ? {
        textColor: '#ffffff',
        backgroundColor: '#2dd36f'  // green for complete
      } : undefined;  // undefined for unchecked to show default style
    } else {
      const { quantity, goal } = value;
      isComplete = goal > 0 ? quantity >= goal : quantity > 0;
      
      return {
        textColor: '#ffffff',
        backgroundColor: isComplete ? '#2dd36f' : '#ffc409'  // green for complete, orange for partial
      };
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
      backgroundColor: 'transparent'
    }}>
      {/* Left column - Back button */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '16px',
        width: '60px'
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
            height: '36px'
          }}
        >
          <IonIcon slot="icon-only" icon={arrowBack} />
        </IonButton>
      </div>

      {/* Center column - Calendar */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center'
      }}>
        <IonCard style={{ 
          margin: '0',
          width: '100%',
          maxWidth: '400px'
        }}>
          <IonCardContent style={{ padding: '0' }}>
            <style>
              {`
                .calendar-custom {
                  --ion-color-primary: ${habit.bgColor} !important;
                  --ion-color-primary-contrast: #ffffff !important;
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
      </div>

      {/* Right column - Edit button */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '16px',
        width: '60px'
      }}>
        {habit.type === 'quantity' && (
          <IonButton
            fill="clear"
            onClick={() => setShowEditModal(true)}
            style={{
              '--color': habit.bgColor,
              margin: 0,
              height: '36px'
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