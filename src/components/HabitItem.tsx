//HabitItem.tsx
import React, { useCallback, useRef, useState, useMemo, useEffect } from 'react';
import {
  IonItem,
  IonIcon,
  IonRippleEffect,
  IonBadge,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonReorder,
} from '@ionic/react';
import { calendar, pencil, trash, reorderThree } from 'ionicons/icons';
import { HabitEntity } from '@utils/HabitEntity';
import Calendar from '@components/Calendar';
import { getHistoryRange, calculateStreaks, getPeriodProgress } from '@utils/Utilities';
import { HistoryGrid } from '@components/HistoryGrid';
import { InteractionControls } from '@components/InteractionControls';
import { CONSTANTS } from '@utils/Constants';
import { getIcon } from '@utils/iconUtils';
import { useSettings } from '@utils/useSettings';
import { useCurrentDate } from '@utils/useCurrentDate';

interface HabitItemProps {
  habit: HabitEntity;
  onEdit: () => void;
  onDelete: () => void;
  isCalendarOpen: boolean;
  onToggleCalendar: (habitId: string) => void;
  dragHandleProps?: any;
}

const HabitDetails: React.FC<{
  habit: HabitEntity;
  quantity: number;
  goal: number;
  currentStreak: number;
  longestStreak: number;
  periodQuantity: number;
  periodGoal: number;
}> = ({ habit, quantity, goal, currentStreak, longestStreak, periodQuantity, periodGoal }) => {
  const isDaily = !habit.frequency || habit.frequency === 'daily';

  return (
  <div className="ion-no-padding ion-no-margin habit-details">
    {habit.icon && (
      <IonIcon
        size="large"
        icon={getIcon(habit.icon)}
        style={{
          fontSize: '24px',
          marginRight: '12px',
          color: habit.bgColor,
        }}
      />
    )}
    <div className="habit-name-quantity">
      <div className="habit-name">{habit.name}</div>
      {habit.type === 'quantity' && (
        <div className="habit-quantity">
          {isDaily ? (
            `${quantity} ${goal ? `/ ${goal} ` : ''} ${habit.unit || ''}`
          ) : (
            `${periodQuantity} ${periodGoal ? `/ ${periodGoal} ` : ''} ${habit.unit || ''} this ${habit.frequency}`
          )}
        </div>
      )}
      <div className="habit-streak" style={{ fontSize: '12px', color: 'var(--ion-color-medium)', marginTop: '2px' }}>
        🔥 {currentStreak} {currentStreak === 1 ? 'day' : 'days'} • Best: {longestStreak}
      </div>
    </div>
  </div>
  );
};

const HabitItem: React.FC<HabitItemProps> = ({
  habit,
  onEdit,
  onDelete,
  isCalendarOpen,
  onToggleCalendar,
}) => {
  const slidingRef = useRef<HTMLIonItemSlidingElement>(null);
  const longPressActive = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const globalToday = useCurrentDate();
  const [selectedDate, setSelectedDate] = useState(globalToday);
  const { settings } = useSettings();

  const previousGlobalToday = useRef(globalToday);
  useEffect(() => {
    if (previousGlobalToday.current !== globalToday) {
      if (selectedDate === previousGlobalToday.current) {
        setSelectedDate(globalToday);
      }
      previousGlobalToday.current = globalToday;
    }
  }, [globalToday, selectedDate]);
  const hideGrid = !settings.historyGrid;

  const currentEntry = useMemo(() =>
    habit.history[selectedDate] || HabitEntity.emptyHistoryEntry(habit.goal),
    [habit, selectedDate]
  );

  const historyRangeData = useMemo(() =>
    getHistoryRange(habit, CONSTANTS.UI.CELLS_PER_ROW * 3),
    [habit]
  );

  const { currentStreak, longestStreak } = useMemo(() =>
    calculateStreaks(habit),
  [habit]);

  const periodProgress = useMemo(() =>
    getPeriodProgress(habit, selectedDate),
  [habit, selectedDate]);

  const handleValueChange = useCallback(
    async (value: number, date: string) => {
      const historyQuantity = habit.history[date]?.quantity || 0;
      await habit.increment(value - historyQuantity, date);
    },
    [habit]
  );

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (habit?.type === 'checkbox') {
      handleValueChange(currentEntry.quantity > 0 ? 0 : 1, selectedDate);
    }
  }, [habit, currentEntry.quantity, handleValueChange, selectedDate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (
      e.target === e.currentTarget &&
      habit.type === 'checkbox' &&
      (e.key === 'Enter' || e.key === ' ')
    ) {
      e.preventDefault();
      void handleValueChange(currentEntry.quantity > 0 ? 0 : 1, selectedDate);
    }
  }, [habit.type, currentEntry.quantity, handleValueChange, selectedDate]);

  const handleLongPress = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest(
      'ion-reorder, ion-button, ion-checkbox, ion-item-option, button, a, input, select, textarea, [role="button"]',
    )) return;

    longPressActive.current = true;
    timer.current = setTimeout(() => {
      if (longPressActive.current) {
        slidingRef.current?.open('end');
      }
    }, CONSTANTS.UI.LONG_PRESS_DELAY);
  }, []);

  const cancelLongPress = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    longPressActive.current = false;
  }, []);

  const handleReorderStart = useCallback(() => {
    if (isCalendarOpen && habit) {
      onToggleCalendar(habit.id);
    }
  }, [isCalendarOpen, habit, onToggleCalendar]);

  const handleEdit = useCallback(() => {
    slidingRef.current?.close();
    onEdit();
  }, [onEdit]);

  const handleToggleCalendar = useCallback(() => {
    if (!habit) return;

    slidingRef.current?.close();

    onToggleCalendar(habit.id);
    if (isCalendarOpen) {
      setSelectedDate(globalToday);
    }
  }, [habit, onToggleCalendar, isCalendarOpen, globalToday]);

  const handleDateSelected = useCallback((date: string) => {
    if (!habit) return;
    setSelectedDate(date);
  }, [habit]);

  if (!habit) {
    return null;
  }

  return (
    <>
      <IonItemSliding ref={slidingRef} key={habit.id}>
        <IonItem
          className="habit-item ion-activatable"
          role={habit.type === 'checkbox' ? 'button' : undefined}
          tabIndex={habit.type === 'checkbox' ? 0 : undefined}
          aria-label={habit.type === 'checkbox' ? `Toggle ${habit.name}` : undefined}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onTouchStart={handleLongPress}
          onTouchEnd={cancelLongPress}
          onMouseDown={handleLongPress}
          onMouseUp={cancelLongPress}
          onMouseLeave={cancelLongPress}
        >
          <div
            className="habit-color-bar"
            style={{ backgroundColor: habit.bgColor }}
          />
          <div className="habit-container ion-align-items-center ion-no-margin">
            <IonReorder className="habit-reorder"
              onMouseDown={handleReorderStart}
              onTouchStart={handleReorderStart}>
              <IonIcon icon={reorderThree} className="margin-auto" />
            </IonReorder>

            <div className="habit-content ion-no-padding">
              <div className="habit-header">
                <HabitDetails
                  habit={habit}
                  quantity={currentEntry.quantity}
                  goal={currentEntry.goal}
                  currentStreak={currentStreak}
                  longestStreak={longestStreak}
                  periodQuantity={periodProgress.quantity}
                  periodGoal={periodProgress.goal}
                />
                <InteractionControls
                  habit={habit}
                  selectedDate={selectedDate}
                  handleValueChange={handleValueChange}
                />
              </div>

              <HistoryGrid
                color={habit.bgColor}
                type={habit.type}
                baseSize={24}
                gap={5}
                cellsPerRow={CONSTANTS.UI.CELLS_PER_ROW}
                data={historyRangeData}
                hideGrid={hideGrid}
              />

              {habit.type === 'quantity' &&
                periodProgress.goal > 0 &&
                periodProgress.quantity >= periodProgress.goal && (
                  <IonBadge
                    className={`ion-margin-start ion-margin-top ${periodProgress.quantity >= periodProgress.goal * 4 ? 'shake-takeoff' : ''}`}
                    color={habit.bgColor}
                    style={{
                      animation:  periodProgress.quantity >= periodProgress.goal * 4 ? 'shake-takeoff 1s cubic-bezier(0.36, 0, 0.66, -0.56) 1' :
                                  periodProgress.quantity >= periodProgress.goal * 3 ? 'triple-fire 1s cubic-bezier(0.36, 0, 0.66, -0.56) 1' :
                                  periodProgress.quantity >= periodProgress.goal * 2 ? 'double-hop 0.5s cubic-bezier(0.36, 0, 0.66, -0.56) 1' : 'none'
                    }}
                  >
                    {periodProgress.quantity >= periodProgress.goal * 4 ? 'UNSTOPPABLE 🚀' :
                     periodProgress.quantity >= periodProgress.goal * 3 ? 'Triple! 🔥' :
                     periodProgress.quantity >= periodProgress.goal * 2 ? 'Double! ⚡' :
                     'Complete!'}
                  </IonBadge>
                )}
            </div>
          </div>

          <IonRippleEffect />
        </IonItem>

        <IonItemOptions side="end">
          {!isCalendarOpen && (
            <IonItemOption
              color="primary"
              onClick={handleToggleCalendar}
              aria-label={`Open calendar for ${habit.name}`}
            >
              <IonIcon slot="icon-only" icon={calendar} />
            </IonItemOption>
          )}
          <IonItemOption color="warning" onClick={handleEdit} aria-label={`Edit ${habit.name}`}>
            <IonIcon slot="icon-only" icon={pencil} />
          </IonItemOption>
          <IonItemOption color="danger" onClick={onDelete} aria-label={`Delete ${habit.name}`}>
            <IonIcon slot="icon-only" icon={trash} />
          </IonItemOption>
        </IonItemOptions>
      </IonItemSliding>

      {isCalendarOpen && (
        <Calendar
          habit={habit}
          onClose={handleToggleCalendar}
          onValueChange={handleValueChange}
          onDateSelected={handleDateSelected}
        />
      )}
    </>
  );
};

HabitItem.displayName = 'HabitItem';

export default HabitItem;