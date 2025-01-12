//GoalChangeIndicator.tsx
import React from 'react';
import { IonBadge, IonIcon } from '@ionic/react';
import { caretDownOutline, caretUpOutline } from 'ionicons/icons';

interface Props {
  change: number;
  showBadge?: boolean;
  size?: number;
}

export const GoalChangeIndicator: React.FC<Props> = ({
  change,
  showBadge = true,
  size = 18
}) => {
  const isIncrease = change > 0;
  const iconSize = showBadge ? size : size * 0.33; // 6px when size is 18px
  
  return (
    <div style={{
      position: 'relative',
      width: `${size}px`,
      height: `${size}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <IonIcon
        icon={isIncrease ? caretUpOutline : caretDownOutline}
        style={{
          position: 'absolute',
          fontSize: `${iconSize}px`,
          color: 'var(--ion-color-medium)',
          opacity: 0.5
        }}
      />
      {showBadge && (
        <IonBadge
          style={{
            position: 'absolute',
            backgroundColor: 'var(--ion-color-light)',
            color: 'var(--ion-color-dark)',
            padding: '2px 4px',
            fontSize: `${size * 0.4}px`, // ~7px when size is 18px
            minWidth: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {change > 0 ? `+${change}` : change}
        </IonBadge>
      )}
    </div>
  );
};