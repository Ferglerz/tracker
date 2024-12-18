import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  IonItem, 
  IonLabel, 
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
import { useHistory } from 'react-router-dom';
import type { HabitModel } from './HabitModel';

interface Props {
  habit: HabitModel;
  onEdit: () => void;
  onDelete: () => void;
  onViewCalendar: () => void;
  onLongPress: (habit: HabitModel) => void;
}

export const HabitListItem: React.FC<Props> = React.memo(({
  habit,
  onEdit,
  onDelete,
  onViewCalendar,
  onLongPress
}) => {
  const [, setUpdate] = useState(0);
  const history = useHistory();
  const pressTimer = useRef<number>();
  const touchStartTime = useRef<number>();
  const LONG_PRESS_DURATION = 500; // 500ms for long press

  useEffect(() => {
    const subscription = habit.changes.subscribe(() => {
      setUpdate(prev => prev + 1);
    });
    return () => subscription.unsubscribe();
  }, [habit]);

  const handleTouchStart = useCallback(() => {
    touchStartTime.current = Date.now();
    pressTimer.current = window.setTimeout(() => {
      onLongPress(habit);
    }, LONG_PRESS_DURATION);
  }, [habit, onLongPress]);

  const handleTouchEnd = useCallback(() => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }
    // Prevent quick tap from triggering navigation if it was almost a long press
    const touchDuration = Date.now() - (touchStartTime.current || 0);
    if (touchDuration > LONG_PRESS_DURATION * 0.75) {
      return;
    }
  }, []);

  const handleTouchMove = useCallback(() => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }
  }, []);

  const handleCalendarClick = (e: React.MouseEvent) => {
    e.preventDefault();
    history.push(`/habit/${habit.id}/calendar`, { 
      habitData: {
        id: habit.id,
        name: habit.name,
        type: habit.type,
        unit: habit.unit,
        goal: habit.goal,
        bgColor: habit.bgColor
      }
    });
  };

  return (
    <IonItemSliding>
      <IonItem
        className="ion-activatable habit"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        style={{ backgroundColor: habit.bgColor }}
      >
        {habit.type === 'checkbox' ? (
          <>
            <IonCheckbox
              slot="start"
              checked={habit.isChecked}
              onIonChange={(e) => habit.setChecked(e.detail.checked)}
              style={{ zIndex: 1 }}
            />
            {habit.name}
          </>
        ) : (
          <>
            <IonLabel>
              <h2>{habit.name}</h2>
              <p>{habit.quantity}{habit.goal ? ` / ${habit.goal}` : ''} {habit.unit}</p>
            </IonLabel>
            {habit.isComplete && (
              <IonBadge color="success">Complete!</IonBadge>
            )}
            <div slot="end" style={{ display: 'flex', alignItems: 'center' }}>
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
            </div>
          </>
        )}
        <IonRippleEffect />
      </IonItem>
      <IonItemOptions side="end">
        <IonItemOption color="primary" onClick={handleCalendarClick}>
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