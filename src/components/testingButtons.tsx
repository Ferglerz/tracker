// utils/HabitUtils.js 
import { HabitStorageWrapper } from '@utils/Storage';

export const getFirstQuantity = async () => {
  try {
    const data = await HabitStorageWrapper.handleHabitData('load');
    if (data.habits.length > 0) {
      const firstHabit = data.habits[0];
      alert(firstHabit.quantity);
    }
  } catch (error) {
    console.error('Error fetching first quantity:', error);
  }
  return 0;
};

export const simulateExternalChange = async () => {
  try {
    // Load current data
    const data = await HabitStorageWrapper.handleHabitData('load');

    if (data.habits.length > 0) {
      // Get the first habit
      const firstHabit = data.habits[0];
      const today = new Date().toISOString().split('T')[0];

      // Modify the habit's quantity for today
      if (!firstHabit.history[today]) {
        firstHabit.history[today] = { quantity: 0, goal: firstHabit.goal || 0 };
      }
      firstHabit.history[today].quantity = 0;
      firstHabit.quantity = 0;

      // Save the modified data back to storage
      await HabitStorageWrapper.handleHabitData('save', data, firstHabit.id);

      console.log('Simulated external change: Set first habit quantity to 0');
    }
  } catch (error) {
    console.error('Failed to simulate external change:', error);
  }
};