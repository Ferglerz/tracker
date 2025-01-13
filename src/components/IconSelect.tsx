// IconSelect.tsx
import React, { useState } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonButton,
  IonButtons,
  IonSearchbar,
} from '@ionic/react';
import { checkmark } from 'ionicons/icons';
import * as icons from 'ionicons/icons';
import { ICON_CATEGORIES } from '@utils/Constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (iconName: string) => void;
  currentIcon?: string;
}

export const IconSelect: React.FC<Props> = ({
  isOpen,
  onClose,
  onSelect,
  currentIcon
}) => {
  const [searchText, setSearchText] = useState('');

  const filteredCategories = ICON_CATEGORIES.map(category => ({
    ...category,
    icons: category.icons.filter(icon => 
      icon.name.toLowerCase().includes(searchText.toLowerCase()) ||
      icon.description.toLowerCase().includes(searchText.toLowerCase())
    )
  })).filter(category => category.icons.length > 0);

  const handleSelect = (iconName: string) => {
    onSelect(iconName);
    onClose();
  };

  return (
    <IonModal 
      isOpen={isOpen} 
      onDidDismiss={onClose}
      breakpoints={[0, 1]}
      initialBreakpoint={1}
    >
      <IonHeader>
        <IonToolbar>
          <IonTitle>Select Icon</IonTitle>
          <IonButtons slot="start">
            <IonButton onClick={onClose}>Cancel</IonButton>
          </IonButtons>
        </IonToolbar>
        <IonToolbar>
          <IonSearchbar
            value={searchText}
            onIonInput={e => setSearchText(e.detail.value!)} // Changed from onIonChange to onIonInput
            placeholder="Search icons..."
            // Removed the debounce property
          />
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList>
          {filteredCategories.map(category => (
            <React.Fragment key={category.name}>
              <IonItem>
                <IonLabel color="medium" className="ion-padding-top">
                  <h2 style={{ 
                    fontWeight: '600',
                    fontSize: '0.9em',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {category.name}
                  </h2>
                </IonLabel>
              </IonItem>
              {category.icons.map(icon => (
                <IonItem
                  key={icon.icon}
                  button
                  onClick={() => handleSelect(icon.icon)}
                  detail={false}
                  className={currentIcon === icon.icon ? 'selected-icon' : ''}
                  style={{
                    '--padding-start': '16px',
                    '--inner-padding-end': '16px'
                  }}
                >
                  <IonIcon
                    icon={(icons as any)[icon.icon]}
                    slot="start"
                    style={{
                      fontSize: '24px',
                      color: currentIcon === icon.icon ? 'var(--ion-color-primary)' : undefined,
                      marginRight: '16px'
                    }}
                  />
                  <IonLabel>
                    <h2 style={{ 
                      fontSize: '0.95em',
                      marginBottom: '4px'
                    }}>
                      {icon.name}
                    </h2>
                    <p style={{ 
                      fontSize: '0.8em',
                      color: 'var(--ion-color-medium)'
                    }}>
                      {icon.description}
                    </p>
                  </IonLabel>
                  {currentIcon === icon.icon && (
                    <IonIcon
                      icon={checkmark}
                      slot="end"
                      color="primary"
                      style={{ fontSize: '20px' }}
                    />
                  )}
                </IonItem>
              ))}
            </React.Fragment>
          ))}
        </IonList>
      </IonContent>
    </IonModal>
  );
};