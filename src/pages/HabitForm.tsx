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
  IonIcon,
  IonInput,
  IonRadioGroup,
  IonRadio,
  IonButtons,
} from '@ionic/react';
import { checkmark } from 'ionicons/icons';
import { HabitEntity } from './HabitEntity';
import { Habit } from './HabitTypes';
import { errorHandler } from './ErrorUtils';

const PRESET_COLORS = [
  '#ff5062',  // Red
  '#ff7093',  // Pink-Red
  '#ffc386',  // Peach
  '#d0e87b',  // Yellow-Green
  '#88e0b1',  // Green
  '#97a5e3',  // Light Blue
  '#5c5c5c',  // Dark Gray
  '#f483b1',  // Pink

  '#f040a2',  // Magenta
  '#d96ab3',  // Purple
  '#c099d3',  // Lavender
  '#a0c0e0',  // Sky Blue
  '#60a0d0',  // Ocean Blue
  '#4080c0',  // Deep Blue
  '#2060a0',  // Indigo
  '#a0a0a0',  // Gray
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
  const [unit, setUnit] = useState(editedHabit?.unit || '');
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
    if (!name.trim()) {
        errorHandler.showWarning('Please enter a habit name');
        return;
    }

    setIsSaving(true);
    try {
        // Create the habit properties
        const habitProps: Partial<Habit.Habit> = {
            id: editedHabit?.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: name.trim(),
            type,
            unit: type === 'quantity' ? unit : undefined,
            goal: type === 'quantity' ? goal : undefined,
            bgColor: color,
            // Add missing required properties
            quantity: 0,
            isChecked: false,
            isComplete: false,
            isBegun: false,
            history: {}
        };

        // Create or update the habit
        await HabitEntity.create(habitProps as Habit.Habit);
        
        onClose();
    } catch (error) {
        errorHandler.handleError(error, 'Failed to save habit');
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
            <IonButton onClick={onClose}>Cancel</IonButton>
          </IonButtons>
          <IonButtons slot="end">
            <IonButton 
              strong 
              onClick={handleSubmit}
              disabled={isSaving || !name.trim()}
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

          {!editedHabit && (
            <IonRadioGroup value={type} onIonChange={e => setType(e.detail.value)}>
              <div style={{ display: 'flex', width: '100%' }}>
                <IonItem 
                  style={{ flex: 1, cursor: 'pointer' }}
                  onClick={() => setType('checkbox')}
                >
                  <IonLabel>Checkbox</IonLabel>
                  <IonRadio slot="start" value="checkbox" />
                </IonItem>
                <IonItem 
                  style={{ flex: 1, cursor: 'pointer' }}
                  onClick={() => setType('quantity')}
                >
                  <IonLabel>Quantity</IonLabel>
                  <IonRadio slot="start" value="quantity" />
                </IonItem>
              </div>
            </IonRadioGroup>
          )}

          {type === 'quantity' && (
            <>
              <IonItem>
                <IonLabel position="stacked">Unit</IonLabel>
                <IonInput
                  value={unit}
                  onIonChange={e => setUnit(e.detail.value || '')}
                  placeholder="Enter unit (e.g., cups, minutes)"
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Goal (optional)</IonLabel>
                <IonInput
                  type="number"
                  min="0"
                  value={goal}
                  onIonChange={e => setGoal(e.detail.value ? parseInt(e.detail.value, 10) : undefined)}
                  placeholder="Enter target quantity"
                />
              </IonItem>
            </>
          )}

<IonItem>
  <div style={{
    display: 'flex',
    justifyContent: 'center', // Centers the grid container horizontally
    width: '100%' // Take full width of parent to allow centering
  }}>
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(8, 1fr)', // 8 columns
      gridTemplateRows: 'repeat(2, 1fr)', // 2 rows
      gap: '8px',
      padding: '10px 0',
      width: '70%',
    }}>
      {PRESET_COLORS.map((presetColor) => (
        <div
          key={presetColor}
          onClick={() => setColor(presetColor)}
          style={{
            aspectRatio: '1', // This ensures the divs remain square
            borderRadius: '30%',
            backgroundColor: presetColor,
            cursor: 'pointer',
            border: color === presetColor ? '5px solid #000' : '5px solid transparent',
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          {color === presetColor && (
            <IonIcon
              icon={checkmark}
              style={{
                fontSize: '15px', // Slightly smaller icon to fit better
                color: '#000'
              }}
            />
          )}
        </div>
      ))}
    </div>
  </div>
</IonItem>

        </IonList>
      </IonContent>
    </IonModal>
  );
};

export default React.memo(HabitForm);