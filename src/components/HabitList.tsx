import React, { useCallback, useState, useEffect } from 'react';
import { IonReorderGroup } from '@ionic/react';
import { HabitEntity } from '@utils/HabitEntity';
import { HabitListItem } from '@components/HabitListItem';
import { useHabits } from '@utils/useHabits';

interface Props {
  onEdit: (habitId: string) => void;
  onDelete: (habitId: string) => void;
  openCalendarId: string | null;
  onToggleCalendar: (habitId: string) => void;
  onReorder?: (event: CustomEvent) => Promise<void>;
}

const HabitList: React.FC<Props> = ({
  onEdit,
  onDelete,
  openCalendarId,
  onToggleCalendar,
  onReorder
}) => {
  const { habits } = useHabits();

  const sortHabits = (habits: HabitEntity[]): HabitEntity[] =>
    habits.sort((a, b) => (a.listOrder || 0) - (b.listOrder || 0));

  return (
    <IonReorderGroup disabled={false} onIonItemReorder={onReorder}>
      {sortHabits(habits).map(habit => (
        <HabitListItem
          key={habit.id}
          habit={habit}
          onEdit={() => onEdit(habit.id)}
          onDelete={() => onDelete(habit.id)}
          isCalendarOpen={openCalendarId === habit.id}
          openCalendarId={openCalendarId}
          onToggleCalendar={onToggleCalendar}
        />
      ))}
    </IonReorderGroup>
  );
};

export default React.memo(HabitList);