// HabitListItem.tsx
import React, { forwardRef, useImperativeHandle, useCallback, useRef } from 'react';
import {
  IonItem, 
  IonButton, 
  IonIcon, 
  IonRippleEffect,
  IonCheckbox, 
  IonBadge, 
  IonItemSliding, 
  IonItemOptions, 
  IonItemOption
} from '@ionic/react';
import { add, remove, calendar, pencil, trash } from 'ionicons/icons';
import { HabitEntity } from './HabitEntity';
import { Habit } from './HabitTypes';

interface Props {
  habit: HabitEntity;
  onEdit: () => void;
  onDelete: () => void;
  onViewCalendar: (habitData: Partial<Habit.Habit>) => void;
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
  onViewCalendar
}, ref) => {
  const slidingRef = useRef<HTMLIonItemSlidingElement>(null);
  const pressStartTimeRef = useRef<number>(0);
  const pressTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useImperativeHandle(ref, () => ({
    closeSliding: async () => {
      await slidingRef.current?.close();
    },
    openSliding: async () => {
      await slidingRef.current?.open('end');
    }
  }));

  const handlePressStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if ('button' in e && e.button === 0) {
      e.preventDefault();
    }
    pressStartTimeRef.current = Date.now();
    pressTimeoutRef.current = setTimeout(() => {
      slidingRef.current?.open('end');
    }, LONG_PRESS_DURATION);
  }, []);

  const handlePressEnd = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (pressTimeoutRef.current) {
      clearTimeout(pressTimeoutRef.current);
    }
    if (Date.now() - pressStartTimeRef.current >= LONG_PRESS_DURATION) {
      e.preventDefault();
    }
  }, []);

  const handlePressCancel = useCallback(() => {
    if (pressTimeoutRef.current) {
      clearTimeout(pressTimeoutRef.current);
    }
  }, []);

  React.useEffect(() => {
    return () => {
      if (pressTimeoutRef.current) {
        clearTimeout(pressTimeoutRef.current);
      }
    };
  }, []);

  return (
    <IonItemSliding ref={slidingRef}>
      <IonItem
        className="ion-activatable"
        style={{ 
          '--padding-start': '0',
          '--inner-padding-end': '0',
        }}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onTouchCancel={handlePressCancel}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressCancel}
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
    {habit.type === 'quantity' && habit.isComplete && (
      <IonBadge color="success">Complete!</IonBadge>
    )}
  </div>
  {habit.type === 'quantity' && (
    <div style={{ 
      fontSize: '0.875rem',
      color: 'var(--ion-color-medium)'
    }}>
      {habit.quantity}{habit.goal ? ` / ${habit.goal}` : ''} {habit.unit}
    </div>
  )}
</div>

          {/* Right section - either checkbox or quantity controls */}
          <div style={{
            padding: habit.type === 'checkbox' ? '0 20px' : '0 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {habit.type === 'checkbox' ? (
              <IonCheckbox
                checked={habit.isChecked}
                onIonChange={(e) => habit.setChecked(e.detail.checked)}
              />
            ) : (
              <>
                <IonButton 
                  fill="clear" 
                  onClick={() => habit.increment(-1)}
                >
                  <IonIcon icon={remove} />
                </IonButton>
                <IonButton 
                  fill="clear" 
                  onClick={() => habit.increment(1)}
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
        <IonItemOption color="primary" onClick={() => onViewCalendar(habit)}>
          <IonIcon slot="icon-only" icon={calendar} />
        </IonItemOption>
        <IonItemOption color="warning" onClick={onEdit}>
          <IonIcon slot="icon-only" icon={pencil} />
        </IonItemOption>
        <IonItemOption color="danger" onClick={onDelete}>
          <IonIcon slot="icon-only" icon={trash} />
        </IonItemOption>
      </IonItemOptions>
    </IonItemSliding>
  );
});

HabitListItem.displayName = 'HabitListItem';