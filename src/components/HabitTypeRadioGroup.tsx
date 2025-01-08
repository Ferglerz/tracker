// HabitTypeRadioGroup.tsx
import React from 'react';
import { IonItem, IonLabel, IonRadio, IonRadioGroup } from '@ionic/react';
import { Habit } from '@utils/TypesAndProps';

interface Props {
  value: Habit.Type;
  onTypeChange: (type: Habit.Type) => void;
}

export const HabitTypeRadioGroup: React.FC<Props> = ({ value, onTypeChange }) => (
  <IonRadioGroup value={value} onIonChange={e => onTypeChange(e.detail.value)}>
    <div style={{ display: 'flex', width: '100%' }}>
      <IonItem
        style={{ flex: 1, cursor: 'pointer' }}
        onClick={() => onTypeChange('checkbox')}
      >
        <IonLabel>Checkbox</IonLabel>
        <IonRadio slot="start" value="checkbox" />
      </IonItem>
      <IonItem
        style={{ flex: 1, cursor: 'pointer' }}
        onClick={() => onTypeChange('quantity')}
      >
        <IonLabel>Quantity</IonLabel>
        <IonRadio slot="start" value="quantity" />
      </IonItem>
    </div>
  </IonRadioGroup>
);