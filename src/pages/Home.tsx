// Home.tsx
import React from 'react';
import { useHistory } from 'react-router-dom';
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
import { add, downloadOutline, refreshOutline } from 'ionicons/icons';
import { HabitEntity } from './HabitEntity';
import { HabitListItem, HabitListItemRef } from './HabitListItem';
import HabitForm from './HabitForm';
import { useHabits, useHabitForm, useHabitDelete, useHabitExport } from './HabitHooks';

const EmptyState: React.FC = () => (
  <div className="ion-padding ion-text-center" style={{ marginTop: '2rem' }}>
    Add a new habit to track with the + button, bottom right.
  </div>
);

const TopToolbar: React.FC<{
  onRefresh: () => Promise<void>;
  onExport: () => Promise<void>;
  isRefreshing: boolean;
  hasHabits: boolean;
}> = ({ onRefresh, onExport, isRefreshing, hasHabits }) => (
  <IonToolbar>
    <IonTitle className="ion-text-center">Habits</IonTitle>
    <IonButtons slot="end">
      <IonButton onClick={onRefresh} disabled={isRefreshing}>
        <IonIcon slot="icon-only" icon={refreshOutline} />
      </IonButton>
      {hasHabits && (
        <IonButton onClick={onExport}>
          <IonIcon slot="icon-only" icon={downloadOutline} />
        </IonButton>
      )}
    </IonButtons>
    {isRefreshing && <IonProgressBar type="indeterminate" />}
  </IonToolbar>
);

const HabitList: React.FC<{
  habits: HabitEntity[];
  onEdit: (habit: HabitEntity) => void;
  onDelete: (habit: HabitEntity) => void;
  onViewCalendar: (habit: HabitEntity) => void;
  itemRefs: React.MutableRefObject<Record<string, HabitListItemRef | null>>;
}> = ({ habits, onEdit, onDelete, onViewCalendar, itemRefs }) => (
  <IonList>
    {habits.map((habit) => (
      <HabitListItem
        key={habit.id}
        ref={(el) => itemRefs.current[habit.id] = el}
        habit={habit}
        onEdit={() => onEdit(habit)}
        onDelete={() => onDelete(habit)}
        onViewCalendar={() => onViewCalendar(habit)}
      />
    ))}
  </IonList>
);

const Home: React.FC = () => {
  const history = useHistory();
  const { habits, isRefreshing, refreshHabits } = useHabits();
  const { isFormOpen, editingHabit, openForm: originalOpenForm, closeForm: originalCloseForm } = useHabitForm();
  const { habitToDelete, setHabitToDelete, handleDeleteHabit } = useHabitDelete(refreshHabits);
  const { handleExport } = useHabitExport(habits);
  const itemRefs = React.useRef<Record<string, HabitListItemRef | null>>({});

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

  const handleViewCalendar = React.useCallback(async (habit: HabitEntity) => {
    // Close all sliding items before navigation
    const closePromises = Object.values(itemRefs.current)
      .map(ref => ref?.closeSliding());
    await Promise.all(closePromises);

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

  const handleDelete = React.useCallback(async (habit: HabitEntity) => {
    // Close all sliding items before showing delete alert
    const closePromises = Object.values(itemRefs.current)
      .map(ref => ref?.closeSliding());
    await Promise.all(closePromises);
    
    setHabitToDelete(habit);
  }, [setHabitToDelete]);

  return (
    <IonPage>
      <IonHeader>
        <TopToolbar
          onRefresh={refreshHabits}
          onExport={handleExport}
          isRefreshing={isRefreshing}
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
            onViewCalendar={handleViewCalendar}
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
          <IonFabButton onClick={() => openForm()}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
};

export default Home;