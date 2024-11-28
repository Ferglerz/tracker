import React, { useEffect, useState } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonBackButton,
  IonButtons,
} from '@ionic/react';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  subMonths,
  addMonths,
  isSameMonth,
} from 'date-fns';
import { Habit, getHabitHistory, getStatusForDate } from './home.functions';

const HabitCalendar: React.FC = () => {
  const location = useLocation<{ habit: Habit }>();
  const history = useHistory();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [historyData, setHistoryData] = useState<{ [date: string]: number | boolean }>({});

  // If no habit in state, go back to home
  const habit = location.state?.habit;
  if (!habit) {
    history.replace('/home');
    return null;
  }

  useEffect(() => {
    const loadData = async () => {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      const history = await getHabitHistory(habit.id, start, end);
      setHistoryData(history);
    };
    loadData();
  }, [habit.id, currentDate]);

  const getDaysInMonth = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  };

  const getColorForStatus = (status: 'complete' | 'partial' | 'none') => {
    switch (status) {
      case 'complete':
        return 'bg-green-500';
      case 'partial':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-100';
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>{habit.name} History</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="px-4 py-2 bg-gray-200 rounded"
            >
              Previous
            </button>
            <h2 className="text-xl font-bold">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="px-4 py-2 bg-gray-200 rounded"
            >
              Next
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-bold">
                {day}
              </div>
            ))}
            {getDaysInMonth().map(date => {
              const dateKey = format(date, 'yyyy-MM-dd');
              const status = getStatusForDate(historyData[dateKey], habit);
              
              return (
                <div
                  key={dateKey}
                  className={`h-12 flex items-center justify-center rounded-lg
                    ${getColorForStatus(status)} 
                    ${!isSameMonth(date, currentDate) ? 'opacity-50' : ''}`}
                >
                  <span className="text-sm">
                    {format(date, 'd')}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex gap-4 justify-center">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
              <span>Complete</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
              <span>Partial</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-100 rounded mr-2"></div>
              <span>None</span>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default HabitCalendar;