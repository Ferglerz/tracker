// HabitListItem.tsx
import React, { forwardRef, useImperativeHandle, useCallback, useRef, useState } from 'react';
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
  IonDatetime,
  IonCard,
  IonCardContent,
} from '@ionic/react';
import { add, remove, calendar, pencil, trash, arrowBack, create } from 'ionicons/icons';
import { HabitEntity } from './HabitEntity';
import { formatDateKey, getDateKey } from './Utilities';
import DateEditModal from './DateEditModal';


interface Props {
  habit: HabitEntity;
  onEdit: () => void;
  onDelete: () => void;
  isCalendarOpen: boolean;
  onToggleCalendar: (habitId: string) => void;
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
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString());
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentValue, setCurrentValue] = useState<number | boolean>(
    habit.type === 'checkbox' ? habit.isChecked : habit.quantity
  );
  const [currentGoal, setCurrentGoal] = useState<number>(habit.goal || 0);

  useImperativeHandle(ref, () => ({
    closeSliding: async () => {
      await slidingRef.current?.close();
    },
    openSliding: async () => {
      await slidingRef.current?.open('end');
    }
  }));

  const resetToToday = useCallback(() => {
    const today = new Date().toISOString();
    setSelectedDate(today);

    // Get today's values
    const todayKey = formatDateKey(new Date());
    const todayValue = habit.history[todayKey];

    if (habit.type === 'checkbox') {
      setCurrentValue(todayValue as boolean || false);
    } else {
      if (Array.isArray(todayValue)) {
        setCurrentValue(todayValue[0] || 0);
        setCurrentGoal(todayValue[1] || habit.goal || 0);
      } else {
        setCurrentValue(0);
        setCurrentGoal(habit.goal || 0);
      }
    }
  }, [habit]);

  const handleValueChange = useCallback(async (newValue: number | boolean) => {
    const date = new Date(selectedDate);
    if (habit.type === 'checkbox') {
      await habit.setChecked(newValue as boolean, date);
      setCurrentValue(newValue);
    } else {
      await habit.setValue(newValue as number, date);
      setCurrentValue(newValue);
    }
  }, [habit, selectedDate]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (habit.type === 'checkbox') {
      e.preventDefault();
      e.stopPropagation();
      const date = new Date(selectedDate); // Use the currently selected date
      handleValueChange(!currentValue as boolean);
    }
  }, [habit, currentValue, selectedDate, handleValueChange]);

  const handleLongPress = useCallback((e: React.TouchEvent | React.MouseEvent) => {
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

    // Handle mouse/touch up events
    document.addEventListener('mouseup', cancel, { once: true });
    document.addEventListener('touchend', cancel, { once: true });
  }, []);

  const handleDateClick = useCallback(async (isoString: string) => {
    const dateKey = getDateKey(isoString);
    if (!dateKey) return;

    const dateValue = habit.getValueForDate(new Date(dateKey));

    if (habit.type === 'checkbox') {
      setCurrentValue(dateValue as boolean || false);
    } else if (Array.isArray(dateValue)) {
      setCurrentValue(dateValue[0] || 0);
      setCurrentGoal(dateValue[1] || habit.goal || 0);
    } else {
      setCurrentValue(0);
      setCurrentGoal(habit.goal || 0);
    }

    setSelectedDate(isoString);
  }, [habit]);

  const handleSaveDate = useCallback(async (value: number, goal: number) => {
    const date = new Date(selectedDate);
    await habit.setValue(value, date);
    setCurrentValue(value);
    setCurrentGoal(goal);
    setShowEditModal(false);
  }, [habit, selectedDate]);

  const getHighlightedDates = useCallback((isoString: string) => {
    const dateKey = getDateKey(isoString);
    if (!dateKey) return undefined;

    try {
      const value = habit.history[dateKey];
      if (!value) return undefined;

      let isComplete = false;
      if (habit.type === 'checkbox') {
        isComplete = value === true;
      } else if (Array.isArray(value)) {
        const [quantity, goal] = value;
        isComplete = goal > 0 ? quantity >= goal : quantity > 0;
      }

      return {
        textColor: '#ffffff',
        backgroundColor: isComplete ? '#2dd36f' : '#ffc409'
      };
    } catch (error) {
      console.error('Error in getHighlightedDates:', error);
      return undefined;
    }
  }, [habit]);

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
            {/* Color bar */}
            <div style={{
              width: '16px',
              alignSelf: 'stretch',
              backgroundColor: habit.bgColor,
              flexShrink: 0
            }} />

            {/* Title and subtitle section */}
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

            {/* Right section - either checkbox or quantity controls */}
            <div style={{
              padding: habit.type === 'checkbox' ? '0 20px' : '0 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
              onClick={(e) => {
                // Prevent checkbox click from triggering the item click
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
                    cursor: 'default' // Remove pointer cursor from checkbox
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
                resetToToday();
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
        <div className="calendar-container" style={{
          padding: '16px',
          backgroundColor: 'transparent'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <IonButton
  fill="clear"
  onClick={() => {
    resetToToday(); // Add this line first
    onToggleCalendar(habit.id);
  }}
>
  <IonIcon slot="icon-only" icon={arrowBack} />
</IonButton>
            {habit.type === 'quantity' && (
              <IonButton
                fill="clear"
                onClick={() => setShowEditModal(true)}
              >
                <IonIcon slot="icon-only" icon={create} />
              </IonButton>
            )}
          </div>

          <IonCard style={{ margin: '0 auto', maxWidth: '400px' }}>
            <IonCardContent>
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
      )}

      {habit.type === 'quantity' && (
        <DateEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveDate}
          habit={habit}
          date={selectedDate}
        />
      )}
    </>
  );
});

HabitListItem.displayName = 'HabitListItem';

