import React from 'react';
import { IonReorderGroup } from '@ionic/react';
import { HabitEntity } from './HabitEntity';
import { HabitListItem } from './HabitListItem';

export const HabitList: React.FC<{
  habits: HabitEntity[];
  onEdit: (habit: HabitEntity) => void;
  onDelete: (habit: HabitEntity) => void;
  openCalendarId: string | null;
  onToggleCalendar: (habitId: string) => void;
  onReorder: (event: CustomEvent) => void;
}> = ({ habits, onEdit, onDelete, openCalendarId, onToggleCalendar, onReorder }) => (
  <IonReorderGroup disabled={false} onIonItemReorder={onReorder}>
    {habits.map(habit => (
      <HabitListItem
        key={habit.id}
        habit={habit}
        onEdit={() => onEdit(habit)}
        onDelete={() => onDelete(habit)}
        isCalendarOpen={openCalendarId === habit.id}
        openCalendarId={openCalendarId}
        onToggleCalendar={onToggleCalendar}
      />
    ))}
  </IonReorderGroup>
);

export default HabitList;