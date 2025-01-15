import React, { useState } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonButton,
  IonButtons,
  IonSearchbar,
} from '@ionic/react';
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
      icon.tags.toLowerCase().includes(searchText.toLowerCase())
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
          <IonButtons slot="start">
            <IonButton onClick={onClose}>Cancel</IonButton>
          </IonButtons>
        </IonToolbar>
        <IonToolbar>
          <IonSearchbar
            value={searchText}
            onIonInput={e => setSearchText(e.detail.value!)}
            placeholder="Search icons..."
          />
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {filteredCategories.map(category => (
          <div key={category.name}>
            <IonRow>
              <IonCol className="ion-padding-top">
                <h2 style={{
                  fontWeight: '600',
                  fontSize: '0.9em',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  width: '100%',
                  textAlign: 'center',
                }}>
                  {category.name}
                </h2>
              </IonCol>
            </IonRow>
            <IonGrid>
              <IonRow>
                {category.icons.map(icon => (
                  <IonCol size="3" key={icon.icon}>
                    <div
                      onClick={() => handleSelect(icon.icon)}
                      className="icon-container"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '10px',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      <IonIcon
                        icon={(icons as any)[icon.icon]}
                        style={{
                          fontSize: '24px',
                          marginBottom: '5px'
                        }}
                      />
                    </div>
                  </IonCol>
                ))}
              </IonRow>
            </IonGrid>
          </div>
        ))}
      </IonContent>
    </IonModal>
  );
};