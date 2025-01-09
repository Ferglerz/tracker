import React, { forwardRef, useCallback, useRef, useState, useEffect, useMemo } from 'react';
import {
  IonItem,
  IonIcon,
  IonRippleEffect,
  IonCheckbox,
  IonBadge,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonReorder,
} from '@ionic/react';
import { calendar, pencil, trash, reorderTwo } from 'ionicons/icons';
import { HabitEntity } from '@utils/HabitEntity';
import Calendar from './Calendar';
import { getHistoryRange, getTodayString } from '@utils/Utilities';
import { HistoryGrid } from './HistoryGrid';
import { AnimatedIncrements } from '@components/AnimatedIncrements';
import { useHabitReload } from '@utils/Hooks';

interface Props {
  habit: HabitEntity;
  onEdit: () => void;
  onDelete: () => void;
  isCalendarOpen: boolean;
  openCalendarId: string | null;
  onToggleCalendar: (habitId: string) => void;
  dragHandleProps?: any;
}

interface HabitListItemState {
  value: number;
  goal: number;
}

const HabitDetails = ({ 
  habit, 
  habitListItemState 
}: {
  habit: HabitEntity;
  habitListItemState: HabitListItemState;
}) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
  }}>
    <div style={{ fontWeight: 500 }}>{habit.name}</div>
    {habit.type === 'quantity' &&
      habitListItemState.goal > 0 &&
      habitListItemState.value >= habitListItemState.goal && (
        <IonBadge color="success">Complete!</IonBadge>
      )}
    {habit.type === 'quantity' && (
      <div style={{
        fontSize: '0.875rem',
        color: 'var(--ion-color-medium)',
        marginRight: '8px'
      }}>
        {habitListItemState.value}
        {habitListItemState.goal ? ` / ${habitListItemState.goal}` : ''} 
        {habit.unit}
      </div>
    )}
  </div>
);

const InteractionControls = ({ 
  habit, 
  habitListItemState, 
  handleValueChange 
}: {
  habit: HabitEntity;
  habitListItemState: HabitListItemState;
  handleValueChange: (value: number) => Promise<void>;
}) => (
  <div style={{    
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderLeft: '1px solid var(--ion-border-color)',
    padding: '0px',
  }}
    onClick={(e) => {
      if (habit.type === 'checkbox') {
        e.stopPropagation();
      }
    }}>
    {habit.type === 'checkbox' ? (
      <IonCheckbox
        checked={habitListItemState.value > 0}
        alignment='center'
        onIonChange={async (e) => {
          e.stopPropagation();
          await handleValueChange(e.detail.checked ? 1 : 0);
        }}
        style={{
          '--checkbox-background-checked': habit.bgColor,
          '--checkbox-background-hover': habit.bgColor,
          '--checkbox-border-color': habit.bgColor,
          cursor: 'pointer',
        }}
      />
    ) : (
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <AnimatedIncrements
          onClick={() => handleValueChange(Math.max(0, habitListItemState.value - 1))}
          color={habit.bgColor}
          type="decrement"
        />
        <AnimatedIncrements
          onClick={() => handleValueChange(habitListItemState.value + 1)}
          color={habit.bgColor}
          type="increment"
        />
      </div>
    )}
  </div>
);

export const HabitListItem = forwardRef<HTMLIonItemSlidingElement, Props>(({
  habit: initialHabit,
  onEdit,
  onDelete,
  isCalendarOpen,
  openCalendarId,
  onToggleCalendar,
}, ref) => {
  const habit = useHabitReload(initialHabit.id);
  const slidingRef = useRef<HTMLIonItemSlidingElement>(null);
  const cellsPerRow = 14;
  
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [habitListItemState, setHabitState] = useState<HabitListItemState>(() => {
    const dateValue = initialHabit.history[selectedDate];
    return {
      value: dateValue?.quantity ?? 0,
      goal: dateValue?.goal ?? initialHabit.goal ?? 0
    };
  });

  const longPressActive = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update state when habit changes
  useEffect(() => {
    if (habit) {
      const dateValue = habit.history[selectedDate];
      setHabitState({
        value: dateValue?.quantity ?? 0,
        goal: habit.goal ?? dateValue?.goal ?? 0
      });
    }
  }, [habit, selectedDate]);

  // Update state when calendar closes
  useEffect(() => {
    if (!isCalendarOpen && habit) {
      const todayString = getTodayString();
      const todayValue = habit.history[todayString];
      setHabitState({
        value: todayValue?.quantity ?? 0,
        goal: todayValue?.goal ?? habit.goal ?? 0
      });
      setSelectedDate(todayString);
    }
  }, [isCalendarOpen, habit]);

  const handleValueChange = useCallback(async (newValue: number) => {
    if (!habit) return;
    
    const currentValue = habitListItemState.value;
    await habit.increment(newValue - currentValue, selectedDate);
    
    // Update local state immediately for UI responsiveness
    setHabitState(prev => ({ ...prev, value: newValue }));
  }, [habit, selectedDate, habitListItemState.value]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (openCalendarId && openCalendarId !== habit?.id) {
      onToggleCalendar(openCalendarId);
      return;
    }

    if (habit?.type === 'checkbox') {
      handleValueChange(habitListItemState.value > 0 ? 0 : 1);
    }
  }, [habit, habitListItemState.value, handleValueChange, openCalendarId, onToggleCalendar]);

  const handleLongPress = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('ion-reorder')) return;

    longPressActive.current = true;

    timer.current = setTimeout(() => {
      if (longPressActive.current) {
        slidingRef.current?.open('end');
      }
    }, 350);
  }, []);

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

  const handleToggleCalendarInternal = useCallback(() => {
    if (!habit) return;
    slidingRef.current?.close();
    onToggleCalendar(habit.id);
  }, [habit, onToggleCalendar]);

  useEffect(() => {
    document.addEventListener('mouseup', cancelLongPress);
    document.addEventListener('touchend', cancelLongPress);

    return () => {
      document.removeEventListener('mouseup', cancelLongPress);
      document.removeEventListener('touchend', cancelLongPress);
    };
  }, [cancelLongPress]);

  const historyRange = useMemo(() => {
    return habit ? getHistoryRange(habit, cellsPerRow * 3) : [];
  }, [habit, cellsPerRow]);

  if (!habit) {
    return null;
  }

  return (
    <>
      <IonItemSliding ref={slidingRef} key={habit.id}>
        <IonItem
          className="ion-activatable"
          style={{
            '--padding-start': '0',
            '--inner-padding-end': '0',
            cursor: habit.type === 'checkbox' ? 'pointer' : 'default'
          }}
          onClick={handleClick}
          onTouchStart={handleLongPress}
          onMouseDown={handleLongPress}
        >
          <div style={{
            display: 'flex',
            width: '100%',
            flexDirection: 'row',
          }}>
            <div style={{
              width: '24px',
              backgroundColor: habit.bgColor,
              flexShrink: 0
            }} />

            <IonReorder
              style={{
                width: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.3,
                cursor: 'grab',
              }}
            >
              <IonIcon icon={reorderTwo} />
            </IonReorder>

            <div style={{
              flex: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: '8px 16px',
              margin: 'auto'
            }}>
              <div style={{
                display: 'flex',
                width: '100%',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <HabitDetails habit={habit} habitListItemState={habitListItemState} />
                <InteractionControls 
                  habit={habit} 
                  habitListItemState={habitListItemState} 
                  handleValueChange={handleValueChange}
                />
              </div>

              <div>
                <HistoryGrid
                  color={habit.bgColor}
                  type={habit.type}
                  baseSize={22}
                  gap={3}
                  cellsPerRow={cellsPerRow}
                  data={historyRange}
                />
              </div>
            </div>
          </div>

          <IonRippleEffect />
        </IonItem>

        <IonItemOptions side="end">
          {!isCalendarOpen && (
            <IonItemOption
              color="primary"
              onClick={handleToggleCalendarInternal}
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
          onValueChange={handleValueChange}
          onDateSelected={(date: string) => {
            setSelectedDate(date);
          }}
        />
      )}
    </>
  );
});

HabitListItem.displayName = 'HabitListItem';