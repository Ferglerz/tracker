// Home.tsx
import React, { useState, useCallback, useEffect } from 'react';
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
import { useHabits } from '@utils/useHabits';
import { HabitCSVService } from '@utils/ImportCSV';
import { Habit } from '@utils/TypesAndProps';
import { handleSettings } from '@utils/Storage';

const EmptyState: React.FC = () => (
  <div className="ion-padding ion-text-center" style={{ marginTop: '2rem' }}>
    Add a new habit to track with the + button, top right.
  </div>
);

const Home: React.FC = () => {
  const { habits, refreshHabits } = useHabits();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitEntity | undefined>();
  const [habitToDelete, setHabitToDelete] = useState<HabitEntity | null>(null);
  const [openCalendarId, setOpenCalendarId] = useState<string | null>(null);
  const [initialHistoryGridSetting, setInitialHistoryGridSetting] = useState<boolean>(true); // Default to true

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await handleSettings('load');
        setInitialHistoryGridSetting(settings.historyGrid ?? true); // Update initial setting
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    loadSettings();
  }, []);

  const handleHabitForm = useCallback((isOpen: boolean, habit?: HabitEntity) => {
    setIsMenuOpen(isOpen);
    setEditingHabit(isOpen ? habit : undefined);
  }, []);

  const handleDeleteHabit = useCallback(async () => {
    if (!habitToDelete) return;

    try {
      await HabitEntity.delete(habitToDelete.id);
      await refreshHabits();
      setHabitToDelete(null);
    } catch (error) {
      alert('Failed to delete habit');
    }
  }, [habitToDelete, refreshHabits]);

  const handleExport = useCallback(async () => {
    try {
      await HabitCSVService.exportHabits(habits);
      alert('Export completed successfully');
    } catch (error) {
      alert('Failed to export habit data');
    }
  }, [habits]);

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
          onNewHabit={() => handleHabitForm(true)}
          initialHistoryGridSetting={initialHistoryGridSetting} // Pass initial setting

        />
      </IonHeader>
      <IonContent>
        {habits.length === 0 ? (
          <EmptyState />
        ) : (
          <HabitList
            onEdit={(habitId) => {
              const habit = habits.find(h => h.id === habitId);
              if (habit) handleHabitForm(true, habit);
            }}
            onDelete={(habitId) => {
              const habit = habits.find(h => h.id === habitId);
              if (habit) setHabitToDelete(habit);
            }}
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