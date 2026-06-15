import { useState, useEffect, useCallback, useRef } from 'react';
import { HabitEntity } from '@utils/HabitEntity';
import { Habit } from '@utils/TypesAndProps';
import { isNewDay } from '@utils/Utilities';
import type { Subscription } from 'rxjs';

interface UseHabitsResult {
  habits: HabitEntity[];
  refreshHabits: () => Promise<void>;
}

export function useHabits(): UseHabitsResult {
  const [habits, setHabits] = useState<HabitEntity[]>([]);
  const initialLoadComplete = useRef(false);
  const subscriptionRef = useRef<Subscription | null>(null);
  const lastCheckRef = useRef(new Date());

  const refreshHabits = useCallback(async () => {
    try {
      await HabitEntity.loadAll();
      lastCheckRef.current = new Date();
    } catch (error) {
      console.error('Failed to refresh habits:', error);
    }
  }, []);

  // Add midnight check interval
  useEffect(() => {
    const checkNewDay = () => {
      const now = new Date();
      if (isNewDay(lastCheckRef.current, now)) {
        refreshHabits();
      }
    };

    // Check every minute
    const interval = setInterval(checkNewDay, 60000);

    return () => clearInterval(interval);
  }, [refreshHabits]);

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

  return { habits, refreshHabits };
}