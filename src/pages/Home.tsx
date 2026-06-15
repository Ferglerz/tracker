// Home.tsx
import React, { useState, useCallback } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonAlert,
  useIonToast,
} from '@ionic/react';
import { HabitEntity } from '@utils/HabitEntity';
import HabitForm from '@components/HabitForm';
import HabitList from '@components/HabitList';
import { TopToolbar } from '@components/TopToolbar';
import { useHabits } from '@utils/useHabits';
import { HabitCSVService } from '@utils/ImportCSV';
import { Habit } from '@utils/TypesAndProps';

const EmptyState: React.FC = () => (
  <div className="ion-padding ion-text-center" style={{ marginTop: '2rem' }}>
    Add a new habit to track with the + button, top right.
  </div>
);

const Home: React.FC = () => {
  const { habits, refreshHabits } = useHabits();
  const [present] = useIonToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitEntity | undefined>();
  const [habitToDelete, setHabitToDelete] = useState<HabitEntity | null>(null);
  const [openCalendarId, setOpenCalendarId] = useState<string | null>(null);

  const handleHabitForm = useCallback((isOpen: boolean, habit?: HabitEntity) => {
    setIsMenuOpen(isOpen);
    setEditingHabit(isOpen ? habit : undefined);
  }, []);

  const handleDeleteHabit = useCallback(async () => {
    if (!habitToDelete) return;

    try {
      await HabitEntity.delete(habitToDelete.id);
      setHabitToDelete(null);
      present({
        message: 'Habit deleted successfully',
        duration: 2000,
        position: 'bottom',
      });
    } catch (error) {
      present({
        message: 'Failed to delete habit',
        duration: 2000,
        position: 'bottom',
        color: 'danger',
      });
    }
  }, [habitToDelete, present]);

  const handleExport = useCallback(async () => {
    try {
      await HabitCSVService.exportHabits(habits);
      present({
        message: 'Export completed successfully',
        duration: 2000,
        position: 'bottom',
      });
    } catch (error) {
      present({
        message: 'Failed to export habit data',
        duration: 2000,
        position: 'bottom',
        color: 'danger',
      });
    }
  }, [habits, present]);

  const handleToggleCalendar = useCallback((habitId: string) => {
    setOpenCalendarId(current => current === habitId ? null : habitId);
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
      event.detail.complete();
    } catch (error) {
      present({
        message: 'Failed to update habit order',
        duration: 2000,
        position: 'bottom',
        color: 'danger',
      });
      event.detail.complete(false);
    }
  }, [habits, present]);

  return (
    <IonPage>
      <IonHeader>
        <TopToolbar
          onExport={handleExport}
          hasHabits={habits.length > 0}
          onNewHabit={() => handleHabitForm(true)}
        />
      </IonHeader>
      <IonContent>
        {habits.length === 0 ? (
          <EmptyState />
        ) : (
          <HabitList
            habits={habits}
            onEdit={(habit) => handleHabitForm(true, habit)}
            onDelete={(habit) => setHabitToDelete(habit)}
            openCalendarId={openCalendarId}
            onToggleCalendar={handleToggleCalendar}
            onReorder={handleReorder}
          />
        )}

        <HabitForm
          isOpen={isMenuOpen}
          title={editingHabit ? "Edit Habit" : "New Habit"}
          editedHabit={editingHabit}
          onClose={() => handleHabitForm(false)}
          onSave={refreshHabits}
        />

        <IonAlert
          isOpen={!!habitToDelete}
          onDidDismiss={() => setHabitToDelete(null)}
          header="Delete Habit"
          message={`Are you sure you want to delete "${habitToDelete?.name}"? This action cannot be undone.`}
          buttons={[
            { text: 'Cancel', role: 'cancel', handler: () => setHabitToDelete(null) },
            { text: 'Delete', role: 'destructive', handler: handleDeleteHabit }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};
export default Home;