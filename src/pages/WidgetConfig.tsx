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
        if (!habit) return;
    
        const sourceSpace = widgetSpaces.find(space => 
            space.habitId === habitId && 
            space.isOccupied
        );
        
        console.log('Drop details:', {
            source: sourceSpace,
            currentWidgetSpaces: widgetSpaces.filter(s => s.habitId === habitId),
            currentAssignments: habit.widget?.assignments
        });
    
        if (spaceId.startsWith('habits-')) {
            if (sourceSpace) {
                setWidgetSpaces(widgetSpaces.map(space => 
                    space.id === sourceSpace.id ? 
                        { ...space, isOccupied: false, habitId: undefined } : 
                        space
                ));
    
                const currentAssignments = habit.widget?.assignments || [];
                const [sourceType, sourceOrderStr] = sourceSpace.id.split('-');
                const sourceOrder = parseInt(sourceOrderStr, 10);
                
                const newAssignments = currentAssignments.filter(assignment => {
                    console.log('Comparing:', { 
                        assignment, 
                        sourceType, 
                        sourceOrder,
                        matches: !(assignment.type === sourceType && assignment.order === sourceOrder)
                    });
                    return !(assignment.type === sourceType && assignment.order === sourceOrder);
                });
                
                await habit.updateWidget({ assignments: newAssignments });
            }
            return;
        }
    
        const [targetType, targetOrderStr] = spaceId.split('-');
        const targetOrder = parseInt(targetOrderStr, 10);
    
        const [sourceType, sourceOrderStr] = sourceSpace ? sourceSpace.id.split('-') : [null, null];
        const sourceOrder = sourceOrderStr ? parseInt(sourceOrderStr, 10) : null;
    
        const updatedSpaces = widgetSpaces.map(space => {
            if (space.id === spaceId) {
                if (space.habitId && space.habitId !== habitId) {
                    const existingHabit = habits.find(h => h.id === space.habitId);
                    if (existingHabit?.widget) {
                        const updatedAssignments = existingHabit.widget.assignments.filter(
                            assignment => !(assignment.type === targetType && assignment.order === targetOrder)
                        );
                        existingHabit.updateWidget({ assignments: updatedAssignments });
                    }
                }
                return { ...space, isOccupied: true, habitId };
            }
    
            if (sourceSpace && space.id === sourceSpace.id) {
                return { ...space, isOccupied: false, habitId: undefined };
            }
            return space;
        });
    
        setWidgetSpaces(updatedSpaces);
    
        const currentAssignments = habit.widget?.assignments || [];
        const newAssignments = sourceSpace ? 
            currentAssignments.filter(assignment => {
                console.log('Widget move comparison:', {
                    assignment,
                    sourceType,
                    sourceOrder,
                    matches: !(assignment.type === sourceType && assignment.order === sourceOrder)
                });
                return !(assignment.type === sourceType && assignment.order === sourceOrder);
            }) : 
            currentAssignments;
    
        await habit.updateWidget({
            assignments: [...newAssignments, { type: targetType, order: targetOrder }]
        });
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