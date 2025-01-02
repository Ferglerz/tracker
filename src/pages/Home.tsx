// Home.tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonIcon,
  IonAlert,
  IonButtons,
  IonButton,
  IonProgressBar,
  IonReorderGroup,
} from '@ionic/react';
import { add, downloadOutline, gridOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
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
  onNewHabit: () => void;
}> = ({ onExport, hasHabits, onNewHabit }) => {
  const history = useHistory();

  return (
    <IonToolbar>
      <IonButtons slot="start">
        <IonButton
          onClick={() => history.push('/widget-config')}
          style={{
            '--color': 'var(--neutral-button)'
          }}
        >
          <IonIcon slot="icon-only" icon={gridOutline} />
        </IonButton>
      </IonButtons>
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
        <IonButton
          onClick={onNewHabit}
          style={{
            '--color': 'var(--neutral-button)'
          }}
        >
          <IonIcon slot="icon-only" icon={add} />
        </IonButton>
      </IonButtons>
    </IonToolbar>
  );
};

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
        openCalendarId={openCalendarId}
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
    const closePromises = Object.values(itemRefs.current)
      .map(ref => ref?.closeSliding());
    await Promise.all(closePromises);
    
    originalCloseForm();
  }, [originalCloseForm]);

  const openForm = React.useCallback(async (habit?: HabitEntity) => {
    const closePromises = Object.values(itemRefs.current)
      .map(ref => ref?.closeSliding());
    await Promise.all(closePromises);
    
    originalOpenForm(habit);
  }, [originalOpenForm]);

  const handleDelete = React.useCallback(async (habit: HabitEntity) => {
    const closePromises = Object.values(itemRefs.current)
      .map(ref => ref?.closeSliding());
    await Promise.all(closePromises);
    
    setHabitToDelete(habit);
  }, [setHabitToDelete]);

  const handleToggleCalendar = useCallback((habitId: string) => {
    setOpenCalendarId(current => {
      if (current !== habitId) {
        Object.values(itemRefs.current).forEach(ref => ref?.closeSliding());
      }
      return current === habitId ? null : habitId;
    });
  }, []);

  const handleReorder = useCallback(async (event: CustomEvent) => {
    event.detail.complete(false);
  
    const from = event.detail.from;
    const to = event.detail.to;
    
    const reorderedHabits = [...habits];
    const [movedItem] = reorderedHabits.splice(from, 1);
    reorderedHabits.splice(to, 0, movedItem);
  
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
          onNewHabit={() => openForm()}
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

        {isRefreshing && (
          <IonProgressBar type="indeterminate" />
        )}
      </IonContent>
    </IonPage>
  );
};

export default Home;