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
import { HabitModel, type HabitProperties } from './HabitModel';
import { errorHandler } from './ErrorUtils';
import { HabitStorageAPI } from './HabitStorage';

const PRESET_COLORS = [
  '#ff9aa2', '#ffb7b2', '#ffdac1', '#e2f0cb',
  '#b5ead7', '#c7ceea', '#9b9b9b', '#f8c8dc'
] as const;

interface HabitFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialHabit?: HabitModel;
  title: string;
}

const HabitForm: React.FC<HabitFormProps> = ({
  isOpen,
  onClose,
  initialHabit,
  title
}) => {
  const [name, setName] = useState(initialHabit?.name || '');
  const [type, setType] = useState<'checkbox' | 'quantity'>(initialHabit?.type || 'checkbox');
  const [unit, setUnit] = useState(initialHabit?.unit || '');
  const [goal, setGoal] = useState<number | undefined>(initialHabit?.goal);
  const [color, setColor] = useState(initialHabit?.bgColor || PRESET_COLORS[0]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(initialHabit?.name || '');
      setType(initialHabit?.type || 'checkbox');
      setUnit(initialHabit?.unit || '');
      setGoal(initialHabit?.goal);
      setColor(initialHabit?.bgColor || PRESET_COLORS[0]);
    }
  }, [isOpen, initialHabit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a habit name');
      return;
    }

    setIsSaving(true);
    try {
      if (initialHabit) {
        // Update existing habit
        await HabitModel.update({
          id: initialHabit.id,
          name: name.trim(),
          type: initialHabit.type,
          unit: type === 'quantity' ? unit : undefined,
          goal: type === 'quantity' ? goal : undefined,
          bgColor: color,
        });
      } else {
        // Create new habit
        const habitProps: HabitProperties = {
          id: Date.now().toString(),
          name: name.trim(),
          type,
          unit: type === 'quantity' ? unit : undefined,
          goal: type === 'quantity' ? goal : undefined,
          bgColor: color,
        };

        await HabitModel.create(habitProps);
      }

      onClose();
    } catch (error) {
      errorHandler.handleError(error, 'Failed to save habit');
    } finally {
      setIsSaving(false);
    }
  };  return (    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
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
            <IonLabel position="stacked">Habit Name</IonLabel>
            <IonInput
              value={name}
              onIonChange={e => setName(e.detail.value || '')}
              placeholder="Enter habit name"
              required
            />
          </IonItem>

          {!initialHabit && (
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
            <IonLabel position="stacked">Color</IonLabel>
            <div style={{ display: 'flex', gap: '10px', padding: '10px 0' }}>
              {PRESET_COLORS.map((presetColor) => (
                <div
                  key={presetColor}
                  onClick={() => setColor(presetColor)}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    backgroundColor: presetColor,
                    cursor: 'pointer',
                    border: color === presetColor ? '2px solid #000' : '2px solid transparent',
                    position: 'relative'
                  }}
                >
                  {color === presetColor && (
                    <IonIcon
                      icon={checkmark}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: '#000'
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </IonItem>
        </IonList>
      </IonContent>
    </IonModal>
  );
};

export default HabitForm;
