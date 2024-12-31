// HabitListItem.tsx
import React, { forwardRef, useImperativeHandle, useCallback, useRef, useState, useEffect } from 'react';
import {
  IonItem,
  IonButton,
  IonIcon,
  IonRippleEffect,
  IonCheckbox,
  IonBadge,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonReorder,
} from '@ionic/react';
import { add, remove, calendar, pencil, trash, reorderTwo } from 'ionicons/icons';
import { HabitEntity } from './HabitEntity';
import Calendar from './Calendar';
import { formatDateKey, getHistoryRange } from './Utilities';
import { HabitStorage } from './Storage';
import { HistoryGrid } from './HistoryGrid';

interface Props {
  habit: HabitEntity;
  onEdit: () => void;
  onDelete: () => void;
  isCalendarOpen: boolean;
  openCalendarId: string | null;
  onToggleCalendar: (habitId: string) => void;
  dragHandleProps?: any;
  isReorderMode: boolean;
  onDateSelected?: (date: Date) => void;
}

export interface HabitListItemRef {
  closeSliding: () => Promise<void>;
  openSliding: () => Promise<void>;
}

const LONG_PRESS_DURATION = 500;

export const HabitListItem = forwardRef<HabitListItemRef, Props>(({
  habit,
  onEdit,
  onDelete,
  isCalendarOpen,
  openCalendarId,
  onToggleCalendar,
  isReorderMode,
  onDateSelected
}, ref) => {
  const slidingRef = useRef<HTMLIonItemSlidingElement>(null);
  const reorderRef = useRef<HTMLIonReorderElement>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isReordering, setIsReordering] = useState(false);

  const [habitState, setHabitState] = useState(() => {
    const dateKey = formatDateKey(selectedDate);
    const dateValue = habit.history[dateKey];

    return {
      value: habit.type === 'checkbox'
        ? (dateValue?.isChecked ?? false)
        : (dateValue?.quantity ?? 0),
      goal: dateValue?.goal ?? habit.goal ?? 0
    };
  });

  useEffect(() => {
    if (!isCalendarOpen) {
      // Reset to today when calendar closes
      const today = new Date();
      const todayKey = formatDateKey(today);
      const todayValue = habit.history[todayKey];

      setHabitState({
        value: habit.type === 'checkbox'
          ? (todayValue?.isChecked ?? false)
          : (todayValue?.quantity ?? 0),
        goal: todayValue?.goal ?? habit.goal ?? 0
      });
      setSelectedDate(today);
    }
  }, [isCalendarOpen, habit]);

  useEffect(() => {
    // Function to update state from a habit instance
    const updateStateFromHabit = (habitData: HabitEntity) => {
      const dateKey = formatDateKey(selectedDate);
      const dateValue = habitData.history[dateKey];

      setHabitState({
        value: habitData.type === 'checkbox'
          ? (dateValue?.isChecked ?? false)
          : (dateValue?.quantity ?? 0),
        goal: habit.goal ?? dateValue?.goal ?? 0
      });
    };

    // Initial state update
    updateStateFromHabit(habit);

    // Subscribe to storage changes
    const storage = HabitStorage.getInstance();
    const subscription = storage.changes.subscribe(async (data) => {
      // Get fresh habit data from storage
      const habits = await HabitEntity.loadAll();
      const updatedHabit = habits.find(h => h.id === habit.id);
      if (updatedHabit) {
        updateStateFromHabit(updatedHabit);
      }
    });

    return () => subscription.unsubscribe();
  }, [habit, selectedDate]);

  useEffect(() => {
    const reorderElement = reorderRef.current;
    if (!reorderElement) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'reorder') {
          const isReorderActive = reorderElement.hasAttribute('reorder');
          setIsReordering(isReorderActive);

          // Close sliding item when reorder starts
          if (isReorderActive) {
            slidingRef.current?.close();
          }
        }
      });
    });

    observer.observe(reorderElement, {
      attributes: true,
      attributeFilter: ['reorder']
    });

    return () => observer.disconnect();
  }, []);

  useImperativeHandle(ref, () => ({
    closeSliding: async () => {
      await slidingRef.current?.close();
    },
    openSliding: async () => {
      await slidingRef.current?.open('end');
    }
  }));

  const handleValueChange = useCallback(async (newValue: number | boolean) => {
    if (habit.type === 'checkbox') {
      await habit.setChecked(newValue as boolean, selectedDate);
      setHabitState(prev => ({ ...prev, value: newValue }));
    } else {
      await habit.setValue(newValue as number, selectedDate, habitState.goal);
      setHabitState(prev => ({ ...prev, value: newValue }));
    }
  }, [habit, selectedDate, habitState.goal]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    // Don't handle clicks during reorder mode
    if (isReorderMode) return;

    e.preventDefault();
    e.stopPropagation();

    // If another habit's calendar is open, close it
    if (openCalendarId && openCalendarId !== habit.id) {
      onToggleCalendar(openCalendarId);
      return;
    }

    // Toggle checkbox only for checkbox type habits
    if (habit.type === 'checkbox') {
      handleValueChange(!habitState.value as boolean);
    }
  }, [habit, habitState.value, handleValueChange, openCalendarId, onToggleCalendar, isReorderMode]);

  const handleLongPress = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    // Don't open slide menu if we're in reorder mode or already sliding
    if (isReordering) return;

    // Prevent long press during reorder drag operations
    const target = e.target as HTMLElement;
    if (target.closest('ion-reorder')) return;

    let timer: ReturnType<typeof setTimeout>;

    const start = () => {
      timer = setTimeout(() => {
        // Double check we're not reordering before opening
        if (!isReordering) {
          slidingRef.current?.open('end');
        }
      }, LONG_PRESS_DURATION);
    };

    const cancel = () => {
      clearTimeout(timer);
    };

    start();

    document.addEventListener('mouseup', cancel, { once: true });
    document.addEventListener('touchend', cancel, { once: true });
  }, [isReordering]);

  return (
    <>
      <IonItemSliding ref={slidingRef}>
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
    {/* Color bar */}
    <div style={{
      width: '16px',
      backgroundColor: habit.bgColor,
      flexShrink: 0
    }} />

    {/* Content container */}
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
    }}>
      {/* Top row */}
      <div style={{
        display: 'flex',
        width: '100%',
        alignItems: 'stretch',
        minHeight: '40px'
      }}>
        <IonReorder
          ref={reorderRef}
          style={{
            width: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.3,
            cursor: 'grab'
          }}
        >
          <IonIcon icon={reorderTwo} />
        </IonReorder>

        <div style={{
          padding: '8px 16px',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          flex: 1
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{ fontWeight: 500 }}>{habit.name}</div>
            {habit.type === 'quantity' &&
              typeof habitState.value === 'number' &&
              habitState.goal > 0 &&
              habitState.value >= habitState.goal && (
                <IonBadge color="success">Complete!</IonBadge>
              )}
          </div>
          {habit.type === 'quantity' && (
            <div style={{
              fontSize: '0.875rem',
              color: 'var(--ion-color-medium)'
            }}>
              {habitState.value}{habitState.goal ? ` / ${habitState.goal}` : ''} {habit.unit}
            </div>
          )}
        </div>

        <div
          style={{
            width: '100px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            borderLeft: '1px solid var(--ion-border-color)',
            padding: '0 8px'
          }}
          onClick={(e) => {
            if (habit.type === 'checkbox') {
              e.stopPropagation();
            }
          }}
        >
          {habit.type === 'checkbox' ? (
            <IonCheckbox
              checked={habitState.value as boolean}
              alignment="center"
              onIonChange={async (e) => {
                e.stopPropagation();
                await handleValueChange(e.detail.checked);
              }}
              style={{
                '--checkbox-background-checked': habit.bgColor,
                '--checkbox-background-hover': habit.bgColor,
                '--checkbox-border-color': habit.bgColor,
                cursor: 'pointer',
              }}
            />
          ) : (
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
              <IonButton
                fill="clear"
                onClick={() => handleValueChange(Math.max(0, (habitState.value as number) - 1))}
                style={{
                  '--color': habit.bgColor
                }}
              >
                <IonIcon icon={remove} />
              </IonButton>
              <IonButton
                fill="clear"
                onClick={() => handleValueChange((habitState.value as number) + 1)}
                style={{
                  '--color': habit.bgColor
                }}
              >
                <IonIcon icon={add} />
              </IonButton>
            </div>
          )}
        </div>
      </div>

      {/* History Grid section */}
      <div style={{
        display: 'flex',
        width: '100%'
      }}>
        <HistoryGrid
          data={getHistoryRange(habit, 57)}
          color={habit.bgColor}
          type={habit.type}
          baseSize={30}
          gap={4}
          cellsPerRow={19}
        />
      </div>
    </div>
  </div>
  <IonRippleEffect style={{
    display: isReorderMode ? 'none' : undefined
  }} />
</IonItem>

        <IonItemOptions side="end">
          {!isCalendarOpen && (
            <IonItemOption
              color="primary"
              onClick={() => {
                onToggleCalendar(habit.id);
              }}
            >
              <IonIcon slot="icon-only" icon={calendar} />
            </IonItemOption>
          )}
          <IonItemOption color="warning" onClick={onEdit}>
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
          onDateSelected={onDateSelected}
        />
      )}
    </>
  );
});

HabitListItem.displayName = 'HabitListItem';