import React, { useState, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonButton, IonFab, 
  IonFabButton, IonIcon, IonAlert, IonToast, IonButtons,
} from '@ionic/react';
import { add, downloadOutline } from 'ionicons/icons';
import type { Habit } from './HabitStorage';
import { HabitListItem } from './HabitListItem';
import HabitForm from './HabitForm';
import { useHabitManager } from './useHabitManager';

const Home: React.FC = () => {
  const history = useHistory();
  const {
    habits,
    isFormOpen,
    editingHabit,
    habitToDelete,
    handleHabitUpdate,
    handleDeleteHabit,
    handleExport,
    handleSaveHabit,
    openForm,
    closeForm,
    confirmDelete,
    cancelDelete
  } = useHabitManager();

  const [showLongPressToast, setShowLongPressToast] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);

  const handleLongPress = useCallback((habit: Habit) => {
    const timer = setTimeout(() => {
      setSelectedHabit(habit);
      setShowLongPressToast(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);
  
  const handleViewCalendar = useCallback((habit: Habit) => {
    history.push(`/habit/${habit.id}/calendar`, { habit });
  }, [history]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle className="ion-text-center">Habits</IonTitle>
          {habits.length > 0 && (
            <IonButtons slot="end">
              <IonButton onClick={handleExport}>
                <IonIcon slot="icon-only" icon={downloadOutline} />
              </IonButton>
            </IonButtons>
          )}
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {habits.length === 0 ? (
          <div className="ion-padding ion-text-center" style={{ marginTop: '2rem' }}>
            Add a new habit to track with the + button, bottom right.
          </div>
        ) : (
          <IonList>
            {habits.map((habit) => (
              <HabitListItem
                key={habit.id}
                habit={habit}
                onUpdate={handleHabitUpdate}
                onEdit={() => openForm(habit)}
                onDelete={() => confirmDelete(habit.id)}
                onViewCalendar={() => handleViewCalendar(habit)}
                onLongPress={handleLongPress}
              />
            ))}
          </IonList>
        )}

        {isFormOpen && (
          <HabitForm
            title={editingHabit ? "Edit Habit" : "New Habit"}
            initialData={editingHabit || undefined}
            onClose={closeForm}
            onSave={handleSaveHabit}
          />
        )}

        <IonAlert
          isOpen={!!habitToDelete}
          onDidDismiss={cancelDelete}
          header="Delete Habit"
          message="Are you sure you want to delete this habit? This action cannot be undone."
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              handler: () => true
            },
            {
              text: 'Delete',
              role: 'destructive',
              handler: () => {
                handleDeleteHabit();
                return true;
              }
            }
          ]}
        />

        <IonToast
          isOpen={showLongPressToast}
          onDidDismiss={() => setShowLongPressToast(false)}
          message={`Long pressed: ${selectedHabit?.name}`}
          duration={2000}
          position="bottom"
        />

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => openForm()}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
};

export default Home;