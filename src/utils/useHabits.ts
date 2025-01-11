

import { useState, useEffect, useCallback, useRef } from 'react';
import { HabitEntity } from '@utils/HabitEntity';
import { Habit } from '@utils/TypesAndProps';

interface UseHabitsResult {
  habits: HabitEntity[];
  refreshHabits: () => Promise<void>;
}

export function useHabits(): UseHabitsResult {
  const [habits, setHabits] = useState<HabitEntity[]>([]);
  const initialLoadComplete = useRef(false);

  const refreshHabits = useCallback(async () => {
    await HabitEntity.loadAll();
  }, []);

  useEffect(() => {

    // Only perform initial load once
    if (!initialLoadComplete.current) {
      initialLoadComplete.current = true;
      HabitEntity.loadAll();
    }

    // Set up subscription
    
    const subscription = HabitEntity.getHabits$().subscribe(
      (newHabits: Habit.Habit[]) => {
        setHabits(newHabits.map(habit => new HabitEntity(habit)));
      }
    );


    //alert('Setting up subscription');


    // Cleanup subscription on unmount
    return () => {

      console.log('Cleaning up subscription');
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array since we don't want this to re-run

  return { habits, refreshHabits };
}