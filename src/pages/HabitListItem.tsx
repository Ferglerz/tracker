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

interface Props {
  habit: HabitEntity;
  onEdit: () => void;
  onDelete: () => void;
  isCalendarOpen: boolean;
  onToggleCalendar: (habitId: string) => void;
  dragHandleProps?: any;
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
  onToggleCalendar
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
    if (isReordering) return; // Don't trigger sliding menu if reordering

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
            alignItems: 'center',
            minHeight: '48px'
          }}>
            <div style={{
              width: '16px',
              alignSelf: 'stretch',
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
                cursor: 'grab'
              }}
            >
              <IonIcon icon={reorderTwo} />
            </IonReorder>

            <div style={{
              flex: 1,
              padding: '8px 16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
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

            <div style={{
              padding: habit.type === 'checkbox' ? '0 20px' : '0 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
              onClick={(e) => {
                if (habit.type === 'checkbox') {
                  e.stopPropagation();
                }
              }}>
              {habit.type === 'checkbox' ? (
                <IonCheckbox
                  checked={currentValue as boolean}
                  style={{
                    '--checkbox-background-checked': habit.bgColor,
                    '--checkbox-background-checked-hover': habit.bgColor,
                    '--checkbox-border-color': habit.bgColor,
                    cursor: 'default'
                  }}
                />
              ) : (
                <>
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
                </>
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