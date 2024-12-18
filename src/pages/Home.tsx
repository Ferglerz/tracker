// Home.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonButton,
  IonFab,
  IonFabButton,
  IonIcon,
  IonAlert,
  IonToast,
  IonButtons,
} from '@ionic/react';
import { add, downloadOutline } from 'ionicons/icons';
import { HabitStorageAPI, type Habit } from './HabitStorage';
import { HabitListItem } from './HabitListItem';
import HabitForm from './HabitForm';
import { errorHandler } from './ErrorUtils';
import { deleteHabit, exportHabitHistoryToCSV, updateHabitValue } from './HabitOperations';
import { UpdateAction } from './HabitTypes';

const Home: React.FC = () => {
  const history = useHistory();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);
  const [showLongPressToast, setShowLongPressToast] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);

  const loadHabits = useCallback(async () => {
    try {
      const data = await HabitStorageAPI.handleHabitData('load');
      setHabits(data.habits);
    } catch (error) {
      errorHandler.handleError(error, 'Failed to load habits');
    }
  }, []);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  const handleHabitUpdate = useCallback(async (id: string, action: UpdateAction) => {
    try {
      const updatedHabits = await updateHabitValue(habits, id, action);
      setHabits(updatedHabits);
    } catch (error) {
      errorHandler.handleError(error, `Failed to update habit ${action.type}`);
    }
  }, [habits]);

  const handleDeleteHabit = useCallback(async () => {
    if (!habitToDelete) return;

    try {
      const updatedHabits = await deleteHabit(habits, habitToDelete);
      setHabits(updatedHabits);
      setHabitToDelete(null);
    } catch (error) {
      errorHandler.handleError(error, 'Failed to delete habit');
    }
  }, [habitToDelete, habits]);

  const handleExport = useCallback(async () => {
    try {
      await exportHabitHistoryToCSV(habits);
      errorHandler.showInfo('Export completed successfully');
    } catch (error) {
      errorHandler.handleError(error, 'Failed to export habit data');
    }
  }, [habits]);

  const handleCloseForm = useCallback(async () => {
    setIsFormOpen(false);
    setEditingHabit(null);
    await loadHabits(); // Refresh list after form closes
  }, [loadHabits]);

  const openForm = useCallback((habit?: Habit) => {
    setEditingHabit(habit || null);
    setIsFormOpen(true);
  }, []);

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
                onDelete={() => setHabitToDelete(habit.id)}
                onViewCalendar={() => handleViewCalendar(habit)}
                onLongPress={handleLongPress}
              />
            ))}
          </IonList>
        )}

        <HabitForm
          isOpen={isFormOpen}
          title={editingHabit ? "Edit Habit" : "New Habit"}
          initialData={editingHabit || undefined}
          onClose={handleCloseForm}
        />

        <IonAlert
          isOpen={!!habitToDelete}
          onDidDismiss={() => setHabitToDelete(null)}
          header="Delete Habit"
          message="Are you sure you want to delete this habit? This action cannot be undone."
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              handler: () => setHabitToDelete(null)
            },
            {
              text: 'Delete',
              role: 'destructive',
              handler: handleDeleteHabit
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