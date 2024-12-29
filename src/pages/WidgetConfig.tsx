// WidgetConfig.tsx
import React, { useState, useEffect } from 'react';
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonButtons,
    IonButton,
    IonIcon,
} from '@ionic/react';
import { arrowBack } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { HabitEntity } from './HabitEntity';

interface WidgetSpace {
    id: string;
    type: string;
    order: number;
    isOccupied: boolean;
    habitId?: string;
}

interface WidgetSection {
    title: string;
    spaces: number;
    type: string;
}

const WIDGET_SECTIONS: WidgetSection[] = [
    { title: 'Wide Widget 1', spaces: 6, type: 'wide1' },
    { title: 'Wide Widget 2', spaces: 6, type: 'wide2' },
    { title: 'Large Widget 1', spaces: 8, type: 'large1' },
    { title: 'Large Widget 2', spaces: 8, type: 'large2' },
    { title: 'Small Widget 1', spaces: 3, type: 'small1' },
    { title: 'Small Widget 2', spaces: 3, type: 'small2' },
    { title: 'Lock Screen Wide', spaces: 2, type: 'lockwide' },
    { title: 'Lock Screen Half', spaces: 1, type: 'lockhalf' },
    { title: 'Lock Screen Single', spaces: 1, type: 'locksingle' },
];

const createEmptySpaces = (section: WidgetSection): WidgetSpace[] => {
    return Array.from({ length: section.spaces }, (_, index) => ({
        id: `${section.type}-${index + 1}`,
        type: section.type,
        order: index + 1,
        isOccupied: false,
    }));
};

const HabitBadge: React.FC<{ habit: HabitEntity }> = ({ habit }) => {
    const getLighterColor = (color: string): string => {
        if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            const lighter = [r, g, b].map(c => Math.min(255, c + (255 - c) * 0.1));
            return `rgb(${lighter[0]}, ${lighter[1]}, ${lighter[2]})`;
        }
        return color;
    };

    return (
        <div
            draggable
            onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', habit.id);
            }}
            style={{
                padding: '8px',
                background: `linear-gradient(to bottom, ${getLighterColor(habit.bgColor)}, ${habit.bgColor})`,
                borderRadius: '16px',
                color: '#000000',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                minHeight: '60px',
                cursor: 'grab',
                userSelect: 'none',
                fontWeight: 'bold',
                fontSize: '1.2rem',
                WebkitMask: 'paint(squircle)',
                maskImage: 'paint(squircle)',
                clipPath: 'url(#squircle)',
            }}
        >
            {habit.name}
        </div>
    );
};

const DroppableSpace: React.FC<{
    spaceId: string;
    onDrop: (habitId: string, spaceId: string) => void;
}> = ({ spaceId, onDrop }) => (
    <div
        onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)';
        }}
        onDragLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
        }}
        onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.style.backgroundColor = 'transparent';
            const habitId = e.dataTransfer.getData('text/plain');
            onDrop(habitId, spaceId);
        }}
        style={{
            border: '2px dashed #666666',
            borderRadius: '16px',
            width: '100%',
            height: '100%',
            minHeight: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s ease',
            WebkitMask: 'paint(squircle)',
            maskImage: 'paint(squircle)',
            clipPath: 'url(#squircle)',
        }}
    />
);

const HabitsContainer: React.FC<{
    habits: HabitEntity[];
    onDrop: (habitId: string, spaceId: string) => void;
}> = ({ habits, onDrop }) => (
    <div
        style={{
            padding: '16px',
            marginBottom: '24px',
        }}
        onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)';
        }}
        onDragLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
        }}
        onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.style.backgroundColor = 'transparent';
            const habitId = e.dataTransfer.getData('text/plain');
            onDrop(habitId, 'habits-container');
        }}
    >
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
            }}
        >
            {habits.map((habit) => (
                <IonItem
                    key={habit.id}
                    style={{
                        '--min-height': 'auto',
                        '--padding-start': '0',
                        '--inner-padding-end': '0',
                        '--background': 'transparent',
                        '--background-hover': 'transparent',
                        '--border-width': '0',
                        overflow: 'hidden',
                    }}
                    lines="none"
                >
                    <HabitBadge habit={habit} />
                </IonItem>
            ))}
        </div>
    </div>
);

const WidgetSection: React.FC<{
    title: string;
    spaces: WidgetSpace[];
    habits: HabitEntity[];
    onDrop: (habitId: string, spaceId: string) => void;
}> = ({ title, spaces, habits, onDrop }) => (
    <div style={{ marginBottom: '24px' }}>
        <h2 style={{ padding: '0 16px', marginBottom: '12px' }}>{title}</h2>
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                padding: '0 16px',
            }}
        >
            {spaces.map((space) => (
                <IonItem
                    key={space.id}
                    style={{
                        '--min-height': 'auto',
                        '--padding-start': '0',
                        '--inner-padding-end': '0',
                        '--background': 'transparent',
                        '--background-hover': 'transparent',
                        '--border-width': '0',
                        overflow: 'hidden',
                    }}
                    lines="none"
                >
                    {space.isOccupied && space.habitId ? (
                        <HabitBadge
                            habit={habits.find((h) => h.id === space.habitId)!}
                        />
                    ) : (
                        <DroppableSpace spaceId={space.id} onDrop={onDrop} />
                    )}
                </IonItem>
            ))}
        </div>
    </div>
);

const WidgetConfig: React.FC = () => {
    const history = useHistory();
    const [habits, setHabits] = useState<HabitEntity[]>([]);
    const [widgetSpaces, setWidgetSpaces] = useState<WidgetSpace[]>([]);

    useEffect(() => {
        const loadHabits = async () => {
            const loadedHabits = await HabitEntity.loadAll();
            setHabits(loadedHabits);

            const spaces = WIDGET_SECTIONS.flatMap(section => createEmptySpaces(section));

            const updatedSpaces = spaces.map(space => {
                // Find habit that has this widget type and order assigned
                const occupyingHabit = loadedHabits.find(habit =>
                    habit.widget?.assignments?.some(
                        assignment => 
                            assignment.type === space.type && 
                            assignment.order === parseInt(space.id.split('-')[1], 10)
                    )
                );
            
                if (occupyingHabit) {
                    return {
                        ...space,
                        isOccupied: true,
                        habitId: occupyingHabit.id
                    };
                }
                return space;
            });

            setWidgetSpaces(updatedSpaces);
        };
        loadHabits();
    }, []);

    const handleDrop = async (habitId: string, spaceId: string) => {
        const habit = habits.find(h => h.id === habitId);
    if (!habit) return
    
        // If dropping in habits container, remove from only that specific widget
        if (spaceId.startsWith('habits-')) {
            // Find which widget space the habit was dragged from (if any)
            const sourceSpace = widgetSpaces.find(space => space.habitId === habitId);
            if (sourceSpace) {
                const updatedSpaces = widgetSpaces.map(space => {
                    if (space.id === sourceSpace.id) {
                        return {
                            ...space,
                            isOccupied: false,
                            habitId: undefined
                        };
                    }
                    return space;
                });
                setWidgetSpaces(updatedSpaces);
    
                // Remove only this specific assignment
                const currentAssignments = habit.widget?.assignments || [];
                const newAssignments = currentAssignments.filter(
                    assignment => !(assignment.type === sourceSpace.type && assignment.order === sourceSpace.order)
                );
                await habit.updateWidget({ assignments: newAssignments });
            }
            return;
        }
    
        const [type, orderStr] = spaceId.split('-');
    const order = parseInt(orderStr, 10);
    
        // Find any existing widget space that has this habit
        const existingWidgetSpaces = widgetSpaces.filter(space => space.habitId === habitId);
        
        // Determine if this is a widget-to-widget drag
        // It's a widget-to-widget drag if the habit exists in any widget space
        const isWidgetToWidgetDrag = existingWidgetSpaces.length > 0;
        
        // If it's a widget-to-widget drag, find the specific source space
        const sourceSpace = isWidgetToWidgetDrag ? 
            existingWidgetSpaces.find(space => space.type === type) : undefined;
    
        // Update spaces state
        const updatedSpaces = widgetSpaces.map(space => {
            // If this is the drop target space
            if (space.id === spaceId) {
                // If there was already a habit here, clear its assignment for this space
                if (space.habitId) {
                    const existingHabit = habits.find(h => h.id === space.habitId);
                    if (existingHabit && existingHabit.widget) {
                        const updatedAssignments = existingHabit.widget.assignments.filter(
                            assignment => !(assignment.type === type && assignment.order === order)
                        );
                        existingHabit.updateWidget({ assignments: updatedAssignments });
                    }
                }
                return {
                    ...space,
                    isOccupied: true,
                    habitId
                };
            }
    
            // If this is a widget-to-widget drag and this is the source space, clear it
            if (isWidgetToWidgetDrag && sourceSpace && space.id === sourceSpace.id) {
                return {
                    ...space,
                    isOccupied: false,
                    habitId: undefined
                };
            }
            return space;
        });
    
        setWidgetSpaces(updatedSpaces);

    // Get current assignments
    let currentAssignments = habit.widget?.assignments || [];

    if (isWidgetToWidgetDrag) {
        // If moving between widgets, update assignments

        // Remove any existing assignment for this habit with the same type
        currentAssignments = currentAssignments.filter(
            assignment => !(assignment.type === type)
        );

        // Add the new assignment
        currentAssignments.push({ type, order });
        await habit.updateWidget({ assignments: currentAssignments });

    } else {
        // If dragging from Habits, just add new assignment
        await habit.updateWidget({ 
            assignments: [...currentAssignments, { type, order }]
        });
    }
};
    
    useEffect(() => {
        const loadHabits = async () => {
            const loadedHabits = await HabitEntity.loadAll();
            setHabits(loadedHabits);
    
            const spaces = WIDGET_SECTIONS.flatMap(section => createEmptySpaces(section));
    
            const updatedSpaces = spaces.map(space => {
                const occupyingHabit = loadedHabits.find(habit =>
                    habit.widget?.assignments.some(
                        assignment => 
                            assignment.type === space.type && 
                            assignment.order === parseInt(space.id.split('-')[1], 10)
                    )
                );
    
                if (occupyingHabit) {
                    return {
                        ...space,
                        isOccupied: true,
                        habitId: occupyingHabit.id
                    };
                }
                return space;
            });
    
            setWidgetSpaces(updatedSpaces);
        };
        loadHabits();
    }, []);

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonButton onClick={() => history.push('/home')}>
                            <IonIcon slot="icon-only" icon={arrowBack} />
                        </IonButton>
                    </IonButtons>
                    <IonTitle className="ion-text-center">Widget Configuration</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <HabitsContainer habits={habits} onDrop={handleDrop} />
                {WIDGET_SECTIONS.map((section) => (
                    <WidgetSection
                        key={section.type}
                        title={section.title}
                        spaces={widgetSpaces.filter((space) => space.type === section.type)}
                        habits={habits}
                        onDrop={handleDrop}
                    />
                ))}
            </IonContent>
        </IonPage>
    );
};

export default WidgetConfig;