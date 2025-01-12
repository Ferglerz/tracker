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
import { getGoalChange } from '@utils/Utilities';
// import { GoalChangeIndicator } from '@components/GoalChangeIndicator'; // Commented out the import
import { UpdateOptions } from '@utils/HabitEntity';

interface Props {
  habit: HabitEntity;
  onClose: () => void;
  onValueChange: (value: number) => Promise<void>;
  onDateSelected?: (date: string) => void;
}

// Goal Change Overlay Component
const GoalChangeOverlay: React.FC<{
  habit: HabitEntity;
  date: string;
}> = ({ habit, date }) => {
  const goalChange = getGoalChange(date, habit.history, habit.goal ?? 0);
  
  if (goalChange === null) return null;
  
  return (
    <div style={{ 
      position: 'absolute',
      bottom: '2px',
      left: '2px',
      pointerEvents: 'none',
      zIndex: 1
    }}>
      {/* <GoalChangeIndicator change={goalChange} /> */} {/* Commented out the GoalChangeIndicator */}
      <div style={{ 
        backgroundColor: 'red', 
        width: '20px', 
        height: '20px' 
      }} /> {/* Added a div with red background */}
    </div>
  );
};

const HabitCalendar: React.FC<Props> = ({
  habit,
  onClose,
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
    setSelectedDate(date);
    onDateSelected?.(date);
    
    if (habit.type === 'checkbox') {
      const dateValue = habit.history[date]?.quantity ?? 0;
      const newValue = dateValue > 0 ? 0 : 1;
      await habit.increment(newValue - dateValue, date);
    }
  }, [habit, onDateSelected]);

  const handleSaveDate = useCallback(async (quantity: number, goal: number) => {
    const newValue: UpdateOptions = {
      dateString: selectedDate, 
      history: {
        [selectedDate]: { quantity, goal } 
      }
    };
    await habit.update(newValue); 
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
      backgroundColor: 'background',
    }}>
      <div className="ion-padding ion-justify-content-center">
        <IonButton
          fill="clear"
          onClick={() => {
            resetToToday();
            onClose();
          }}
          className="ion-no-margin"
          style={{
            '--color': habit.bgColor,
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
        position: 'relative'
      }}>
        <IonCard className="ion-no-margin">
          <IonCardContent className="ion-no-padding">
            <div style={{ position: 'relative' }}>
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
              <div className="calendar-overlays" >
                {Array.from({ length: 31 }, (_, i) => {
                  const currentDate = new Date(selectedDate);
                  currentDate.setDate(i + 1);
                  const dateStr = currentDate.toISOString().split('T')[0];
                  return (
                    <GoalChangeOverlay
                      key={dateStr}
                      habit={habit}
                      date={dateStr}
                    />
                  );
                })}
              </div>
            </div>
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