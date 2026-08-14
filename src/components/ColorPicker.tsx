// ColorPicker.tsx
import React from 'react';
import { IonIcon } from '@ionic/react';
import { checkmark } from 'ionicons/icons';
import { CONSTANTS } from '@utils/Constants'; // Make sure you import CONSTANTS

interface Props {
  colors: typeof CONSTANTS.PRESET_COLORS; // Use the type directly
  selectedColor: typeof CONSTANTS.PRESET_COLORS[number];
  onColorSelect: (color: typeof CONSTANTS.PRESET_COLORS[number]) => void;
}

export const ColorPicker: React.FC<Props> = ({ colors, selectedColor, onColorSelect }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '8px',
    padding: '10px 0',
    width: '70%',
  }}>
    {colors.map((color) => (
      <button
        type="button"
        key={color}
        onClick={() => onColorSelect(color)}
        aria-label={`Select color ${color}`}
        aria-pressed={selectedColor === color}
        style={{
          aspectRatio: '1',
          borderRadius: '30%',
          backgroundColor: color,
          cursor: 'pointer',
          border: selectedColor === color ? '5px solid #000' : '5px solid transparent',
          padding: 0,
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        {selectedColor === color && (
          <IonIcon
            icon={checkmark}
            style={{
              fontSize: '15px',
              color: '#000'
            }}
          />
        )}
      </button>
    ))}
  </div>
);