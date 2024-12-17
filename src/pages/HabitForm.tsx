import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonInput,
  IonRadioGroup,
  IonRadio,
  IonModal,
  IonFooter,
} from '@ionic/react';
import { checkmark } from 'ionicons/icons';
import type { Habit } from './HabitStorage';

const PRESET_COLORS = [
  '#ff9aa2', '#ffb7b2', '#ffdac1', '#e2f0cb',
  '#b5ead7', '#c7ceea', '#9b9b9b', '#f8c8dc'
] as const;

export interface HabitFormProps {
  onClose: () => void;
  onSave: (habit: Omit<Habit, 'id' | 'isChecked' | 'isComplete' | 'isBegun' | 'quantity'>) => Promise<void>;
  initialData?: Habit;
  title: string;
}

const HabitForm: React.FC<HabitFormProps> = ({ onClose, onSave, initialData, title }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [type, setType] = useState<'checkbox' | 'quantity'>(initialData?.type || 'checkbox');
  const [unit, setUnit] = useState(initialData?.unit || '');
  const [goal, setGoal] = useState<number | undefined>(initialData?.goal);
  const [color, setColor] = useState(initialData?.bgColor || PRESET_COLORS[0]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a habit name');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        name,
        type,
        unit: type === 'quantity' ? unit : undefined,
        goal: type === 'quantity' ? goal : undefined,
        bgColor: color
      });
      onClose(); // Move this inside the try block after successful save
    } catch (error) {
      console.error('Error saving habit:', error);
      alert('Failed to save habit. Please try again.');
    } finally {
      setIsSaving(false); // Always reset saving state
    }
  };

  return (
    <IonModal isOpen={true} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{title}</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="ion-padding">
        <form onSubmit={handleSubmit}>
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
        </form>
      </IonContent>

      <IonFooter>
        <IonToolbar>
          <div className="ion-padding" style={{ display: 'flex', gap: '8px' }}>
            <IonButton 
              expand="block" 
              onClick={onClose}
              fill="outline"
              style={{ flex: 1 }}
              disabled={isSaving}
            >
              Cancel
            </IonButton>
            <IonButton 
              expand="block" 
              onClick={handleSubmit}
              style={{ flex: 1 }}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </IonButton>
          </div>
        </IonToolbar>
      </IonFooter>
    </IonModal>
  );
};

export default HabitForm;