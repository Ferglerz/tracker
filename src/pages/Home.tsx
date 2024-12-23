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
  IonButtons,
  IonProgressBar,
} from '@ionic/react';
import { add, downloadOutline, refreshOutline } from 'ionicons/icons';
import { HabitEntity } from './HabitEntity';
import { HabitRegistry } from './HabitRegistry';
import { HabitListItem } from './HabitListItem';
import HabitForm from './HabitForm';
import { errorHandler } from './ErrorUtils';
import { HabitCSVService } from './HabitCSVService';
import { HabitStorage } from './HabitStorage';
import { Habit } from './HabitTypes';

const Home: React.FC = () => {
  const history = useHistory();
  const [habits, setHabits] = useState<HabitEntity[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitEntity | undefined>(undefined);
  const [habitToDelete, setHabitToDelete] = useState<HabitEntity | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadHabits = useCallback(async (forceRefresh: boolean = false) => {
    try {
      if (forceRefresh) {
        setIsRefreshing(true);
        await HabitRegistry.syncWithStorage();
      }
      const loadedHabits = await HabitRegistry.getAll();
      setHabits(loadedHabits);
    } catch (error) {
      errorHandler.handleError(error, 'Failed to load habits');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  const handleDeleteHabit = useCallback(async () => {
    if (!habitToDelete) return;

    try {
      await HabitRegistry.delete(habitToDelete.id);
      await loadHabits();
      setHabitToDelete(null);
    } catch (error) {
      errorHandler.handleError(error, 'Failed to delete habit');
    }
  }, [habitToDelete, loadHabits]);

  const handleExport = useCallback(async () => {
    try {
      await HabitCSVService.exportHabits(habits);
      errorHandler.showInfo('Export completed successfully');
    } catch (error) {
      errorHandler.handleError(error, 'Failed to export habit data');
    }
  }, [habits]);


  
  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      console.log("Starting refresh process...");
    
      const storage = HabitStorage.getInstance();
      const data = await storage.load();
      console.log("Current storage data:", data);

      const testHabit: Partial<HabitEntity> = {
        id: "123456789",
        name: "Test Habit",
        type: "checkbox" as const,
        bgColor: "#b5ead7",
        quantity: 0,
        isChecked: false,
        isComplete: false,
        isBegun: false,
        unit: undefined,
        goal: undefined,
      };

      if (!data.habits.find(h => h.id === testHabit.id)) {
        data.habits.push(testHabit as HabitEntity);
        console.log("Added test habit to storage data");
        await storage.save(data);
        console.log("Saved updated storage data");
      }

      console.log("Starting sync with storage...");
      await HabitRegistry.syncWithStorage();
      console.log("Storage sync complete");

      console.log("Reloading habits list...");
      const loadedHabits = await HabitRegistry.getAll();
      console.log("New habits list:", loadedHabits);
    
      setHabits(loadedHabits);
      console.log("State updated with new habits");
    } catch (error) {
      console.error("Refresh error:", error);
      errorHandler.handleError(error, 'Failed to refresh habits');
    } finally {
      setIsRefreshing(false);
    }
  }, []);
  const handleCloseForm = useCallback(async () => {
    setIsFormOpen(false);
    setEditingHabit(undefined);
    await loadHabits();
  }, [loadHabits]);

  const openForm = useCallback((habit?: HabitEntity) => {
    setEditingHabit(habit);
    setIsFormOpen(true);
  }, []);

  const handleViewCalendar = useCallback((habit: HabitEntity) => {
    history.push(`/habit/${habit.id}/calendar`, { 
      habitData: {
        id: habit.id,
        name: habit.name,
        type: habit.type,
        unit: habit.unit,
        goal: habit.goal,
        bgColor: habit.bgColor
      }
    });
  }, [history]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle className="ion-text-center">Habits</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleRefresh} disabled={isRefreshing}>
              <IonIcon slot="icon-only" icon={refreshOutline} />
            </IonButton>
            {habits.length > 0 && (
              <IonButton onClick={handleExport}>
                <IonIcon slot="icon-only" icon={downloadOutline} />
              </IonButton>
            )}
          </IonButtons>
          {isRefreshing && <IonProgressBar type="indeterminate" />}
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