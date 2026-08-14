import { useState, useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { BehaviorSubject } from 'rxjs';
import { getTodayString } from './Utilities';

const currentDateSubject = new BehaviorSubject<string>(getTodayString());

let initialized = false;
const initDateListener = () => {
  if (initialized) return;
  initialized = true;

  CapacitorApp.addListener('appStateChange', ({ isActive }) => {
    if (isActive) {
      const today = getTodayString();
      if (today !== currentDateSubject.value) {
        currentDateSubject.next(today);
      }
    }
  });

  // Fallback check every minute to handle midnight rollover while app is active
  setInterval(() => {
    const today = getTodayString();
    if (today !== currentDateSubject.value) {
      currentDateSubject.next(today);
    }
  }, 60000);
};

// Start listening immediately
initDateListener();

export function useCurrentDate() {
  const [currentDate, setCurrentDate] = useState(currentDateSubject.value);

  useEffect(() => {
    const sub = currentDateSubject.subscribe(val => {
      setCurrentDate(val);
    });
    return () => sub.unsubscribe();
  }, []);

  return currentDate;
}
