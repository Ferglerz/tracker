//WidgetConfig.tsx
import React, { useState, useEffect } from 'react';
import {
    IonPage,
    IonTabs,
    IonTab,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonButtons,
    IonButton,
    IonIcon,
    IonTabBar,
    IonTabButton,
    IonLabel,
} from '@ionic/react';
import { arrowBack, lockClosed, apps, square } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { Squircle } from '@components/Squircle';
import { HabitEntity } from '@utils/HabitEntity';
import { useHabits } from '@utils/useHabits';
import * as icons from 'ionicons/icons';

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
            const lighter = [r, g, b].map(c => Math.min(255, c + (255 - c) * 0.3));
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
                fill={[getLighterColor(habit.bgColor), habit.bgColor]}
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
                color: 'var(--ion-text-color)',
                fontWeight: 'bold',
                fontSize: '1.2rem',
                padding: '8px',
            }}>
                {habit.icon && (
                    <IonIcon
                        size="large"
                        style={{
                            marginRight: '8px',
                        }}
                        icon={icons[habit.icon as keyof typeof icons]}
                    />
                )}
                            {habit.name.length > 10 ? (
                                <span style={{ fontSize: '0.9rem' }}>{habit.name}</span>
                            ) : (
                                habit.name
                            )}
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
                        overflow: 'visible',
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
        <h2 style={{ padding: '0 16px', textAlign: 'center', marginBottom: '12px' }}>{title}</h2>
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
                        overflow: 'visible',
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
    const { habits, refreshHabits } = useHabits();
    const [widgetSpaces, setWidgetSpaces] = useState<WidgetSpace[]>([]);

    useEffect(() => {
        const spaces = WIDGET_SECTIONS.flatMap(section => createEmptySpaces(section));

        const habitAssignments: { [key: string]: string } = {};
        habits.forEach(habit => {
            habit.widgetAssignment?.assignments?.forEach(assignment => {
                const spaceId = `${assignment.type}-${assignment.order}`;
                habitAssignments[spaceId] = habit.id;
            });
        });

        const updatedSpaces = spaces.map(space => {
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
    }, [habits]);

    const handleDrop = async (habitId: string, spaceId: string) => {
        const habit = habits.find(h => h.id === habitId);
        if (!habit) return;

        if (spaceId === 'habits-container') {
            const sourceSpace = widgetSpaces.find(space =>
                space.habitId === habitId && space.isOccupied
            );

            if (sourceSpace) {
                const newAssignments = (habit.widgetAssignment?.assignments || []).filter(a =>
                    !(a.type === sourceSpace.type && a.order === sourceSpace.order)
                );

                setWidgetSpaces(prevSpaces => prevSpaces.map(space =>
                    space.id === sourceSpace.id
                        ? { ...space, isOccupied: false, habitId: undefined }
                        : space
                ));

                await habit.updateWidgetAssignment({ assignments: newAssignments });
                await refreshHabits();
            }
            return;
        }

        const [targetType, targetOrderStr] = spaceId.split('-');
        const targetOrder = parseInt(targetOrderStr, 10);

        let newAssignments = [...(habit.widgetAssignment?.assignments || [])];

        const existingSpaceForType = widgetSpaces.find(space =>
            space.habitId === habitId &&
            space.type === targetType &&
            space.isOccupied
        );

        if (existingSpaceForType) {
            newAssignments = newAssignments.map(a =>
                a.type === targetType ? { ...a, order: targetOrder } : a
            );

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
            newAssignments.push({ type: targetType, order: targetOrder });

            setWidgetSpaces(prevSpaces => prevSpaces.map(space =>
                space.id === spaceId
                    ? { ...space, isOccupied: true, habitId }
                    : space
            ));
        }

        await habit.updateWidgetAssignment({ assignments: newAssignments });
        await refreshHabits();
    };

    const renderTabContent = (filterPrefix: string) => (
        <>
            <HabitsContainer habits={habits} onDrop={handleDrop} />
            {WIDGET_SECTIONS
                .filter(section => section.type.startsWith(filterPrefix))
                .map((section) => (
                    <WidgetSection
                        key={section.type}
                        title={section.title}
                        spaces={widgetSpaces.filter((space) => space.type === section.type)}
                        habits={habits}
                        onDrop={handleDrop}
                    />
                ))}
        </>
    );

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
                <IonTabs>
                    <IonTab tab="lock">
                        <div className="ion-padding">
                            {renderTabContent('lock')}
                        </div>
                    </IonTab>

                    <IonTab tab="small">
                        <div className="ion-padding">
                            {renderTabContent('small')}
                        </div>
                    </IonTab>

                    <IonTab tab="medium">
                        <div className="ion-padding">
                            {renderTabContent('medium')}
                        </div>
                    </IonTab>

                    <IonTab tab="large">
                        <div className="ion-padding">
                            {renderTabContent('large')}
                        </div>
                    </IonTab>

                    <IonTabBar slot="bottom">
                        <IonTabButton tab="lock">
                            <IonIcon icon={lockClosed} />
                            <IonLabel>Lock</IonLabel>
                        </IonTabButton>
                        <IonTabButton tab="small">
                            <IonIcon icon={apps} />
                            <IonLabel>Small</IonLabel>
                        </IonTabButton>
                        <IonTabButton tab="medium">
                            <IonIcon icon={square} />
                            <IonLabel>Medium</IonLabel>
                        </IonTabButton>
                        <IonTabButton tab="large">
                            <IonIcon icon={square} />
                            <IonLabel>Large</IonLabel>
                        </IonTabButton>
                    </IonTabBar>
                </IonTabs>
            </IonContent>
        </IonPage>
    );
};

export default WidgetConfig;