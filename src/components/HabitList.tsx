import React from 'react';
import { IonReorderGroup } from '@ionic/react';
import { HabitEntity } from '@utils/HabitEntity';
import HabitItem from '@components/HabitItem';

interface Props {
  habits: HabitEntity[];
  onEdit: (habit: HabitEntity) => void;
  onDelete: (habit: HabitEntity) => void;
  openCalendarId: string | null;
  onToggleCalendar: (habitId: string) => void;
  onReorder?: (event: CustomEvent) => Promise<void>;
}

const HabitList: React.FC<Props> = ({
  habits,
  onEdit,
  onDelete,
  openCalendarId,
  onToggleCalendar,
  onReorder
}) => {
  const sortedHabits = [...habits].sort((a, b) => (a.listOrder || 0) - (b.listOrder || 0));

  return (
    <IonReorderGroup disabled={false} onIonItemReorder={onReorder}>
      {sortedHabits.map(habit => (
        <HabitItem
          key={habit.id}
          habit={habit}
          onEdit={() => onEdit(habit)}
          onDelete={() => onDelete(habit)}
          isCalendarOpen={openCalendarId === habit.id}
          onToggleCalendar={onToggleCalendar}
        />
      ))}
    </IonReorderGroup>
  );
};

export default React.memo(HabitList);