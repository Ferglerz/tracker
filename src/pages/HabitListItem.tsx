// HabitListItem.tsx
import React, { useState, useEffect } from 'react';
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
import { HabitEntity } from './HabitEntity';
import { Habit } from './HabitTypes';

interface Props {
  habit: HabitEntity;
  onEdit: () => void;
  onDelete: () => void;
  onViewCalendar: () => void;
}

export const HabitListItem: React.FC<Props> = React.memo(({
  habit,
  onEdit,
  onDelete,
  onViewCalendar
}) => {
  const [, setUpdate] = useState(0);
  const history = useHistory();

  useEffect(() => {
    const subscription = habit.changes.subscribe(() => {
      setUpdate(prev => prev + 1);
    });
    return () => subscription.unsubscribe();
  }, [habit]);

  const handleCalendarClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    const routeState: Habit.RouteState = { 
      habitData: {
        id: habit.id,
        name: habit.name,
        type: habit.type,
        unit: habit.unit,
        goal: habit.goal,
        bgColor: habit.bgColor
      }
    };

    history.push(`/habit/${habit.id}/calendar`, routeState);
  };

  const renderQuantityControls = () => (
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
  );

  const renderCheckbox = () => (
    <IonCheckbox
      slot="start"
      checked={habit.isChecked}
      onIonChange={(e) => habit.setChecked(e.detail.checked)}
      style={{ zIndex: 1 }}
    />
  );

  const renderQuantityLabel = () => (
    <IonLabel>
      <h2>{habit.name}</h2>
      <p>
        {habit.quantity}
        {habit.goal ? ` / ${habit.goal} ` : ''} 
        {habit.unit}
      </p>
    </IonLabel>
  );

  const renderCompleteBadge = () => (
    habit.isComplete && <IonBadge color="success">Complete!</IonBadge>
  );

  return (
    <IonItemSliding>
      <IonItem
        className="ion-activatable habit"
        style={{ backgroundColor: habit.bgColor }}
      >
        {habit.type === 'checkbox' ? (
          <>
            {renderCheckbox()}
            {habit.name}
          </>
        ) : (
          <>
            {renderQuantityLabel()}
            {renderCompleteBadge()}
            {renderQuantityControls()}
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

HabitListItem.displayName = 'HabitListItem';