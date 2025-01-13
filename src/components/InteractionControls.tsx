import { IonCheckbox } from "@ionic/react";
import { InteractionControlsProps } from "@utils/TypesAndProps";
import { AnimatedIncrements } from "@components/AnimatedIncrements";
import { getTransform, useAnimatedPress } from "@utils/Utilities";

export const InteractionControls = ({
  habit,
  handleValueChange,
  selectedDate,
}: InteractionControlsProps) => {
  const quantity = habit.history[selectedDate]?.quantity || 0;
  const { isPressed, handlePress } = useAnimatedPress();

  return (
    <div
      style={{
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
      }}
    >
      {habit.type === 'checkbox' ? (
        <IonCheckbox
          checked={quantity > 0}
          alignment="center"
          onIonChange={async (e) => {
            e.stopPropagation();
            handlePress(async () => {
              await handleValueChange(e.detail.checked ? 1 : 0, selectedDate, habit);
            });
          }}
          style={{
            '--size': '24px',
            '--checkbox-background-checked': habit.bgColor,
            '--checkbox-background-hover': habit.bgColor,
            '--border-radius': '50%',
            '--border-color': habit.bgColor,
            '--border-color-checked': habit.bgColor,
            '--checkmark-color': 'var(--ion-text-color)',
            '--checkmark-width': '3',
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            transform: getTransform(isPressed, 'scale'),
          }}
        />
      ) : (
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AnimatedIncrements
            onClick={() => handleValueChange(Math.max(0, quantity - 1), selectedDate, habit)}
            color={habit.bgColor}
            type="decrement"
          />
          <AnimatedIncrements
            onClick={() => handleValueChange(quantity + 1, selectedDate, habit)}
            color={habit.bgColor}
            type="increment"
          />
        </div>
      )}
    </div>
  );
};