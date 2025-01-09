// Home.tsx
import React, { useState, useCallback } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonAlert,
} from '@ionic/react';
import { HabitEntity } from '@utils/HabitEntity';
import HabitForm from '@components/HabitForm';
import HabitList from '@components/HabitList';
import { TopToolbar } from '@components/TopToolbar';
import { useHabits, useHabitForm, useHabitDelete, useHabitExport } from '@utils/Hooks';
import { Habit } from '@utils/TypesAndProps';

const EmptyState: React.FC = () => (
  <div className="ion-padding ion-text-center" style={{ marginTop: '2rem' }}>
    Add a new habit to track with the + button, top right.
  </div>
);

const Home: React.FC = () => {
  const { habits, refreshHabits } = useHabits();
  const [isMenuOpen, setIsMenuOpen] = useState(false); 
  const { editingHabit, setEditingHabit } = useHabitForm();
  const { habitToDelete, setHabitToDelete, handleDeleteHabit } = useHabitDelete(refreshHabits);
  const { handleExport } = useHabitExport(habits);
  const [openCalendarId, setOpenCalendarId] = useState<string | null>(null);

  const handleOpenHabitForm = useCallback((habit?: HabitEntity) => {
    setEditingHabit(habit);
    setIsMenuOpen(true);
  }, []); 

  const handleDelete = useCallback((habit: HabitEntity) => {
    setHabitToDelete(habit);
  }, [setHabitToDelete]);

  const handleToggleCalendar = useCallback((habitId: string) => {
    setOpenCalendarId(current => {
      if (current !== habitId) {
        // No need to close HabitForm here anymore
      }
      return current === habitId ? null : habitId;
    });
  }, []);

  const handleReorder = useCallback(async (event: CustomEvent) => {
    const { from, to } = event.detail;

    const reorderedHabits = [...habits];
    const [movedItem] = reorderedHabits.splice(from, 1);
    reorderedHabits.splice(to, 0, movedItem);

    const updatedHabits = reorderedHabits.map((habit, index) => 
      new HabitEntity({ ...habit as Habit.Habit, listOrder: index + 1 })
    );

    try {
      await HabitEntity.updateListOrder(updatedHabits);
      await refreshHabits();
      event.detail.complete();
    } catch (error) {
      alert('Failed to update habit order');
      event.detail.complete(false);
    }
  }, [habits, refreshHabits]);

  return (
    <IonPage>
      <IonHeader>
        <TopToolbar
          onExport={handleExport}
          hasHabits={habits.length > 0}
          onNewHabit={() => handleOpenHabitForm()}
        />
      </IonHeader>
      <IonContent>
        {habits.length === 0 ? (
          <EmptyState />
        ) : (
          <HabitList
            habits={habits.sort((a, b) => (a.listOrder || 0) - (b.listOrder || 0))}
            onEdit={handleOpenHabitForm}
            onDelete={handleDelete}
            openCalendarId={openCalendarId}
            onToggleCalendar={handleToggleCalendar}
            onReorder={handleReorder}
          />
        )}

        <HabitForm
          isOpen={isMenuOpen}
          title={editingHabit ? "Edit Habit" : "New Habit"}
          editedHabit={editingHabit}
          onClose={() => setIsMenuOpen(false)} 
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

      </IonContent>
    </IonPage>
  );
};

export default Home;