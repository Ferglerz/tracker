// IconSelectButton.tsx
import React from 'react';
import { IonIcon } from '@ionic/react';
import { help } from 'ionicons/icons';
import { getIcon } from '@utils/iconUtils';

interface Props {
  icon?: string;
  onClick: () => void;
}

export const IconSelectButton: React.FC<Props> = ({ icon, onClick }) => {
  const iconRef = getIcon(icon) || help;
  
  return (
    <div
      onClick={onClick}
      style={{
        width: '48px',
        height: '48px',
        border: '2px dashed var(--ion-color-medium)',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        marginRight: '12px'
      }}
    >
      <IonIcon
        icon={iconRef}
        style={{
          fontSize: '24px',
          color: 'var(--ion-color-medium)'
        }}
      />
    </div>
  );
};