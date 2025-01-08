// HabitForm.tsx
import React, { useState, useEffect } from 'react';
import {
  IonModal,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonInput,
  IonButtons,
} from '@ionic/react';
import { HabitEntity } from '@utils/HabitEntity';
import { Habit } from '@utils/TypesAndProps';
import { getTodayString } from '@utils/Utilities';
import { ColorPicker } from '@components/ColorPicker';
import {HabitTypeRadioGroup} from '@components/HabitTypeRadioGroup';
import {QuantityInputs} from '@components/QuantityInputs';

const PRESET_COLORS = [
  '#657c9a', // Muted Blue 
  '#228B22', // Dark Green (4.39)
  '#FA8072', // Salmon (2.50)
  '#CC0000', // Red (5.89)
  '#1B4B9E', // Dark Blue (8.25)
  '#33cca1', // Sea Foam
  '#F4781D', // Orange (2.78)
  '#CC9933', // Ocre Yellow (2.57)
  '#663399', // Purple (8.41)
  '#8B4513'  // Brown (7.10)
] as const;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editedHabit?: HabitEntity;
  title: string;
}

const HabitForm: React.FC<Props> = ({
  isOpen,
  onClose,
  editedHabit,
  title
}) => {
  const [name, setName] = useState(editedHabit?.name || '');
  const [type, setType] = useState<Habit.Type>(editedHabit?.type || 'checkbox');
  const [unit, setUnit] = useState<string | undefined>(editedHabit?.unit);
  const [goal, setGoal] = useState<number | undefined>(editedHabit?.goal);
  const [color, setColor] = useState(editedHabit?.bgColor || PRESET_COLORS[0]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(editedHabit?.name || '');
      setType(editedHabit?.type || 'checkbox');
      setUnit(editedHabit?.unit || '');
      setGoal(editedHabit?.goal);
      setColor(editedHabit?.bgColor || PRESET_COLORS[0]);
    }
  }, [isOpen, editedHabit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSaving(true);
    try {
      const today = getTodayString();

      const habitProps: Habit.Habit = {
        ...editedHabit as Habit.Habit ?? {},
        id: editedHabit?.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        type,
        unit: type === 'quantity' ? unit : undefined,
        goal: type === 'quantity' ? goal : undefined,
        bgColor: color,
        listOrder: editedHabit?.listOrder ?? 0,
        quantity: editedHabit?.history[today]?.quantity ?? 0,
        isComplete: false,
        history: editedHabit?.history ?? {
          [today]: {
            quantity: 0,
            goal: type === 'quantity' ? (goal ?? 0) : 0
          }
        }
      };

      await HabitEntity.create(habitProps);
      onClose();
    } catch (error) {
      alert('Failed to save habit');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{title}</IonTitle>
          <IonButtons slot="start">
            <IonButton
              onClick={onClose}
              style={{
                '--color': 'var(--neutral-button)'
              }}
            >
              Cancel
            </IonButton>
          </IonButtons>
          <IonButtons slot="end">
            <IonButton
              strong
              onClick={handleSubmit}
              disabled={isSaving || !name.trim()}
              style={{
                '--color': color
              }}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonList>
          <IonItem>
            <IonLabel position="stacked" ><h1>Name</h1></IonLabel>
            <IonInput
              value={name}
              onIonChange={e => setName(e.detail.value || '')}
              placeholder="Enter habit name"
              required
            />
          </IonItem>

          <HabitTypeRadioGroup value={type} onTypeChange={setType} />

          {type === 'quantity' && (
            <QuantityInputs
              unit={unit}
              goal={goal}
              onUnitChange={setUnit}
              onGoalChange={setGoal}
            />
          )}

          <IonItem>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              width: '100%'
            }}>
              <ColorPicker
                colors={PRESET_COLORS}
                selectedColor={color}
                onColorSelect={setColor}
              />
            </div>
          </IonItem>
        </IonList>
      </IonContent>
    </IonModal>
  );
};

export default React.memo(HabitForm);