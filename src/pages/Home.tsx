// Home.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonFab,
  IonFabButton,
  IonIcon,
  IonCheckbox,
  IonBadge,
  IonItemSliding,
  IonItemOption,
  IonItemOptions,
  IonModal,
  IonAlert,
  IonToast,
  IonRippleEffect,
  IonButtons,
} from '@ionic/react';
import { add, remove, pencil, trash, calendar, downloadOutline } from 'ionicons/icons';
import { HabitStorageAPI, type Habit, type HabitData } from './HabitStorage';
import { updateQuantity, updateCheckbox, deleteHabit, exportHabitHistoryToCSV } from './HabitOperations';
import { errorHandler } from './ErrorUtils';

const PRESET_COLORS = [
  '#ff9aa2', '#ffb7b2', '#ffdac1', '#e2f0cb',
  '#b5ead7', '#c7ceea', '#9b9b9b', '#f8c8dc'
] as const;

interface HabitFormData {
  name: string;
  type: 'checkbox' | 'quantity';
  unit?: string;
  goal?: number;
  bgColor: string;
}

const DEFAULT_FORM_DATA: HabitFormData = {
  name: '',
  type: 'checkbox',
  bgColor: PRESET_COLORS[0]
};

// Separate HabitForm into its own component for better organization
const HabitForm: React.FC<{
  onClose: () => void;
  onSave: (habit: HabitFormData) => Promise<void>;
  initialData?: Habit;
  title: string;
}> = React.memo(({ onClose, onSave, initialData, title }) => {
  const [formData, setFormData] = useState<HabitFormData>(() => ({
    ...DEFAULT_FORM_DATA,
    ...initialData && {
      name: initialData.name,
      type: initialData.type,
      unit: initialData.unit,
      goal: initialData.goal,
      bgColor: initialData.bgColor || DEFAULT_FORM_DATA.bgColor
    }
  }));

  const handleSave = async () => {
    if (!formData.name.trim()) {
      errorHandler.showWarning('Please enter a habit name');
      return;
    }
    await onSave(formData);
  };

  const updateField = <K extends keyof HabitFormData>(
    field: K,
    value: HabitFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <IonModal isOpen={true} onDidDismiss={onClose}>
      {/* Form JSX remains the same */}
    </IonModal>
  );
});

const Home: React.FC = () => {
  const history = useHistory();
  const [habitsData, setHabitsData] = useState<HabitData>({ habits: [], history: {} });
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);
  const [showLongPressToast, setShowLongPressToast] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await HabitStorageAPI.handleHabitData('load');
        setHabitsData(data);
      } catch (error) {
        errorHandler.handleError(error, 'Failed to load habits');
      }
    };
    loadData();
  }, []);

  // Memoized handlers
  const handleUpdateQuantity = useCallback(async (id: string, delta: number) => {
    try {
      const updatedHabits = await updateQuantity(habitsData.habits, id, delta);
      setHabitsData(prev => ({ ...prev, habits: updatedHabits }));
    } catch (error) {
      errorHandler.handleError(error, 'Failed to update quantity');
    }
  }, [habitsData.habits]);

  const handleUpdateCheckbox = useCallback(async (id: string, checked: boolean) => {
    try {
      const updatedHabits = await updateCheckbox(habitsData.habits, id, checked);
      setHabitsData(prev => ({ ...prev, habits: updatedHabits }));
    } catch (error) {
      errorHandler.handleError(error, 'Failed to update habit');
    }
  }, [habitsData.habits]);

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

  const handleSaveHabit = useCallback(async (formData: HabitFormData) => {
    try {
      let updatedHabits: Habit[];
      
      const habitData = {
        ...formData,
        id: editingHabit?.id || Date.now().toString(),
        quantity: editingHabit?.quantity || 0,
        isChecked: editingHabit?.isChecked || false,
        isComplete: editingHabit?.isComplete || false,
        isBegun: editingHabit?.isBegun || false
      };

      if (editingHabit) {
        updatedHabits = habitsData.habits.map(h => 
          h.id === editingHabit.id ? habitData : h
        );
      } else {
        updatedHabits = [...habitsData.habits, habitData];
      }

      await HabitStorageAPI.handleHabitData('save', {
        ...habitsData,
        habits: updatedHabits
      });

      setHabitsData(prev => ({ ...prev, habits: updatedHabits }));
      setShowForm(false);
      setEditingHabit(null);
    } catch (error) {
      errorHandler.handleError(error, 'Failed to save habit');
    }
  }, [editingHabit, habitsData]);

  const handleViewCalendar = useCallback((habit: Habit) => {
    history.push(`/habit/${habit.id}/calendar`, { habit });
  }, [history]);

  // Long press handling
  const handleLongPress = useCallback((habit: Habit) => {
    const timer = setTimeout(() => {
      setSelectedHabit(habit);
      setShowLongPressToast(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Memoize sorted habits if needed
  const sortedHabits = useMemo(() => {
    return [...habitsData.habits].sort((a, b) => a.name.localeCompare(b.name));
  }, [habitsData.habits]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle className="ion-text-center">Habits</IonTitle>
          {sortedHabits.length > 0 && (
            <IonButtons slot="end">
              <IonButton onClick={handleExport}>
                <IonIcon slot="icon-only" icon={downloadOutline} />
              </IonButton>
            </IonButtons>
          )}
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {sortedHabits.length === 0 ? (
          <div className="ion-padding ion-text-center" style={{ marginTop: '2rem' }}>
            Add a new habit to track with the + button, bottom right.
          </div>
        ) : (
          <IonList>
            {sortedHabits.map((habit) => (
              <HabitListItem
                key={habit.id}
                habit={habit}
                onUpdateQuantity={handleUpdateQuantity}
                onUpdateCheckbox={handleUpdateCheckbox}
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

        {/* Modals and Alerts */}
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

// Separate HabitListItem component for better performance
const HabitListItem: React.FC<{
  habit: Habit;
  onUpdateQuantity: (id: string, delta: number) => Promise<void>;
  onUpdateCheckbox: (id: string, checked: boolean) => Promise<void>;
  onEdit: () => void;
  onDelete: () => void;
  onViewCalendar: () => void;
  onLongPress: (habit: Habit) => void;
}> = React.memo(({
  habit,
  onUpdateQuantity,
  onUpdateCheckbox,
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
              onIonChange={(e) => onUpdateCheckbox(habit.id, e.detail.checked)}
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
              <IonButton fill="clear" onClick={() => onUpdateQuantity(habit.id, -1)}>
                <IonIcon icon={remove} />
              </IonButton>
              <IonButton fill="clear" onClick={() => onUpdateQuantity(habit.id, 1)}>
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
