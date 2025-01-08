// ColorPicker.tsx
import React from 'react';
import { IonIcon } from '@ionic/react';
import { checkmark } from 'ionicons/icons';

interface Props {
  colors: readonly string[];
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

export const ColorPicker: React.FC<Props> = ({ colors, selectedColor, onColorSelect }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(8, 1fr)',
    gridTemplateRows: 'repeat(2, 1fr)',
    gap: '8px',
    padding: '10px 0',
    width: '70%',
  }}>
    {colors.map((color) => (
      <div
        key={color}
        onClick={() => onColorSelect(color)}
        style={{
          aspectRatio: '1',
          borderRadius: '30%',
          backgroundColor: color,
          cursor: 'pointer',
          border: selectedColor === color ? '5px solid #000' : '5px solid transparent',
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
      </div>
    ))}
  </div>
);