// Home.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList,
  IonItem, IonLabel, IonButton, IonFab, IonFabButton, IonIcon,
  IonCheckbox, IonBadge, IonItemSliding, IonItemOption,
  IonItemOptions, IonAlert, IonToast, IonRippleEffect, IonButtons, 
  IonFooter,
} from '@ionic/react';
import { add, remove, pencil, trash, calendar, downloadOutline, checkmark } from 'ionicons/icons';
import { HabitStorageAPI, type Habit, type HabitData } from './HabitStorage';
import { updateHabitValue, deleteHabit, exportHabitHistoryToCSV } from './HabitOperations';
import { UpdateAction, HabitFormData } from './HabitTypes';
import { errorHandler } from './ErrorUtils';
import HabitForm from './HabitForm';

const Home: React.FC = () => {
  const history = useHistory();
  const [habitsData, setHabitsData] = useState<HabitData>({ habits: [], history: {} });
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);
  const [showLongPressToast, setShowLongPressToast] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);

  useEffect(() => {
    console.log('Habits data changed:', habitsData);
  }, [habitsData]);

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
      console.log('Loading initial data...');
      try {
        const data = await HabitStorageAPI.handleHabitData('load');
        console.log('Initial data loaded:', data);
        setHabitsData(data);
      } catch (error) {
        console.error('Failed to load initial data:', error);
        errorHandler.handleError(error, 'Failed to load habits');
      }
    };

    // Subscribe to storage changes
    const handleStorageChange = async () => {
      console.log('Storage changed, reloading data');
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
    console.log('Saving habit with form data:', formData);
    try {
      const habitData = {
        ...formData,
        id: editingHabit?.id || Date.now().toString(),
        quantity: editingHabit?.quantity || 0,
        isChecked: editingHabit?.isChecked || false,
        isComplete: editingHabit?.isComplete || false,
        isBegun: editingHabit?.isBegun || false
      };
      console.log('Created habit data:', habitData);
  
      const updatedHabits = editingHabit 
        ? habitsData.habits.map(h => h.id === editingHabit.id ? habitData : h)
        : [...habitsData.habits, habitData];
      console.log('Updated habits array:', updatedHabits);
  
      const newData = {
        ...habitsData,
        habits: updatedHabits
      };
      
      await HabitStorageAPI.handleHabitData('save', newData);
      console.log('Saved to storage, setting state with:', newData);
      
      setHabitsData(newData);
      setShowForm(false);
      setEditingHabit(null);
    } catch (error) {
      console.error('Save habit error:', error);
      errorHandler.handleError(error, 'Failed to save habit');
    }
  }, [editingHabit, habitsData]);

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
    onSave={(data) => {
      console.log('Form onSave wrapper called with data:', data);
      return handleSaveHabit(data);
    }}
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

// Separate HabitListItem component for better performance
const HabitListItem: React.FC<{
  habit: Habit;
  onUpdate: (id: string, action: UpdateAction) => Promise<void>;
  onEdit: () => void;
  onDelete: () => void;
  onViewCalendar: () => void;
  onLongPress: (habit: Habit) => void;
}> = React.memo(({
  habit,
  onUpdate,
  onEdit,
  onDelete,
  onViewCalendar,
  onLongPress
}) => {
  return (
    <IonItemSliding>
      <IonItem
        className="ion-activatable habit"
        onTouchStart={() => onLongPress(habit)}
        style={{ backgroundColor: habit.bgColor }}
      >
        {habit.type === 'checkbox' ? (
          <>
            <IonCheckbox
              slot="start"
              checked={habit.isChecked}
              onIonChange={(e) => onUpdate(habit.id, { 
                type: 'checkbox', 
                checked: e.detail.checked 
              })}
              style={{ zIndex: 1 }}
            />
            {habit.name}
          </>
        ) : (
          <>
            <IonLabel>
              <h2>{habit.name}</h2>
              <p>{habit.quantity}{habit.goal ? ` / ${habit.goal}` : ''} {habit.unit}</p>
            </IonLabel>
            {habit.isComplete && (
              <IonBadge color="success">Complete!</IonBadge>
            )}
            <div slot="end" style={{ display: 'flex', alignItems: 'center' }}>
              <IonButton 
                fill="clear" 
                onClick={() => onUpdate(habit.id, { type: 'quantity', delta: -1 })}
              >
                <IonIcon icon={remove} />
              </IonButton>
              <IonButton 
                fill="clear" 
                onClick={() => onUpdate(habit.id, { type: 'quantity', delta: 1 })}
              >
                <IonIcon icon={add} />
              </IonButton>
            </div>
          </>
        )}
        <IonRippleEffect />
      </IonItem>
      <IonItemOptions side="end">
        <IonItemOption color="primary" onClick={onViewCalendar}>
          <IonIcon slot="icon-only" icon={calendar} />
        </IonItemOption>
        <IonItemOption color="warning" onClick={onEdit}>
          <IonIcon slot="icon-only" icon={pencil} />
        </IonItemOption>
        <IonItemOption color="danger" onClick={onDelete}>
          <IonIcon slot="icon-only" icon={trash} />
        </IonItemOption>
      </IonItemOptions>
    </IonItemSliding>
  );
});

export default Home;
