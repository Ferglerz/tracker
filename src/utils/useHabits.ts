// useHabits.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { HabitEntity } from '@utils/HabitEntity';
import { Habit } from '@utils/TypesAndProps';
import { handleSettings } from '@utils/Storage';

interface UseHabitsResult {
  habits: HabitEntity[];
  settings: Record<string, any>;
  refreshHabits: () => Promise<void>;
}

export function useHabits(): UseHabitsResult {
  const [habits, setHabits] = useState<HabitEntity[]>([]);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const initialLoadComplete = useRef(false);
  const subscriptionRef = useRef<any>(null);


  const refreshHabits = useCallback(async () => {
    try {
      await HabitEntity.loadAll();
    } catch (error) {
      console.error('Failed to refresh habits:', error);
    }
  }, []);

  useEffect(() => {
    if (!subscriptionRef.current) {
      subscriptionRef.current = HabitEntity.getHabits$().subscribe(
        (newHabits: Habit.Habit[]) => {
          const newEntities = newHabits.map(habit => new HabitEntity(habit));
          setHabits(newEntities);
        }
      );
    }

    if (!initialLoadComplete.current) {
      initialLoadComplete.current = true;
      refreshHabits();
    }

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [refreshHabits]);

  return { habits, settings, refreshHabits };
}