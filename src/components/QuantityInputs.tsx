// QuantityInputs.tsx
import React from 'react';
import { IonItem, IonLabel, IonInput } from '@ionic/react';

interface Props {
  unit: string | undefined;
  goal: number | undefined;
  onUnitChange: (unit: string | undefined) => void;
  onGoalChange: (goal: number | undefined) => void;
}

export const QuantityInputs: React.FC<Props> = ({ unit, goal, onUnitChange, onGoalChange }) => (
  <>
    <IonItem>
      <IonLabel position="stacked">Unit</IonLabel>
      <IonInput
        value={unit ?? ''}
        onIonInput={e => {
          onUnitChange(e.detail.value?.trim() || undefined);
        }}
        placeholder="Enter unit (e.g., cups, minutes)"
      />
    </IonItem>
    <IonItem>
      <IonLabel position="stacked">Goal (optional)</IonLabel>
      <IonInput
        type="number"
        min="0"
        value={goal?.toString() ?? ''}
        onIonChange={e => {
          const val = e.detail.value;
          onGoalChange(val ? parseInt(val, 10) : undefined);
        }}
      />
    </IonItem>
  </>
);