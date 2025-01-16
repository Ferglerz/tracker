import React, { useState, useEffect, useRef } from 'react';
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
import { arrowBack, lockClosed, apps, square, closeCircle } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { Squircle } from '@components/Squircle';
import { HabitEntity } from '@utils/HabitEntity';
import { useHabits } from '@utils/useHabits';
import { CONSTANTS } from '@utils/Constants';
import { WidgetSectionProps, WidgetSpaceProps } from '@utils/TypesAndProps';
import { HabitBadge } from '@components/HabitBadge';
import { WidgetSection } from '@components/WidgetSection';

const createEmptySpaces = (section: WidgetSectionProps): WidgetSpaceProps[] => {
    return Array.from({ length: section.spaces }, (_, index) => ({
        id: `${section.type}-${index + 1}`,
        type: section.type,
        order: index + 1,
        isOccupied: false,
    }));
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
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
            }}
        >
            {habits.map((habit) => (
                <IonItem
                    key={habit.id}
                    style={{
                        '--min-height': '42px', // Reduced height by 8 pixels
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

const WidgetConfig: React.FC = () => {
    const history = useHistory();
    const { habits, refreshHabits } = useHabits();
    const [widgetSpaces, setWidgetSpaces] = useState<WidgetSpaceProps[]>([]);

    useEffect(() => {
        const spaces = CONSTANTS.WIDGET_SECTIONS.flatMap(section => createEmptySpaces(section));

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
            {CONSTANTS.WIDGET_SECTIONS
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
                    </IonTabBar>
                </IonTabs>
            </IonContent>
        </IonPage>
    );
};

export default WidgetConfig;