import { IonCheckbox } from "@ionic/react";
import { InteractionControlsProps } from "@utils/TypesAndProps";
import { AnimatedIncrements } from "@components/AnimatedIncrements";
import { getTransform, useAnimatedPress } from "@utils/Utilities";

// InteractionControls.tsx
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
        // Always prevent event propagation
        e.stopPropagation();
      }}
    >
      {habit.type === 'checkbox' ? (
        <IonCheckbox
        style={{
          '--size': '24px',
          '--checkbox-background-checked': habit.bgColor,
          '--checkbox-background-hover': habit.bgColor,
          '--border-radius': '50%',
          '--border-color': habit.bgColor,
          '--border-color-checked': habit.bgColor,
          //'--checkmark-color': 'var(--ion-text-color)',
          '--checkmark-width': '3',
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          transform: getTransform(isPressed, 'scale'),
        }}
          checked={quantity > 0}
          alignment="center"
          onIonChange={async (e) => {
            e.stopPropagation();
            handlePress(async () => {
              await handleValueChange(e.detail.checked ? 1 : 0, selectedDate, habit);
            });
          }}
        />
      ) : (
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AnimatedIncrements
            onClick={(e) => {
              e.stopPropagation();
              handleValueChange(Math.max(0, quantity - 1), selectedDate, habit);
            }}
            color={habit.bgColor}
            type="decrement"
          />
          <AnimatedIncrements
            onClick={(e) => {
              e.stopPropagation();
              handleValueChange(quantity + 1, selectedDate, habit);
            }}
            color={habit.bgColor}
            type="increment"
          />
        </div>
      )}
    </div>
  );
};