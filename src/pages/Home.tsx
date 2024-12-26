// Home.tsx
import React, { useState, useCallback } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonFab,
  IonFabButton,
  IonIcon,
  IonAlert,
  IonButtons,
  IonButton,
  IonProgressBar,
} from '@ionic/react';
import { add, downloadOutline } from 'ionicons/icons';
import { HabitEntity } from './HabitEntity';
import { HabitListItem, HabitListItemRef } from './HabitListItem';
import HabitForm from './HabitForm';
import { useHabits, useHabitForm, useHabitDelete, useHabitExport } from './Hooks';

const EmptyState: React.FC = () => (
  <div className="ion-padding ion-text-center" style={{ marginTop: '2rem' }}>
    Add a new habit to track with the + button, bottom right.
  </div>
);

const TopToolbar: React.FC<{
  onExport: () => Promise<void>;
  hasHabits: boolean;
}> = ({ onExport, hasHabits }) => (
  <IonToolbar>
    <IonTitle className="ion-text-center">Habits</IonTitle>
    <IonButtons slot="end">
      {hasHabits && (
        <IonButton 
          onClick={onExport}
          style={{
            '--color': 'var(--neutral-button)'
          }}
        >
          <IonIcon slot="icon-only" icon={downloadOutline} />
        </IonButton>
      )}
    </IonButtons>
  </IonToolbar>
);

const HabitList: React.FC<{
  habits: HabitEntity[];
  onEdit: (habit: HabitEntity) => void;
  onDelete: (habit: HabitEntity) => void;
  openCalendarId: string | null;
  onToggleCalendar: (habitId: string) => void;
  itemRefs: React.MutableRefObject<Record<string, HabitListItemRef | null>>;
}> = ({ habits, onEdit, onDelete, openCalendarId, onToggleCalendar, itemRefs }) => (
  <IonList>
    {habits.map((habit) => (
      <HabitListItem
        key={habit.id}
        ref={(el) => itemRefs.current[habit.id] = el}
        habit={habit}
        onEdit={() => onEdit(habit)}
        onDelete={() => onDelete(habit)}
        isCalendarOpen={openCalendarId === habit.id}
        onToggleCalendar={onToggleCalendar}
      />
    ))}
  </IonList>
);

const Home: React.FC = () => {
  const { habits, isRefreshing, refreshHabits } = useHabits();
  const { isFormOpen, editingHabit, openForm: originalOpenForm, closeForm: originalCloseForm } = useHabitForm();
  const { habitToDelete, setHabitToDelete, handleDeleteHabit } = useHabitDelete(refreshHabits);
  const { handleExport } = useHabitExport(habits);
  const itemRefs = React.useRef<Record<string, HabitListItemRef | null>>({});
  const [openCalendarId, setOpenCalendarId] = useState<string | null>(null);

  const closeForm = React.useCallback(async () => {
    // Close all sliding items
    const closePromises = Object.values(itemRefs.current)
      .map(ref => ref?.closeSliding());
    await Promise.all(closePromises);
    
    originalCloseForm();
  }, [originalCloseForm]);

  const openForm = React.useCallback(async (habit?: HabitEntity) => {
    // Close all sliding items before opening form
    const closePromises = Object.values(itemRefs.current)
      .map(ref => ref?.closeSliding());
    await Promise.all(closePromises);
    
    originalOpenForm(habit);
  }, [originalOpenForm]);

  const handleDelete = React.useCallback(async (habit: HabitEntity) => {
    // Close all sliding items before showing delete alert
    const closePromises = Object.values(itemRefs.current)
      .map(ref => ref?.closeSliding());
    await Promise.all(closePromises);
    
    setHabitToDelete(habit);
  }, [setHabitToDelete]);

  const handleToggleCalendar = useCallback((habitId: string) => {
    setOpenCalendarId(current => {
      // If we're opening a new calendar, close any sliding items first
      if (current !== habitId) {
        Object.values(itemRefs.current).forEach(ref => ref?.closeSliding());
      }
      return current === habitId ? null : habitId;
    });
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <TopToolbar
          onExport={handleExport}
          hasHabits={habits.length > 0}
        />
      </IonHeader>
      
      <IonContent>
        {habits.length === 0 ? (
          <EmptyState />
        ) : (
          <HabitList
            habits={habits}
            onEdit={openForm}
            onDelete={handleDelete}
            openCalendarId={openCalendarId}
            onToggleCalendar={handleToggleCalendar}
            itemRefs={itemRefs}
          />
        )}

        <HabitForm
          isOpen={isFormOpen}
          title={editingHabit ? "Edit Habit" : "New Habit"}
          editedHabit={editingHabit}
          onClose={closeForm}
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
          <IonFabButton 
            onClick={() => openForm()}
            style={{
              '--background': 'var(--neutral-button)',
              '--background-hover': 'var(--neutral-button-hover)',
            }}
          >
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
};

export default Home;