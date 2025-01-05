// HabitListItem.tsx
import React, { forwardRef, useImperativeHandle, useCallback, useRef, useState, useEffect } from 'react';
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
import { addOutline, removeOutline, calendar, pencil, trash, reorderTwo } from 'ionicons/icons';
import { HabitEntity } from './HabitEntity';
import Calendar from './Calendar';
import { formatDateKey, getHistoryRange } from './Utilities';
import { HabitStorage } from './Storage';
import { HistoryGrid } from './HistoryGrid';
import { AnimatedIncrements } from './AnimatedIncrements';

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

    updateStateFromHabit(habit);

    const storage = HabitStorage.getInstance();
    const subscription = storage.changes.subscribe(async (data) => {
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
    if (isReorderMode) return;

    e.preventDefault();
    e.stopPropagation();

    if (openCalendarId && openCalendarId !== habit.id) {
      onToggleCalendar(openCalendarId);
      return;
    }

    if (habit.type === 'checkbox') {
      handleValueChange(!habitState.value as boolean);
    }
  }, [habit, habitState.value, handleValueChange, openCalendarId, onToggleCalendar, isReorderMode]);

  const handleLongPress = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (isReordering) return;

    const target = e.target as HTMLElement;
    if (target.closest('ion-reorder')) return;

    let timer: ReturnType<typeof setTimeout>;

    const start = () => {
      timer = setTimeout(() => {
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
            <div style={{
              width: '24px',
              backgroundColor: habit.bgColor,
              flexShrink: 0
            }} />

            <IonReorder
              ref={reorderRef}
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
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flex: 1,
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
                    color: 'var(--ion-color-medium)',
                    marginRight: '8px'
                  }}>
                    {habitState.value}{habitState.goal ? ` / ${habitState.goal}` : ''} {habit.unit}
                  </div>
                )}

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
                      checked={habitState.value as boolean}
                      alignment='center'
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
                    <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AnimatedIncrements
                        onClick={() => handleValueChange(Math.max(0, (habitState.value as number) - 1))}
                        color={habit.bgColor}
                        type="decrement"
                      />
                      <AnimatedIncrements
                        onClick={() => handleValueChange((habitState.value as number) + 1)}
                        color={habit.bgColor}
                        type="increment"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div style={{
              }}>
                <HistoryGrid
                  data={getHistoryRange(habit, 57)}
                  color={habit.bgColor}
                  type={habit.type}
                  baseSize={22}
                  gap={3}
                  cellsPerRow={14}
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