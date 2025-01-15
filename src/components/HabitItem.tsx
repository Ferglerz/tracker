//HabitItem.tsx
import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react';
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
import Calendar from '@components/Calendar';
import { getHistoryRange, getTodayString } from '@utils/Utilities';
import { HistoryGrid } from '@components/HistoryGrid';
import { InteractionControls } from '@components/InteractionControls';
import { CONSTANTS } from '@utils/Constants';
import { useHabits } from '@utils/useHabits';
import * as icons from 'ionicons/icons';
import { handleSettings } from '@utils/Storage';

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
  <div
    className="ion-no-padding ion-no-margin ion-align-items-baseline"
    style={{ display: 'flex', justifyContent: 'flex-start' }}
  >
    {habit.icon && (
      <IonIcon
        size="large"
        icon={(icons as any)[habit.icon]}
        style={{
          fontSize: '24px',
          marginRight: '12px',
          color: habit.bgColor,
          alignSelf: 'flex-end',
        }}
      />
    )}
    <div className="habit-name-quantity">
      <div className="habit-name">
        {habit.name}
        {habit.type === 'quantity' &&
          goal > 0 &&
          quantity >= goal && (
            <IonBadge className="ion-margin-start" color="success">
              Complete!
            </IonBadge>
          )}
      </div>
      {habit.type === 'quantity' && (
        <div className="habit-quantity">
          {quantity} {goal ? ` / ${goal} ` : ''} {habit.unit}
        </div>
      )}
    </div>
  </div>
);

export const HabitItem: React.FC<Props> = ({
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

  const { habits } = useHabits();
  const habitState = habits.find(h => h.id === habit.id);

  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [hideGrid, setHideGrid] = useState(false);

  const currentEntry = useMemo(() =>
    habit.history[selectedDate] || {
      quantity: 0,
      goal: habit.goal ?? 0
    },
    [habit, selectedDate]
  );

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await handleSettings('load');
      setHideGrid(!settings.historyGrid);
    };
    loadSettings();
  }, []);

  const handleValueChange = useCallback(
    async (value: number, date: string) => {
      const historyQuantity = habit.history[date]?.quantity || 0;
      await habit.increment(value - historyQuantity, date);
    },
    [habit]
  );

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (habit?.type === 'checkbox') {
      handleValueChange(currentEntry.quantity > 0 ? 0 : 1, selectedDate);
    }
  }, [habit, currentEntry.quantity, handleValueChange, selectedDate]);

  const handleLongPress = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('ion-reorder')) return;

    longPressActive.current = true;
    timer.current = setTimeout(() => {
      if (longPressActive.current) {
        slidingRef.current?.open('end');
      }
    }, CONSTANTS.UI.LONG_PRESS_DELAY);
  }, [isCalendarOpen, habit.id]);

  const cancelLongPress = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    longPressActive.current = false;
  }, []);

  const handleReorderStart = useCallback(() => {
    if (isCalendarOpen && habit) {
      onToggleCalendar(habit.id);
    }
  }, [isCalendarOpen, habit, onToggleCalendar]);

  const handleEdit = useCallback(() => {
    slidingRef.current?.close();
    onEdit();
  }, [onEdit]);

  const handleToggleCalendar = useCallback(() => {
    if (!habit) return;

    slidingRef.current?.close();

    if (openCalendarId === habit.id) {
      onToggleCalendar(habit.id);
      const today = getTodayString();
      setSelectedDate(today);
    } else {
      onToggleCalendar(habit.id);
    }
  }, [habit, onToggleCalendar, openCalendarId]);

  const handleDateSelected = useCallback((date: string) => {
    if (!habit) return;
    setSelectedDate(date);
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
            <IonReorder className="habit-reorder"
              onMouseDown={handleReorderStart}
              onTouchStart={handleReorderStart}>
              <IonIcon icon={reorderThree} className="margin-auto" />
            </IonReorder>

            <div className="habit-content ion-no-padding">
              <div className="habit-header">
                <HabitDetails
                  habit={habit}
                  quantity={currentEntry.quantity}
                  goal={currentEntry.goal}
                />
                <InteractionControls
                  habit={habit}
                  selectedDate={selectedDate}
                  handleValueChange={handleValueChange}
                />
              </div>

              <HistoryGrid
                color={habit.bgColor}
                type={habit.type}
                baseSize={24}
                gap={5}
                cellsPerRow={CONSTANTS.UI.CELLS_PER_ROW}
                data={getHistoryRange(habit, CONSTANTS.UI.CELLS_PER_ROW * 3)}
                history={habit.history}
                defaultGoal={habit.goal ?? 0}
                hideGrid={hideGrid}
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
          onClose={handleToggleCalendar}
          onValueChange={handleValueChange}
          onDateSelected={handleDateSelected}
        />
      )}
    </>
  );
};

HabitItem.displayName = 'HabitListItem';

export default HabitItem;