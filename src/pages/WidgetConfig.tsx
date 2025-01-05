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
import { Squircle } from './Squircle';

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
    { title: 'Lock Screen 1', spaces: 1, type: 'lock1' },
    { title: 'Lock Screen 2', spaces: 1, type: 'lock2' },
    { title: 'Small Widget 1', spaces: 3, type: 'small1' },
    { title: 'Small Widget 2', spaces: 3, type: 'small2' },
    { title: 'Medium Widget 1', spaces: 6, type: 'medium1' },
    { title: 'Medium Widget 2', spaces: 6, type: 'medium2' },
    { title: 'Large Widget 1', spaces: 8, type: 'large1' },
    { title: 'Large Widget 2', spaces: 8, type: 'large2' },
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
                position: 'relative',
                width: '100%',
                height: '100%',
                minHeight: '60px',
                cursor: 'grab',
                userSelect: 'none',
            }}
        >
            <Squircle
                width="100%"
                height="100%"
                cornerRadius={16}
                fill={habit.bgColor}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                }}
            />
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000000',
                fontWeight: 'bold',
                fontSize: '1.2rem',
                padding: '8px',
            }}>
                {habit.name}
            </div>
        </div>
    );
};

const DroppableSpace: React.FC<{
    spaceId: string;
    onDrop: (habitId: string, spaceId: string) => void;
}> = ({ spaceId, onDrop }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            onDragOver={(e) => {
                e.preventDefault();
                setIsHovered(true);
            }}
            onDragLeave={(e) => {
                setIsHovered(false);
            }}
            onDrop={(e) => {
                e.preventDefault();
                setIsHovered(false);
                const habitId = e.dataTransfer.getData('text/plain');
                onDrop(habitId, spaceId);
            }}
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                minHeight: '60px',
            }}
        >
            <Squircle
                width="100%"
                height="100%"
                cornerRadius={16}
                dashed={true}
                strokeWidth={2}
                stroke={isHovered ? '#444444' : '#666666'}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    transition: 'stroke 0.2s ease',
                }}
            />
            <div style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '60px',
            }} />
        </div>
    );
};

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
                        '--min-height': '60px',
                        '--padding-start': '0',
                        '--inner-padding-end': '0',
                        '--background': 'transparent',
                        '--background-hover': 'transparent',
                        '--border-width': '0',
                        overflow: 'visible', // Changed from hidden to visible
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
                        '--min-height': '60px',
                        '--padding-start': '0',
                        '--inner-padding-end': '0',
                        '--background': 'transparent',
                        '--background-hover': 'transparent',
                        '--border-width': '0',
                        overflow: 'visible', // Changed from hidden to visible
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

            // Create a map of habit assignments for faster lookup
            const habitAssignments: { [key: string]: string } = {};
            loadedHabits.forEach(habit => {
                habit.widgets?.assignments?.forEach(assignment => {
                    const spaceId = `${assignment.type}-${assignment.order}`;
                    habitAssignments[spaceId] = habit.id;
                });
            });

            const updatedSpaces = spaces.map(space => {
                // Check if there's an assignment for this space
                if (habitAssignments[space.id]) {
                    return {
                        ...space,
                        isOccupied: true,
                        habitId: habitAssignments[space.id]
                    };
                }
                return space;
            });

            setWidgetSpaces(updatedSpaces);
        };
        loadHabits();
    }, []);


    const handleDrop = async (habitId: string, spaceId: string) => {
        // console.log('handleDrop called with habitId:', habitId, 'spaceId:', spaceId);
    
        const habit = habits.find(h => h.id === habitId);
        if (!habit) return;
        // console.log('Current habit assignments:', JSON.stringify(habit.widgets?.assignments));
    
        // If dropping on habits container
        if (spaceId === 'habits-container') {
            // Find which space the habit was dragged from
            const sourceSpace = widgetSpaces.find(space =>
                space.habitId === habitId && space.isOccupied
            );
            
            if (sourceSpace) {
                // Only remove the specific widget assignment
                const newAssignments = (habit.widgets?.assignments || []).filter(a =>
                    !(a.type === sourceSpace.type && a.order === sourceSpace.order)
                );
                
                // Update UI
                setWidgetSpaces(prevSpaces => prevSpaces.map(space =>
                    space.id === sourceSpace.id 
                        ? { ...space, isOccupied: false, habitId: undefined }
                        : space
                ));
                
                // Save changes
                await habit.updateWidget({ assignments: newAssignments });
            }
            return;
        }
    
        // Get target widget details
        const [targetType, targetOrderStr] = spaceId.split('-');
        const targetOrder = parseInt(targetOrderStr, 10);
    
        // Create a copy of current assignments
        let newAssignments = [...(habit.widgets?.assignments || [])];
    
        // Check if this habit is already in any space for this widget type
        const existingSpaceForType = widgetSpaces.find(space => 
            space.habitId === habitId && 
            space.type === targetType &&
            space.isOccupied
        );
    
        if (existingSpaceForType) {
            // Update existing assignment for this widget type
            newAssignments = newAssignments.map(a =>
                a.type === targetType ? { ...a, order: targetOrder } : a
            );
    
            // Update UI spaces
            setWidgetSpaces(prevSpaces => prevSpaces.map(space => {
                if (space.id === spaceId) {
                    return { ...space, isOccupied: true, habitId };
                }
                if (space.id === existingSpaceForType.id) {
                    return { ...space, isOccupied: false, habitId: undefined };
                }
                return space;
            }));
        } else {
            // Add new assignment without affecting others
            newAssignments.push({ type: targetType, order: targetOrder });
    
            // Update UI for target space only
            setWidgetSpaces(prevSpaces => prevSpaces.map(space =>
                space.id === spaceId 
                    ? { ...space, isOccupied: true, habitId }
                    : space
            ));
        }
    
        // console.log('New assignments:', JSON.stringify(newAssignments));
        await habit.updateWidget({ assignments: newAssignments });
    };


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
                <HabitsContainer habits={habits} onDrop={(habitId, spaceId) => handleDrop(habitId, spaceId)} />

                {WIDGET_SECTIONS.map((section) => (
                    <WidgetSection
                        key={section.type}
                        title={section.title}
                        spaces={widgetSpaces.filter((space) => space.type === section.type)}
                        habits={habits}
                        onDrop={(habitId, spaceId) => handleDrop(habitId, spaceId)}
                    />
                ))}
            </IonContent>
        </IonPage>
    );
};

export default WidgetConfig;