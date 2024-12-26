// HabitCalendar.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonDatetime,
    IonCard,
    IonCardContent,
} from '@ionic/react';
import { useLocation, useParams } from 'react-router-dom';
import { HabitEntity } from './HabitEntity';
import { Habit } from './Types';
import { errorHandler } from './ErrorUtilities';
import DateEditModal from './DateEditModal';
import { HabitStorage } from './Storage';
import { getDateKey } from './Utilities';

interface RouteParams {
    id: string;
}

const HabitDetails: React.FC = () => {
    const location = useLocation<Habit.Habit>();
    const { id } = useParams<RouteParams>();
    const [habit, setHabit] = useState<HabitEntity | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString());
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingDate, setEditingDate] = useState<string>('');

    // Helper function to handle date click for both checkbox and quantity habits
    const handleDateClick = useCallback(async (isoString: string) => {
        if (!habit) return;
        const dateKey = getDateKey(isoString);
        if (!dateKey) return;

        try {
            if (habit.type === 'checkbox') {
                const currentValue = habit.getValueForDate(new Date(dateKey)) as boolean;
                await habit.setChecked(!currentValue, new Date(dateKey));
            } else {
                setEditingDate(dateKey);
                setShowEditModal(true);
            }
        } catch (error) {
            errorHandler.handleError(error, 'Failed to update habit');
        }
    }, [habit]);

    // Helper function to handle saving the date value for quantity habits
    const handleSaveDate = useCallback(async (value: any) => {
        if (!habit || !editingDate) return;

        try {
            await habit.setValue(value, new Date(editingDate));
        } catch (error) {
            errorHandler.handleError(error, 'Failed to save habit value');
        }
    }, [habit, editingDate]);

    // Helper function to determine highlighted dates for the calendar
    const getHighlightedDates = useCallback((isoString: string) => {
        if (!habit) return undefined;
        const dateKey = getDateKey(isoString);
        if (!dateKey) return undefined;

        try {
            const value = habit.history[dateKey];
            if (!value) return undefined;

            let isComplete = false;
            if (habit.type === 'checkbox') {
                isComplete = value === true;
            } else if (Array.isArray(value)) {
                const [quantity, goal] = value;
                isComplete = goal > 0 ? quantity >= goal : quantity > 0;
            }

            return {
                textColor: '#ffffff',
                backgroundColor: isComplete ? '#2dd36f' : '#ffc409'
            };
        } catch (error) {
            console.error('Error in getHighlightedDates:', error);
            return undefined;
        }
    }, [habit]);

    // Load initial habit and subscribe to storage changes
    useEffect(() => {
        const loadHabit = async () => {
            try {
                const habits = await HabitEntity.loadAll();
                const existingHabit = habits.find(h => h.id === id);
                if (!existingHabit) {
                    throw new Error('Habit not found');
                }
                setHabit(existingHabit);
            } catch (error) {
                errorHandler.handleError(error, 'Failed to load habit');
            }
        };

        loadHabit();

        const storage = HabitStorage.getInstance();
        const subscription = storage.changes.subscribe((data) => {
            const updatedHabit = data.habits.find(h => h.id === id);
            if (updatedHabit) {
                setHabit(new HabitEntity(updatedHabit));
            }
        });

        return () => subscription.unsubscribe();
    }, [id]);

    if (!habit) {
        return (
            <IonPage>
                <IonHeader>
                    <IonToolbar>
                        <IonButtons slot="start">
                            <IonBackButton defaultHref="/home" />
                        </IonButtons>
                        <IonTitle>Error</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent>
                    <div className="ion-padding">Habit not found</div>
                </IonContent>
            </IonPage>
        );
    }

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/home" />
                    </IonButtons>
                    <IonTitle>{habit.name}</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <div className="ion-padding">
                    <IonCard>
                        <IonCardContent>
                            <IonDatetime
                                presentation="date"
                                preferWheel={false}
                                value={selectedDate}
                                onIonChange={e => {
                                    if (e.detail.value) {
                                        const dateValue = Array.isArray(e.detail.value)
                                            ? e.detail.value[0]
                                            : e.detail.value;
                                        setSelectedDate(dateValue);
                                        handleDateClick(dateValue);
                                    }
                                }}
                                highlightedDates={getHighlightedDates}
                                className="calendar-custom"
                            />
                        </IonCardContent>
                    </IonCard>

                    {habit.type === 'quantity' && (
                        <DateEditModal
                            isOpen={showEditModal}
                            onClose={() => setShowEditModal(false)}
                            onSave={handleSaveDate}
                            habit={habit}
                            date={editingDate}
                        />
                    )}
                </div>
            </IonContent>
        </IonPage>
    );
};

export default React.memo(HabitDetails);