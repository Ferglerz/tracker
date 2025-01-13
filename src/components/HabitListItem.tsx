import React, { forwardRef, useCallback, useRef, useState, useEffect, useContext } from 'react';
import {
  IonItem,
  IonIcon,
  IonRippleEffect,
  IonBadge,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonReorder,
} from '@ionic/react';
import { calendar, pencil, trash, reorderThree } from 'ionicons/icons';
import { HabitEntity } from '@utils/HabitEntity';
import Calendar from './Calendar';
import { getHistoryRange, getTodayString } from '@utils/Utilities';
import { HistoryGrid } from './HistoryGrid';
import { InteractionControls } from '@components/InteractionControls';
import { CONSTANTS } from '@utils/Constants';
import { HabitItemState } from '@utils/TypesAndProps';
import { useHabits } from '@utils/useHabits';


interface Props {
  habit: HabitEntity;
  onEdit: () => void;
  onDelete: () => void;
  isCalendarOpen: boolean;
  openCalendarId: string | null;
  onToggleCalendar: (habitId: string) => void;
  dragHandleProps?: any;
}

const HabitDetails: React.FC<{
  habit: HabitEntity;
  quantity: number;
  goal: number;
}> = ({ habit, quantity, goal }) => (
  <div className="habit-details">
    <div className="habit-name">
      {habit.name}
      {habit.type === 'quantity' && goal > 0 && quantity >= goal && (
        <IonBadge className="ion-margin-start" color="success">Complete!</IonBadge>
      )}
    </div>
    {habit.type === 'quantity' && (
      <div className="habit-quantity">
        {quantity}
        {goal ? ` / ${goal} ` : ''}
        {habit.unit}
      </div>
    )}
  </div>
);

export const HabitListItem: React.FC<Props> = ({
  habit,
  onEdit,
  onDelete,
  isCalendarOpen,
  openCalendarId,
  onToggleCalendar,
}) => {
  const slidingRef = useRef<HTMLIonItemSlidingElement>(null);
  const longPressActive = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get habits from central state using the hook
  const { habits } = useHabits();
  const habitState = habits.find(h => h.id === habit.id);

  const [state, setState] = useState<HabitItemState>(() => {
    const today = getTodayString();
    return {
      selectedDate: today,
      quantity: habitState?.history[today]?.quantity ?? 0,
      goal: habitState?.history[today]?.goal ?? habitState?.goal ?? 0
    };
  });

  useEffect(() => {
    if (habit) {
      setState(prevState => ({
        selectedDate: prevState.selectedDate,
        quantity: habit.history[prevState.selectedDate]?.quantity ?? 0,
        goal: habit.history[prevState.selectedDate]?.goal ?? habit.goal ?? 0
      }));
    }
  }, [habit]);

  const handleValueChange = useCallback(
    async (value: number, date: string) => {
      const historyQuantity = habit.history[date]?.quantity || 0;
      await habit.increment(value - historyQuantity, date);
      setState((prevState) => ({
        ...prevState,
        quantity: value,
        selectedDate: date,
      }));
    },
    [habit]
  );

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (openCalendarId && openCalendarId !== habit?.id) {
      onToggleCalendar(openCalendarId);
      return;
    }

    if (habit?.type === 'checkbox') {
      handleValueChange(state.quantity > 0 ? 0 : 1, state.selectedDate);
    }
  }, [habit, state.quantity, handleValueChange, openCalendarId, onToggleCalendar]);

  const handleLongPress = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('ion-reorder')) return;
    
    // Close calendar if open when starting drag/long press
    if (isCalendarOpen) {
        onToggleCalendar(habit.id);
    }
    
    longPressActive.current = true;
    timer.current = setTimeout(() => {
        if (longPressActive.current) {
            slidingRef.current?.open('end');
        }
    }, CONSTANTS.UI.LONG_PRESS_DELAY);
}, [isCalendarOpen, onToggleCalendar, habit.id]);

  const cancelLongPress = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    longPressActive.current = false;
  }, []);

  const handleEdit = useCallback(() => {
    slidingRef.current?.close();
    onEdit();
  }, [onEdit]);

  const handleToggleCalendar = useCallback(() => {
    if (!habit) return;

    if (openCalendarId === habit.id) {
      const today = getTodayString();
      const todayValue = habit.history[today];
      setState({
        selectedDate: today,
        quantity: todayValue?.quantity ?? 0,
        goal: todayValue?.goal ?? habit.goal ?? 0
      });
    }

    slidingRef.current?.close();
    onToggleCalendar(habit.id);
  }, [habit, onToggleCalendar, openCalendarId]);

  const handleDateSelected = useCallback((date: string) => {
    if (!habit) return;

    setState(prevState => ({
      ...prevState,
      selectedDate: date,
      quantity: habit.history[date]?.quantity ?? 0,
      goal: habit.history[date]?.goal ?? habit.goal ?? 0
    }));
  }, [habit]);

  React.useEffect(() => {
    document.addEventListener('mouseup', cancelLongPress);
    document.addEventListener('touchend', cancelLongPress);
    return () => {
      document.removeEventListener('mouseup', cancelLongPress);
      document.removeEventListener('touchend', cancelLongPress);
    };
  }, [cancelLongPress]);

  if (!habit) {
    return null;
  }

  return (
    <>
      <IonItemSliding ref={slidingRef} key={habit.id}>
        <IonItem
          className="habit-item ion-activatable"
          onClick={handleClick}
          onTouchStart={handleLongPress}
          onMouseDown={handleLongPress}
        >
          <div
            className="habit-color-bar"
            style={{ backgroundColor: habit.bgColor }}
          />
          <div className="habit-container ion-align-items-center ion-no-margin">
            <IonReorder className="habit-reorder">
              <IonIcon icon={reorderThree} className="margin-auto" />
            </IonReorder>

            <div className="habit-content ion-no-padding">
              <div className="habit-header">
                <HabitDetails
                  habit={habit}
                  quantity={state.quantity} //Pass down for habit details
                  goal={state.goal} //Pass down for habit details
                />
                <InteractionControls
                  habit={habit}
                  selectedDate={state.selectedDate} // Pass selectedDate
                  handleValueChange={handleValueChange}
                />
              </div>

              <HistoryGrid
                color={habit.bgColor}
                type={habit.type}
                baseSize={22}
                gap={3}
                cellsPerRow={CONSTANTS.UI.CELLS_PER_ROW}
                data={getHistoryRange(habit, CONSTANTS.UI.CELLS_PER_ROW * 3)}
                history={habit.history}
                defaultGoal={habit.goal ?? 0}
              />
            </div>
          </div>

          <IonRippleEffect />
        </IonItem>

        <IonItemOptions side="end">
          {!isCalendarOpen && (
            <IonItemOption
              color="primary"
              onClick={handleToggleCalendar}
            >
              <IonIcon slot="icon-only" icon={calendar} />
            </IonItemOption>
          )}
          <IonItemOption color="warning" onClick={handleEdit}>
            <IonIcon slot="icon-only" icon={pencil} />
          </IonItemOption>
          <IonItemOption color="danger" onClick={onDelete}>
            <IonIcon slot="icon-only" icon={trash} />
          </IonItemOption>
        </IonItemOptions>
      </IonItemSliding>

      {isCalendarOpen && (
        <Calendar
          habit={habit}
          onClose={() => onToggleCalendar(habit.id)}
          onValueChange={handleValueChange} // Pass the updated handleValueChange
          onDateSelected={handleDateSelected}
        />
      )}
    </>
  );
};

HabitListItem.displayName = 'HabitListItem';

export default HabitListItem;