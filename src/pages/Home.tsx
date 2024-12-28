// Home.tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonFab,
  IonFabButton,
  IonIcon,
  IonAlert,
  IonButtons,
  IonButton,
  IonProgressBar,
  IonReorderGroup,
} from '@ionic/react';
import { add, downloadOutline } from 'ionicons/icons';
import { HabitEntity } from './HabitEntity';
import { HabitListItem, HabitListItemRef } from './HabitListItem';
import HabitForm from './HabitForm';
import { useHabits, useHabitForm, useHabitDelete, useHabitExport } from './Hooks';
import { errorHandler } from './ErrorUtilities';

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
  onReorder: (event: CustomEvent) => void;
  isReorderMode: boolean;
}> = ({ habits, onEdit, onDelete, openCalendarId, onToggleCalendar, itemRefs, onReorder, isReorderMode }) => (
  <IonReorderGroup disabled={false} onIonItemReorder={onReorder}>
    {habits.map((habit) => (
      <HabitListItem
      key={habit.id}
      ref={(el) => itemRefs.current[habit.id] = el}
      habit={habit}
      onEdit={() => onEdit(habit)}
      onDelete={() => onDelete(habit)}
      isCalendarOpen={openCalendarId === habit.id}
      openCalendarId={openCalendarId}  // Add this
      onToggleCalendar={onToggleCalendar}
      isReorderMode={isReorderMode}
    />
    ))}
  </IonReorderGroup>
);

const Home: React.FC = () => {
  const { habits, isRefreshing, refreshHabits } = useHabits();
  const { isFormOpen, editingHabit, openForm: originalOpenForm, closeForm: originalCloseForm } = useHabitForm();
  const { habitToDelete, setHabitToDelete, handleDeleteHabit } = useHabitDelete(refreshHabits);
  const { handleExport } = useHabitExport(habits);
  const itemRefs = React.useRef<Record<string, HabitListItemRef | null>>({});
  const [openCalendarId, setOpenCalendarId] = useState<string | null>(null);
  const [isReorderMode, setIsReorderMode] = useState(false);

  useEffect(() => {
    const handleReorderStart = () => setIsReorderMode(true);
    const handleReorderEnd = () => setIsReorderMode(false);

    document.addEventListener('ionItemReorderStart', handleReorderStart);
    document.addEventListener('ionItemReorderEnd', handleReorderEnd);

    return () => {
      document.removeEventListener('ionItemReorderStart', handleReorderStart);
      document.removeEventListener('ionItemReorderEnd', handleReorderEnd);
    };
  }, []);

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
      // If clicking the same habit's calendar button, close it
      if (current === habitId) {
        return null;
      }
      // Otherwise, open the new calendar
      return habitId;
    });
  }, []);

  const handleReorder = useCallback(async (event: CustomEvent) => {
    // Prevent default to allow manual list update
    event.detail.complete(false);
  
    const from = event.detail.from;
    const to = event.detail.to;
    
    // Create new array with updated order
    const reorderedHabits = [...habits];
    const [movedItem] = reorderedHabits.splice(from, 1);
    reorderedHabits.splice(to, 0, movedItem);
  
    // Update listOrder for all habits
    const updatedHabits = reorderedHabits.map((habit, index) => {
      const entity = new HabitEntity({
        id: habit.id,
        name: habit.name,
        type: habit.type,
        unit: habit.unit,
        goal: habit.goal,
        bgColor: habit.bgColor,
        quantity: habit.quantity,
        isChecked: habit.isChecked,
        isComplete: habit.isComplete,
        history: habit.history,
        listOrder: index + 1
      });
      return entity;
    });
  
    // Save new order
    try {
      await HabitEntity.updateListOrder(updatedHabits);
      await refreshHabits();
    } catch (error) {
      errorHandler.handleError(error, 'Failed to update habit order');
    }
  }, [habits, refreshHabits]);

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
            habits={habits.sort((a, b) => (a.listOrder || 0) - (b.listOrder || 0))}
            onEdit={openForm}
            onDelete={handleDelete}
            openCalendarId={openCalendarId}
            onToggleCalendar={handleToggleCalendar}
            itemRefs={itemRefs}
            onReorder={handleReorder}
            isReorderMode={isReorderMode}
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

        {isRefreshing && (
          <IonProgressBar type="indeterminate" />
        )}
      </IonContent>
    </IonPage>
  );
};

export default Home;