import React from 'react';
import { IonSegment, IonSegmentButton, IonLabel } from '@ionic/react';
import { Habit } from '@utils/TypesAndProps';

interface Props {
  value: Habit.Type;
  onTypeChange: (type: Habit.Type) => void;
  segmentButtonStyle?: React.CSSProperties; // Prop for segment button styles
}

export const HabitTypeSelection: React.FC<Props> = ({
  value,
  onTypeChange,
  segmentButtonStyle,
}) => (
  <IonSegment
    value={value}
    onIonChange={(e) => onTypeChange(e.detail.value as Habit.Type)}
  >
    <IonSegmentButton style={segmentButtonStyle} value="checkbox">
      <IonLabel>Checkbox</IonLabel>
    </IonSegmentButton>
    <IonSegmentButton style={segmentButtonStyle} value="quantity">
      <IonLabel>Quantity</IonLabel>
    </IonSegmentButton>
  </IonSegment>
);