//WidgetConfig.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    TouchSensor,
    useDraggable,
    useDroppable,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
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
    IonLabel,
    IonSegment,
    IonSegmentButton,
} from '@ionic/react';
import { arrowBack, lockClosed, apps, square } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { Squircle } from '@components/Squircle';
import { HabitEntity } from '@utils/HabitEntity';
import { useHabits } from '@utils/useHabits';
import * as icons from 'ionicons/icons';
import { CONSTANTS } from '@utils/Constants';
import { adjustColor } from '@utils/Utilities';
import type { Habit } from '@utils/TypesAndProps';

const HABITS_POOL_ID = 'habits-pool';

const WIDGET_ITEM_STYLE: Record<string, string> = {
    '--min-height': '60px',
    '--padding-start': '0',
    '--inner-padding-end': '0',
    '--background': 'transparent',
    '--background-hover': 'transparent',
    '--border-width': '0',
    overflow: 'visible',
};

interface WidgetSpace {
    id: string;
    type: string;
    order: number;
    isOccupied: boolean;
    habitId?: string;
}

interface WidgetSectionDef {
    title: string;
    spaces: number;
    type: string;
}

const createEmptySpaces = (section: WidgetSectionDef): WidgetSpace[] =>
    Array.from({ length: section.spaces }, (_, index) => ({
        id: `${section.type}-${index + 1}`,
        type: section.type,
        order: index + 1,
        isOccupied: false,
    }));

function parseSlotId(spaceId: string): { type: string; order: number } | null {
    const i = spaceId.lastIndexOf('-');
    if (i <= 0) return null;
    const type = spaceId.slice(0, i);
    const order = parseInt(spaceId.slice(i + 1), 10);
    if (!type || Number.isNaN(order)) return null;
    return { type, order };
}

function removeAssignmentSlot(
    assignments: Habit.WidgetsAssignment[],
    type: string,
    order: number,
): Habit.WidgetsAssignment[] {
    return assignments.filter((a) => !(a.type === type && a.order === order));
}

function habitWidgetsOrEmpty(h: HabitEntity): Habit.Widgets {
    return h.widgetAssignment ?? { assignments: [] };
}

interface DropComputeResult {
    nextSpaces: WidgetSpace[];
    batch: { habitId: string; widgets: Habit.Widgets }[];
}

function computeDrop(
    prevSpaces: WidgetSpace[],
    habitById: Map<string, HabitEntity>,
    habitId: string,
    targetId: string,
): DropComputeResult {
    const habit = habitById.get(habitId);
    if (!habit) return { nextSpaces: prevSpaces, batch: [] };

    if (targetId === HABITS_POOL_ID) {
        const sourceSpace = prevSpaces.find((s) => s.habitId === habitId && s.isOccupied);
        if (!sourceSpace) return { nextSpaces: prevSpaces, batch: [] };

        const newAssignments = removeAssignmentSlot(
            habitWidgetsOrEmpty(habit).assignments,
            sourceSpace.type,
            sourceSpace.order,
        );
        const nextSpaces = prevSpaces.map((s) =>
            s.id === sourceSpace.id ? { ...s, isOccupied: false, habitId: undefined } : s,
        );
        return {
            nextSpaces,
            batch: [{ habitId, widgets: { assignments: newAssignments } }],
        };
    }

    const slot = parseSlotId(targetId);
    if (!slot) return { nextSpaces: prevSpaces, batch: [] };

    const targetSpace = prevSpaces.find((s) => s.id === targetId);
    if (!targetSpace) return { nextSpaces: prevSpaces, batch: [] };

    const displacedId = targetSpace.isOccupied ? targetSpace.habitId : undefined;
    if (displacedId === habitId) return { nextSpaces: prevSpaces, batch: [] };

    const sourceSpace = prevSpaces.find((s) => s.habitId === habitId && s.isOccupied);

    let nextSpaces = prevSpaces.map((s) => ({ ...s }));
    const batch: { habitId: string; widgets: Habit.Widgets }[] = [];

    const existingForType = prevSpaces.find(
        (s) => s.habitId === habitId && s.isOccupied && s.type === slot.type,
    );

    if (displacedId) {
        const displaced = habitById.get(displacedId);
        if (!displaced) return { nextSpaces: prevSpaces, batch: [] };

        let draggedAssignments = habitWidgetsOrEmpty(habit).assignments.filter(
            (a) => a.type !== slot.type,
        );
        if (sourceSpace) {
            draggedAssignments = removeAssignmentSlot(
                draggedAssignments,
                sourceSpace.type,
                sourceSpace.order,
            );
        }
        draggedAssignments.push({ type: slot.type, order: slot.order });

        let displacedAssignments = removeAssignmentSlot(
            habitWidgetsOrEmpty(displaced).assignments,
            slot.type,
            slot.order,
        );
        if (sourceSpace) {
            displacedAssignments = displacedAssignments.filter(
                (a) => !(a.type === sourceSpace.type && a.order === sourceSpace.order),
            );
            displacedAssignments.push({
                type: sourceSpace.type,
                order: sourceSpace.order,
            });
        }

        for (let i = 0; i < nextSpaces.length; i++) {
            if (nextSpaces[i].id === targetId) {
                nextSpaces[i] = { ...nextSpaces[i], isOccupied: true, habitId };
            } else if (sourceSpace && nextSpaces[i].id === sourceSpace.id) {
                nextSpaces[i] = {
                    ...nextSpaces[i],
                    isOccupied: true,
                    habitId: displacedId,
                };
            } else if (
                existingForType &&
                existingForType.id !== targetId &&
                existingForType.id !== sourceSpace?.id &&
                nextSpaces[i].id === existingForType.id
            ) {
                nextSpaces[i] = { ...nextSpaces[i], isOccupied: false, habitId: undefined };
            }
        }

        batch.push({ habitId, widgets: { assignments: draggedAssignments } });
        batch.push({ habitId: displacedId, widgets: { assignments: displacedAssignments } });
        return { nextSpaces, batch };
    }

    let draggedAssignments = [...habitWidgetsOrEmpty(habit).assignments];

    if (existingForType) {
        draggedAssignments = draggedAssignments.map((a) =>
            a.type === slot.type ? { ...a, order: slot.order } : a,
        );
        for (let i = 0; i < nextSpaces.length; i++) {
            if (nextSpaces[i].id === targetId) {
                nextSpaces[i] = { ...nextSpaces[i], isOccupied: true, habitId };
            } else if (nextSpaces[i].id === existingForType.id) {
                nextSpaces[i] = { ...nextSpaces[i], isOccupied: false, habitId: undefined };
            }
        }
        batch.push({ habitId, widgets: { assignments: draggedAssignments } });
        return { nextSpaces, batch };
    }

    draggedAssignments = removeAssignmentSlot(draggedAssignments, slot.type, slot.order);
    if (sourceSpace) {
        draggedAssignments = removeAssignmentSlot(
            draggedAssignments,
            sourceSpace.type,
            sourceSpace.order,
        );
    }
    draggedAssignments.push({ type: slot.type, order: slot.order });

    for (let i = 0; i < nextSpaces.length; i++) {
        if (nextSpaces[i].id === targetId) {
            nextSpaces[i] = { ...nextSpaces[i], isOccupied: true, habitId };
        } else if (sourceSpace && nextSpaces[i].id === sourceSpace.id) {
            nextSpaces[i] = { ...nextSpaces[i], isOccupied: false, habitId: undefined };
        }
    }

    batch.push({ habitId, widgets: { assignments: draggedAssignments } });
    return { nextSpaces, batch };
}

const HabitBadgeVisual: React.FC<{ habit: HabitEntity; dragging?: boolean }> = ({
    habit,
    dragging,
}) => (
    <div
        style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            minHeight: '60px',
            userSelect: 'none',
            touchAction: 'none',
            opacity: dragging ? 0.35 : 1,
        }}
    >
        <Squircle
            width="100%"
            height="100%"
            cornerRadius={16}
            fill={[adjustColor(habit.bgColor, { lighter: true }), habit.bgColor]}
            style={{ position: 'absolute', top: 0, left: 0 }}
        />
        <div
            style={{
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
            }}
        >
            {habit.icon && (
                <IonIcon
                    size="large"
                    style={{ marginRight: '8px' }}
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

const DraggableHabitBadge: React.FC<{ habit: HabitEntity }> = ({ habit }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: habit.id,
        data: { habitId: habit.id },
    });

    return (
        <div ref={setNodeRef} {...listeners} {...attributes} style={{ width: '100%', height: '100%' }}>
            <HabitBadgeVisual habit={habit} dragging={isDragging} />
        </div>
    );
};

/** Occupied grid cell: same element is droppable (slot id) and draggable (habit id). */
const OccupiedWidgetSlot: React.FC<{ spaceId: string; habit: HabitEntity }> = ({ spaceId, habit }) => {
    const {
        attributes,
        listeners,
        setNodeRef: setDragRef,
        isDragging,
    } = useDraggable({
        id: habit.id,
        data: { habitId: habit.id },
    });
    const { setNodeRef: setDropRef, isOver } = useDroppable({ id: spaceId });

    const setRefs = (el: HTMLDivElement | null) => {
        setDragRef(el);
        setDropRef(el);
    };

    return (
        <div ref={setRefs} {...listeners} {...attributes} style={{ width: '100%', height: '100%' }}>
            <div
                style={{
                    position: 'relative',
                    minHeight: '60px',
                    borderRadius: 16,
                    outline: isOver ? '2px solid var(--ion-color-primary)' : 'none',
                    outlineOffset: 2,
                }}
            >
                <HabitBadgeVisual habit={habit} dragging={isDragging} />
            </div>
        </div>
    );
};

const DroppableSlot: React.FC<{
    id: string;
    isHighlighted: boolean;
}> = ({ id, isHighlighted }) => {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
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
                stroke={isOver || isHighlighted ? '#444444' : '#666666'}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    transition: 'stroke 0.2s ease',
                }}
            />
            <div
                style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    minHeight: '60px',
                }}
            />
        </div>
    );
};

const HabitsPool: React.FC<{
    habits: HabitEntity[];
    activeDragId: string | null;
}> = ({ habits, activeDragId }) => {
    const { setNodeRef, isOver } = useDroppable({ id: HABITS_POOL_ID });

    return (
        <div
            ref={setNodeRef}
            style={{
                padding: '16px',
                marginBottom: '24px',
                borderRadius: 12,
                backgroundColor: isOver ? 'rgba(0,0,0,0.08)' : 'transparent',
                transition: 'background-color 0.2s ease',
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
                    <IonItem key={habit.id} style={WIDGET_ITEM_STYLE} lines="none">
                        {activeDragId === habit.id ? (
                            <HabitBadgeVisual habit={habit} dragging />
                        ) : (
                            <DraggableHabitBadge habit={habit} />
                        )}
                    </IonItem>
                ))}
            </div>
        </div>
    );
};

const WidgetSection: React.FC<{
    title: string;
    spaces: WidgetSpace[];
    habitById: Map<string, HabitEntity>;
    activeDragId: string | null;
}> = ({ title, spaces, habitById, activeDragId }) => (
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
                <IonItem key={space.id} style={WIDGET_ITEM_STYLE} lines="none">
                    {space.isOccupied && space.habitId ? (
                        (() => {
                            const h = habitById.get(space.habitId);
                            if (!h) {
                                return <DroppableSlot id={space.id} isHighlighted={false} />;
                            }
                            return activeDragId === h.id ? (
                                <DroppableSlot id={space.id} isHighlighted />
                            ) : (
                                <OccupiedWidgetSlot spaceId={space.id} habit={h} />
                            );
                        })()
                    ) : (
                        <DroppableSlot id={space.id} isHighlighted={false} />
                    )}
                </IonItem>
            ))}
        </div>
    </div>
);

type TabKey = 'lock' | 'small' | 'medium';

const WidgetConfig: React.FC = () => {
    const history = useHistory();
    const { habits } = useHabits();
    const [widgetSpaces, setWidgetSpaces] = useState<WidgetSpace[]>([]);
    const [activeTab, setActiveTab] = useState<TabKey>('lock');
    const [activeDragId, setActiveDragId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 6 },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: CONSTANTS.UI.LONG_PRESS_DELAY,
                tolerance: 6,
            },
        }),
    );

    const habitById = useMemo(() => {
        const m = new Map<string, HabitEntity>();
        habits.forEach((h) => m.set(h.id, h));
        return m;
    }, [habits]);

    const assignedIds = useMemo(() => {
        const s = new Set<string>();
        widgetSpaces.forEach((sp) => {
            if (sp.isOccupied && sp.habitId) s.add(sp.habitId);
        });
        return s;
    }, [widgetSpaces]);

    const poolHabits = useMemo(
        () => habits.filter((h) => !assignedIds.has(h.id)),
        [habits, assignedIds],
    );

    useEffect(() => {
        const spaces = CONSTANTS.WIDGET_SECTIONS.flatMap((section) => createEmptySpaces(section));

        const habitAssignments: { [key: string]: string } = {};
        habits.forEach((habit) => {
            habit.widgetAssignment?.assignments?.forEach((assignment) => {
                const spaceId = `${assignment.type}-${assignment.order}`;
                habitAssignments[spaceId] = habit.id;
            });
        });

        const updatedSpaces = spaces.map((space) => {
            if (habitAssignments[space.id]) {
                return {
                    ...space,
                    isOccupied: true,
                    habitId: habitAssignments[space.id],
                };
            }
            return space;
        });

        setWidgetSpaces(updatedSpaces);
    }, [habits]);

    const handleDragEnd = useCallback(
        async (event: DragEndEvent) => {
            const { active, over } = event;
            setActiveDragId(null);
            const habitId = String(active.id);
            if (!over) return;
            const targetId = String(over.id);
            const { nextSpaces, batch } = computeDrop(widgetSpaces, habitById, habitId, targetId);
            if (batch.length === 0) return;
            setWidgetSpaces(nextSpaces);
            await HabitEntity.applyWidgetAssignmentBatch(batch);
        },
        [widgetSpaces, habitById],
    );

    const activeHabit = activeDragId ? habitById.get(activeDragId) : undefined;

    const tabContent = (
        <>
            <p
                style={{
                    padding: '0 16px 8px',
                    margin: 0,
                    fontSize: '0.85rem',
                    color: 'var(--ion-color-medium)',
                    textAlign: 'center',
                }}
            >
                Long-press a habit, then drag to a slot. On desktop, click and drag.
            </p>
            <HabitsPool habits={poolHabits} activeDragId={activeDragId} />
            {CONSTANTS.WIDGET_SECTIONS.filter((section) => section.type.startsWith(activeTab)).map(
                (section) => (
                    <WidgetSection
                        key={section.type}
                        title={section.title}
                        spaces={widgetSpaces.filter((space) => space.type === section.type)}
                        habitById={habitById}
                        activeDragId={activeDragId}
                    />
                ),
            )}
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
                <DndContext
                    sensors={sensors}
                    onDragStart={({ active }) => setActiveDragId(String(active.id))}
                    onDragCancel={() => setActiveDragId(null)}
                    onDragEnd={handleDragEnd}
                >
                    <div className="ion-padding">
                        <IonSegment
                            value={activeTab}
                            onIonChange={(e) => {
                                const v = e.detail.value as TabKey;
                                if (v === 'lock' || v === 'small' || v === 'medium') setActiveTab(v);
                            }}
                        >
                            <IonSegmentButton value="lock">
                                <IonIcon icon={lockClosed} />
                                <IonLabel>Lock</IonLabel>
                            </IonSegmentButton>
                            <IonSegmentButton value="small">
                                <IonIcon icon={apps} />
                                <IonLabel>Small</IonLabel>
                            </IonSegmentButton>
                            <IonSegmentButton value="medium">
                                <IonIcon icon={square} />
                                <IonLabel>Medium</IonLabel>
                            </IonSegmentButton>
                        </IonSegment>
                        {tabContent}
                    </div>
                    <DragOverlay dropAnimation={null}>
                        {activeHabit ? (
                            <div style={{ width: 120, minHeight: 60 }}>
                                <HabitBadgeVisual habit={activeHabit} />
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </IonContent>
        </IonPage>
    );
};

export default WidgetConfig;
