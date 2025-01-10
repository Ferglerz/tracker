import { IonCheckbox } from "@ionic/react";
import { HabitEntity } from "@utils/HabitEntity";
import { HabitItemState } from "@utils/TypesAndProps";
import { AnimatedIncrements } from "./AnimatedIncrements";

export const InteractionControls = ({
    habit,
    habitItemState,
    handleValueChange
  }: {
    habit: HabitEntity;
    habitItemState: HabitItemState;
    handleValueChange: (value: number) => Promise<void>;
  }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderLeft: '1px solid var(--ion-border-color)',
      padding: '0px',
    }}
      onClick={(e) => {
        if (habit.type === 'checkbox') {
          e.stopPropagation();
        }
      }}>
      {habit.type === 'checkbox' ? (
        <IonCheckbox
          checked={habitItemState.quantity > 0}
          alignment='center'
          onIonChange={async (e) => {
            e.stopPropagation();
            await handleValueChange(e.detail.checked ? 1 : 0);
          }}
          style={{
            '--checkbox-background-checked': habit.bgColor,
            '--checkbox-background-hover': habit.bgColor,
            '--checkbox-border-color': habit.bgColor,
            cursor: 'pointer',
          }}
        />
      ) : (
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AnimatedIncrements
            onClick={() => handleValueChange(Math.max(0, habitItemState.quantity - 1))}
            color={habit.bgColor}
            type="decrement"
          />
          <AnimatedIncrements
            onClick={() => handleValueChange(habitItemState.quantity + 1)}
            color={habit.bgColor}
            type="increment"
          />
        </div>
      )}
    </div>
  );