import React from 'react';
import {
  IonItem, IonLabel, IonButton, IonIcon, IonRippleEffect,
  IonCheckbox, IonBadge, IonItemSliding, IonItemOptions, IonItemOption
} from '@ionic/react';
import { add, remove, calendar, pencil, trash } from 'ionicons/icons';
import { type Habit } from './HabitStorage';
import { UpdateAction } from './HabitTypes';

export const HabitListItem: React.FC<{
  habit: Habit;
  onUpdate: (id: string, action: UpdateAction) => Promise<void>;
  onEdit: () => void;
  onDelete: () => void;
  onViewCalendar: () => void;
  onLongPress: (habit: Habit) => void;
}> = React.memo(({
  habit,
  onUpdate,
  onEdit,
  onDelete,
  onViewCalendar,
  onLongPress
}) => {
  return (
    <IonItemSliding>
      <IonItem
        className="ion-activatable habit"
        onTouchStart={() => onLongPress(habit)}
        style={{ backgroundColor: habit.bgColor }}
      >
        {habit.type === 'checkbox' ? (
          <>
            <IonCheckbox
              slot="start"
              checked={habit.isChecked}
              onIonChange={(e) => onUpdate(habit.id, { 
                type: 'checkbox', 
                checked: e.detail.checked 
              })}
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
                onClick={() => onUpdate(habit.id, { type: 'quantity', delta: -1 })}
              >
                <IonIcon icon={remove} />
              </IonButton>
              <IonButton 
                fill="clear" 
                onClick={() => onUpdate(habit.id, { type: 'quantity', delta: 1 })}
              >
                <IonIcon icon={add} />
              </IonButton>
            </div>
          </>
        )}
        <IonRippleEffect />
      </IonItem>
      <IonItemOptions side="end">
        <IonItemOption color="primary" onClick={onViewCalendar}>
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