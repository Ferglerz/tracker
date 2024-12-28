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
import { getLast56Days } from './Utilities';
import { HabitStorage } from './Storage';
import { CheckboxHistory, QuantityHistory } from './HistoryGrid';

interface Props {
  habit: HabitEntity;
  onEdit: () => void;
  onDelete: () => void;
  isCalendarOpen: boolean;
  onToggleCalendar: (habitId: string) => void;
  dragHandleProps?: any;
  isReorderMode: boolean;
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
  onToggleCalendar,
  isReorderMode
}, ref) => {
  const slidingRef = useRef<HTMLIonItemSlidingElement>(null);
  const reorderRef = useRef<HTMLIonReorderElement>(null);
  const [currentValue, setCurrentValue] = useState<number | boolean>(
    habit.type === 'checkbox' ? habit.isChecked : habit.quantity
  );
  const [currentGoal, setCurrentGoal] = useState<number>(habit.goal || 0);
  const [isReordering, setIsReordering] = useState(false);

  useEffect(() => {
    const reorderElement = reorderRef.current;
    if (!reorderElement) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'reorder') {
          const isReorderActive = reorderElement.hasAttribute('reorder');
          setIsReordering(isReorderActive);
        }
      });
    });

    observer.observe(reorderElement, {
      attributes: true,
      attributeFilter: ['reorder']
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const storage = HabitStorage.getInstance();
    const subscription = storage.changes.subscribe(async (data) => {
      const updatedHabit = data.habits.find(h => h.id === habit.id);
      if (updatedHabit) {
        setCurrentValue(habit.type === 'checkbox' ? updatedHabit.isChecked : updatedHabit.quantity);
        setCurrentGoal(updatedHabit.goal || 0);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [habit.id, habit.type]);

  useImperativeHandle(ref, () => ({
    closeSliding: async () => {
      await slidingRef.current?.close();
    },
    openSliding: async () => {
      await slidingRef.current?.open('end');
    }
  }));

  const handleValueChange = useCallback(async (newValue: number | boolean) => {
    const date = new Date();
    if (habit.type === 'checkbox') {
      await habit.setChecked(newValue as boolean, date);
      setCurrentValue(newValue);
    } else {
      await habit.setValue(newValue as number, date);
      setCurrentValue(newValue);
    }
  }, [habit]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (habit.type === 'checkbox') {
      e.preventDefault();
      e.stopPropagation();
      handleValueChange(!currentValue as boolean);
    }
  }, [habit, currentValue, handleValueChange]);

  const handleLongPress = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (isReordering) return;

    let timer: ReturnType<typeof setTimeout>;

    const start = () => {
      timer = setTimeout(() => {
        slidingRef.current?.open('end');
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
            alignItems: 'stretch',
            minHeight: '48px'
          }}>
            {/* Color bar */}
            <div style={{
              width: '16px',
              backgroundColor: habit.bgColor,
              flexShrink: 0
            }} />

            {/* Reorder handle */}
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

            {/* Name and status section */}
            <div style={{
              padding: '8px 16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              flex: 1
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{ fontWeight: 500 }}>{habit.name}</div>
                {habit.type === 'quantity' &&
                  typeof currentValue === 'number' &&
                  currentGoal > 0 &&
                  currentValue >= currentGoal && (
                    <IonBadge color="success">Complete!</IonBadge>
                  )}
              </div>
              {habit.type === 'quantity' && (
                <div style={{
                  fontSize: '0.875rem',
                  color: 'var(--ion-color-medium)'
                }}>
                  {currentValue}{currentGoal ? ` / ${currentGoal}` : ''} {habit.unit}
                </div>
              )}
            </div>

            {/* History visualization section */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              width: '130px',
              borderLeft: '1px solid var(--ion-border-color)',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {habit.type === 'checkbox' ? (
  <CheckboxHistory
    data={getLast56Days(habit) as Array<{ date: string, value: boolean }>}
    color={habit.bgColor}
  />
) : (
  <QuantityHistory
    data={getLast56Days(habit) as Array<{ date: string, value: [number, number] }>}
    color={habit.bgColor}
  />
)}
            </div>

            {/* Controls section */}
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
                  checked={currentValue as boolean}
                  alignment="center"
                  onIonChange={async (e) => {
                    e.stopPropagation();
                    await handleValueChange(e.detail.checked);
                  }}
                  style={{
                    '--checkbox-background-checked': habit.bgColor,
                    '--checkbox-background-checked-hover': habit.bgColor,
                    '--checkbox-border-color': habit.bgColor,
                    cursor: 'pointer',
                  }}
                />
              ) : (
                <div style={{width: '100%', display: 'flex', justifyContent: 'space-between'}}>
                  <IonButton
                    fill="clear"
                    onClick={() => handleValueChange((currentValue as number) - 1)}
                    style={{
                      '--color': habit.bgColor
                    }}
                  >
                    <IonIcon icon={remove} />
                  </IonButton>
                  <IonButton
                    fill="clear"
                    onClick={() => handleValueChange((currentValue as number) + 1)}
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
          <IonRippleEffect />
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
          />
        )}
      </>
    );
  });
  
  HabitListItem.displayName = 'HabitListItem';