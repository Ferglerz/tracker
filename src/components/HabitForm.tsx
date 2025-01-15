// HabitForm.tsx
import React, { useState, useEffect, useMemo } from 'react';
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
  IonButtons,
  IonIcon,
  IonInput,
} from '@ionic/react';
import { HabitEntity } from '@utils/HabitEntity';
import { Habit } from '@utils/TypesAndProps';
import { getTodayString } from '@utils/Utilities';
import { ColorPicker } from '@components/ColorPicker';
import { HabitTypeSelection } from '@components/HabitTypeSelection';
import { QuantityInputs } from '@components/QuantityInputs';
import { IconSelect } from '@components/IconSelect';
import { IconSelectButton } from '@components/IconSelectButton';
import { CONSTANTS } from '@utils/Constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editedHabit?: HabitEntity;
  title: string;
  onSave?: () => void;
}

// Interface for segment button styles (for type safety)
interface SegmentButtonStyles {
  '--indicator-color'?: string;
  '--indicator-color-checked'?: string;
  '--color-checked'?: string;
  '--color'?: string; // For default text color (MD)
}

const HabitForm: React.FC<Props> = ({
  isOpen,
  onClose,
  editedHabit,
  title,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<Habit.Type>('checkbox');
  const [unit, setUnit] = useState<string | undefined>();
  const [goal, setGoal] = useState<number>(1);
  const [color, setColor] = useState<typeof CONSTANTS.PRESET_COLORS[number]>(CONSTANTS.PRESET_COLORS[0]);
  const [icon, setIcon] = useState<string | undefined>();
  const [showIconSelect, setShowIconSelect] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset form when opening
      if (editedHabit) {
        setName(editedHabit.name);
        setType(editedHabit.type);
        setUnit(editedHabit.unit);
        setGoal(editedHabit.goal ?? 1);
        setColor(editedHabit.bgColor as typeof CONSTANTS.PRESET_COLORS[number]);
        setIcon(editedHabit.icon);
      } else {
        setName('');
        setType('checkbox');
        setUnit(undefined);
        setGoal(1);
        setColor(CONSTANTS.PRESET_COLORS[0]);
        setIcon(undefined);
      }
    }
  }, [isOpen, editedHabit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const today = getTodayString();
      const habitProps: Habit.Habit = {
        ...(editedHabit as Habit.Habit) ?? {},
        id: editedHabit?.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        type,
        unit: type === 'quantity' ? unit : undefined,
        goal: type === 'quantity' ? goal : 1,
        bgColor: color,
        icon,
        listOrder: editedHabit?.listOrder ?? 0,
        quantity: editedHabit?.history[today]?.quantity ?? 0,
        history: editedHabit?.history ?? {
          [today]: {
            quantity: 0,
            goal: type === 'quantity' ? goal ?? 0 : 0,
          },
        },
      };

      await HabitEntity.create(habitProps);
      onSave?.();
      onClose();
    } catch (error) {
      console.error('Failed to save habit:', error);
      alert('Failed to save habit');
    } finally {
      setIsSaving(false);
    }
  };

  const segmentButtonStyles = useMemo(() => ({
    '--indicator-color': color,
    '--indicator-color-checked': color,
    '--color-checked': color,
    '--color': 'black',
  } as React.CSSProperties), [color]);

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{title}</IonTitle>
          <IonButtons slot="start">
            <IonButton
              onClick={onClose}
              style={{
                '--color': 'var(--neutral-button)',
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
                '--color': color,
              }}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonList>


        <HabitTypeSelection
            value={type}
            onTypeChange={setType}
            segmentButtonStyle={segmentButtonStyles}
          />
          <IonItem>
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <IconSelectButton
                icon={icon}
                onClick={() => setShowIconSelect(true)}
              />
              <div style={{ flex: 1 }}>
                <IonLabel position="stacked">
                  <h1>Name</h1>
                </IonLabel>
                <IonInput
                  value={name}
                  onIonChange={(e) => setName(e.detail.value || '')}
                  placeholder="Enter habit name"
                  required
                />
              </div>
            </div>
          </IonItem>

          {type === 'quantity' && (
            <QuantityInputs
              unit={unit}
              goal={goal}
              onUnitChange={setUnit}
              onGoalChange={setGoal}
            />
          )}

          <IonItem>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                width: '100%',
              }}
            >
              <ColorPicker
                colors={CONSTANTS.PRESET_COLORS}
                selectedColor={color}
                onColorSelect={setColor}
              />
            </div>
          </IonItem>
        </IonList>
      </IonContent>

      <IconSelect
        isOpen={showIconSelect}
        onClose={() => setShowIconSelect(false)}
        onSelect={setIcon}
        currentIcon={icon}
      />
    </IonModal>
  );
};

export default React.memo(HabitForm);