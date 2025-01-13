// QuantityInputs.tsx
import React from 'react';
import { IonItem, IonLabel, IonInput } from '@ionic/react';

interface Props {
  unit: string | undefined;
  goal: number | undefined;
  onUnitChange: (unit: string | undefined) => void;
  onGoalChange: (goal: number ) => void;
}

export const QuantityInputs: React.FC<Props> = ({ unit, goal, onUnitChange, onGoalChange }) => (
  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
    <IonItem style={{ flex: 1 }}>
      <IonLabel position="stacked">Unit</IonLabel>
      <IonInput
        value={unit ?? ''}
        onIonInput={e => {
          onUnitChange(e.detail.value?.trim() || undefined);
        }}
        placeholder="Enter unit (e.g., cups, minutes)"
      />
    </IonItem>
    <IonItem style={{ flex: 1 }}>
      <IonLabel position="stacked">Goal (optional)</IonLabel>
      <IonInput
        type="number"
        min="0"
        value={goal?.toString() ?? ''}
        onIonChange={e => {
          const val = e.detail.value;
          onGoalChange(val ? parseInt(val, 10) : 1);
        }}
      />
    </IonItem>
  </div>
);