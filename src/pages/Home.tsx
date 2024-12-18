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
import { HabitModel } from './HabitModel';
import { HabitListItem } from './HabitListItem';
import HabitForm from './HabitForm';
import { errorHandler } from './ErrorUtils';
import { exportHabitHistoryToCSV } from './HabitOperations';

const Home: React.FC = () => {
  const history = useHistory();
  const [habits, setHabits] = useState<HabitModel[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitModel | undefined>(undefined);
  const [habitToDelete, setHabitToDelete] = useState<HabitModel | null>(null);
  const [showLongPressToast, setShowLongPressToast] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<HabitModel | null>(null);

  const loadHabits = useCallback(async () => {
    try {
      const loadedHabits = await HabitModel.getAll();
      setHabits(loadedHabits);
    } catch (error) {
      errorHandler.handleError(error, 'Failed to load habits');
    }
  }, []);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  const handleDeleteHabit = useCallback(async () => {
    if (!habitToDelete) return;

    try {
      await HabitModel.delete(habitToDelete.id);
      await loadHabits();
      setHabitToDelete(null);
    } catch (error) {
      errorHandler.handleError(error, 'Failed to delete habit');
    }
  }, [habitToDelete, loadHabits]);

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
    setEditingHabit(undefined);
    await loadHabits();
  }, [loadHabits]);

  const openForm = useCallback((habit?: HabitModel) => {
    setEditingHabit(habit);
    setIsFormOpen(true);
  }, []);

  const handleLongPress = useCallback((habit: HabitModel) => {
    setSelectedHabit(habit);
    setShowLongPressToast(true);
    console.log('Long press triggered', { 
      selectedHabit: selectedHabit?.name,
      showToast: showLongPressToast 
    });
  }, []);

  const handleViewCalendar = useCallback((habit: HabitModel) => {
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
                onEdit={() => openForm(habit)}
                onDelete={() => setHabitToDelete(habit)}
                onViewCalendar={() => handleViewCalendar(habit)}
                onLongPress={handleLongPress}
              />
            ))}
          </IonList>
        )}

        <HabitForm
          isOpen={isFormOpen}
          title={editingHabit ? "Edit Habit" : "New Habit"}
          initialHabit={editingHabit}
          onClose={handleCloseForm}
        />

        <IonAlert
          isOpen={!!habitToDelete}
          onDidDismiss={() => setHabitToDelete(null)}
          header="Delete Habit"
          message={`Are you sure you want to delete "${habitToDelete?.name}"? This action cannot be undone.`}
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