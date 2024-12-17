import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonButton, IonFab, 
  IonFabButton, IonIcon, IonAlert, IonToast, IonButtons,
} from '@ionic/react';
import { add, downloadOutline } from 'ionicons/icons';
import { HabitStorageAPI, type Habit, type HabitData } from './HabitStorage';
import { updateHabitValue, deleteHabit, exportHabitHistoryToCSV } from './HabitOperations';
import { UpdateAction } from './HabitTypes';
import { errorHandler } from './ErrorUtils';
import HabitForm from './HabitForm';
import { HabitListItem } from './HabitListItem';

const Home: React.FC = () => {
  const history = useHistory();
  const [habitsData, setHabitsData] = useState<HabitData>({ habits: [], history: {} });
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);
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

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await HabitStorageAPI.init();
        setHabitsData(data);
      } catch (error) {
        console.error('Failed to load initial data:', error);
        errorHandler.handleError(error, 'Failed to load habits');
      }
    };

    loadData();

    // Subscribe to storage changes
    const handleStorageChange = async () => {
      loadData();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Memoized handlers
  const handleHabitUpdate = useCallback(
    (id: string, action: UpdateAction) => updateHabitValue(habitsData.habits, id, action)
      .then(updatedHabits => setHabitsData(prev => ({ ...prev, habits: updatedHabits })))
      .catch(error => errorHandler.handleError(error, `Failed to update habit ${action.type}`)),
    [habitsData.habits]
  );

  const handleDeleteHabit = useCallback(async (id: string) => {
    try {
      const updatedHabits = await deleteHabit(habitsData.habits, id);
      setHabitsData(prev => ({ ...prev, habits: updatedHabits }));
      setHabitToDelete(null);
    } catch (error) {
      errorHandler.handleError(error, 'Failed to delete habit');
    }
  }, [habitsData.habits]);

  const handleExport = useCallback(async () => {
    try {
      await exportHabitHistoryToCSV(habitsData.habits);
      errorHandler.showInfo('Export completed successfully');
    } catch (error) {
      errorHandler.handleError(error, 'Failed to export habit data');
    }
  }, [habitsData.habits]);

  const handleSaveHabit = useCallback(async (formData: Omit<Habit, 'id' | 'isChecked' | 'isComplete' | 'isBegun' | 'quantity'>) => {
    try {
      const currentData = await HabitStorageAPI.handleHabitData('load');
      
      const habitData = {
        ...formData,
        id: editingHabit?.id || Date.now().toString(),
        quantity: editingHabit?.quantity || 0,
        isChecked: editingHabit?.isChecked || false,
        isComplete: editingHabit?.isComplete || false,
        isBegun: editingHabit?.isBegun || false
      };
  
      const updatedHabits = editingHabit 
        ? currentData.habits.map(h => h.id === editingHabit.id ? habitData : h)
        : [...currentData.habits, habitData];
  
      const newData = {
        ...currentData,
        habits: updatedHabits
      };
      
      await HabitStorageAPI.handleHabitData('save', newData);
      setHabitsData(newData);
      // Don't set showForm and editingHabit here - let the form component handle its own closure
    } catch (error) {
      console.error('Save habit error:', error);
      errorHandler.handleError(error, 'Failed to save habit');
      throw error; // Re-throw the error to be caught by the form
    }
  }, [editingHabit]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle className="ion-text-center">Habits</IonTitle>
          {habitsData.habits.length > 0 && (
            <IonButtons slot="end">
              <IonButton onClick={handleExport}>
                <IonIcon slot="icon-only" icon={downloadOutline} />
              </IonButton>
            </IonButtons>
          )}
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {habitsData.habits.length === 0 ? (
          <div className="ion-padding ion-text-center" style={{ marginTop: '2rem' }}>
            Add a new habit to track with the + button, bottom right.
          </div>
        ) : (
          <IonList>
            {habitsData.habits.map((habit) => (
              <HabitListItem
                key={habit.id}
                habit={habit}
                onUpdate={handleHabitUpdate}
                onEdit={() => {
                  setEditingHabit(habit);
                  setShowForm(true);
                }}
                onDelete={() => setHabitToDelete(habit.id)}
                onViewCalendar={() => handleViewCalendar(habit)}
                onLongPress={handleLongPress}
              />
            ))}
          </IonList>
        )}

        {showForm && (
          <HabitForm
            title={editingHabit ? "Edit Habit" : "New Habit"}
            initialData={editingHabit || undefined}
            onClose={() => {
              setShowForm(false);
              setEditingHabit(null);
            }}
            onSave={handleSaveHabit}
          />
        )}

        <IonAlert
          isOpen={!!habitToDelete}
          onDidDismiss={() => setHabitToDelete(null)}
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
                if (habitToDelete) {
                  handleDeleteHabit(habitToDelete);
                }
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
          <IonFabButton onClick={() => {
            setEditingHabit(null);
            setShowForm(true);
          }}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
};

export default Home;