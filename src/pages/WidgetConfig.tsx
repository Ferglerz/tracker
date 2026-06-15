//WidgetConfig.tsx
import React, { useCallback, useMemo, useState } from 'react';
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
    IonBackButton,
    IonIcon,
    IonLabel,
    IonSegment,
    IonSegmentButton,
    IonButton,
} from '@ionic/react';
import { lockClosed, apps, square } from 'ionicons/icons';
import { Squircle } from '@components/Squircle';
import { HabitEntity } from '@utils/HabitEntity';
import { useHabits } from '@utils/useHabits';
import { CONSTANTS } from '@utils/Constants';
import { adjustColor } from '@utils/Utilities';
import type { Habit } from '@utils/TypesAndProps';
import { getIcon } from '@utils/iconUtils';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const HABITS_POOL_ID = 'habits-pool';

const getWidgetItemStyle = (isLock: boolean): React.CSSProperties => ({
    '--min-height': isLock ? '32px' : '60px',
    '--padding-start': '0',
    '--inner-padding-end': '0',
    '--background': 'transparent',
    '--background-hover': 'transparent',
    '--border-width': '0',
    margin: 0,
    width: '100%',
    height: '100%',
    overflow: 'visible',
} as any);

const WIDGET_ITEM_STYLE: Record<string, string> = {
    '--min-height': '60px',
    '--padding-start': '0',
    '--inner-padding-end': '0',
    '--background': 'transparent',
    '--background-hover': 'transparent',
    '--border-width': '0',
    overflow: 'visible',
};

const badgeContainerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    userSelect: 'none',
    touchAction: 'none',
};

const badgeContentStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    padding: '6px',
    textAlign: 'center',
    boxSizing: 'border-box',
};

const poolContainerStyle: React.CSSProperties = {
    padding: '12px 16px',
    borderRadius: '18px',
    marginBottom: '16px',
    border: '1px solid var(--ion-card-border, rgba(255,255,255,0.06))',
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
};

const poolScrollStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    overflowX: 'auto',
    padding: '8px 4px',
    WebkitOverflowScrolling: 'touch',
};

const poolItemStyle: React.CSSProperties = {
    flex: '0 0 110px',
    height: '60px',
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

function getContrastColor(hexColor: string): string {
    if (!hexColor || !hexColor.startsWith('#')) return '#ffffff';
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 180 ? '#121212' : '#ffffff';
}

const HabitBadgeVisual: React.FC<{ habit: HabitEntity; dragging?: boolean; variant?: 'lock' | 'home' }> = ({
    habit,
    dragging,
    variant = 'home',
}) => {
    const isLock = variant === 'lock';
    const contrastColor = getContrastColor(habit.bgColor);

    return (
        <div
            style={{
                ...badgeContainerStyle,
                opacity: dragging ? 0.35 : 1,
                height: isLock ? '32px' : '60px',
            }}
        >
            {isLock ? (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.15)',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '4px 8px',
                        boxSizing: 'border-box',
                        color: '#ffffff',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden', width: '70%' }}>
                        {habit.icon && (
                            <IonIcon
                                style={{ fontSize: '0.85rem', color: '#ffffff', flexShrink: 0 }}
                                icon={getIcon(habit.icon)}
                            />
                        )}
                        <span style={{ fontSize: '0.65rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {habit.name}
                        </span>
                    </div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 'bold', opacity: 0.9 }}>
                        {habit.type === 'quantity' ? habit.quantity : (habit.quantity > 0 ? '✓' : '○')}
                    </span>
                </div>
            ) : (
                <>
                    <Squircle
                        width="100%"
                        height="100%"
                        cornerRadius={16}
                        fill={[adjustColor(habit.bgColor, { lighter: true }), habit.bgColor]}
                        style={{ position: 'absolute', top: 0, left: 0 }}
                    />
                    <div style={{ ...badgeContentStyle, color: contrastColor }}>
                        {habit.icon && (
                            <IonIcon
                                size="large"
                                style={{ marginRight: '6px', color: contrastColor }}
                                icon={getIcon(habit.icon)}
                            />
                        )}
                        {habit.name.length > 10 ? (
                            <span style={{ fontSize: '0.75rem', lineHeight: 1.1 }}>{habit.name}</span>
                        ) : (
                            <span>{habit.name}</span>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

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

const OccupiedWidgetSlot: React.FC<{ spaceId: string; habit: HabitEntity; isLock?: boolean }> = ({ spaceId, habit, isLock }) => {
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

    const height = isLock ? '32px' : '60px';

    return (
        <div ref={setRefs} {...listeners} {...attributes} style={{ width: '100%', height: height }}>
            <div
                style={{
                    position: 'relative',
                    minHeight: height,
                    height: height,
                    borderRadius: isLock ? 8 : 16,
                    outline: isOver ? '2px solid var(--ion-color-primary, #3880f4)' : 'none',
                    outlineOffset: 2,
                }}
            >
                <HabitBadgeVisual habit={habit} dragging={isDragging} variant={isLock ? 'lock' : 'home'} />
            </div>
        </div>
    );
};

const DroppableSlot: React.FC<{
    id: string;
    isHighlighted: boolean;
    isLock?: boolean;
}> = ({ id, isHighlighted, isLock }) => {
    const { setNodeRef, isOver } = useDroppable({ id });
    const height = isLock ? '32px' : '60px';

    return (
        <div
            ref={setNodeRef}
            style={{
                position: 'relative',
                width: '100%',
                height: height,
                minHeight: height,
            }}
        >
            <Squircle
                width="100%"
                height="100%"
                cornerRadius={isLock ? 8 : 16}
                dashed={true}
                strokeWidth={isLock ? 1.5 : 2}
                stroke={isOver || isHighlighted 
                    ? (isLock ? '#ffffff' : 'var(--ion-color-primary, #3880f4)') 
                    : (isLock ? 'rgba(255,255,255,0.25)' : 'var(--ion-color-step-300, #cccccc)')}
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
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isLock ? 'rgba(255,255,255,0.4)' : 'var(--ion-color-medium, #888888)',
                    fontSize: isLock ? '0.75rem' : '0.7rem',
                    fontWeight: isLock ? 'normal' : 500,
                }}
            >
                {isLock ? '+' : 'Empty Slot'}
            </div>
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
                ...poolContainerStyle,
                backgroundColor: isOver ? 'rgba(var(--ion-color-primary-rgb, 56, 128, 244), 0.12)' : 'var(--ion-card-background, rgba(0,0,0,0.03))',
                borderColor: isOver ? 'var(--ion-color-primary, #3880f4)' : 'var(--ion-card-border, rgba(255,255,255,0.06))',
                transition: 'all 0.2s ease',
            }}
        >
            <h3 style={{ margin: '0 0 10px 4px', fontSize: '0.85rem', fontWeight: 700, opacity: 0.8 }}>
                Available Habits {habits.length > 0 && `(${habits.length})`}
            </h3>
            {habits.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--ion-color-medium)', fontSize: '0.85rem' }}>
                    All habits are assigned to widgets.
                </div>
            ) : (
                <div style={poolScrollStyle}>
                    {habits.map((habit) => (
                        <div key={habit.id} style={poolItemStyle}>
                            <IonItem style={WIDGET_ITEM_STYLE} lines="none">
                                {activeDragId === habit.id ? (
                                    <HabitBadgeVisual habit={habit} dragging />
                                ) : (
                                    <DraggableHabitBadge habit={habit} />
                                )}
                            </IonItem>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Simulated iPhone screen styles
const mockPhoneFrameStyle: React.CSSProperties = {
    border: '12px solid #1c1c1e',
    borderRadius: '42px',
    background: '#000000',
    width: '290px',
    height: '520px',
    margin: '12px auto 20px',
    position: 'relative',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.35), inset 0 0 4px rgba(255,255,255,0.15)',
    boxSizing: 'border-box',
    overflow: 'hidden',
};

const mockScreenStyle = (activeTab: TabKey): React.CSSProperties => {
    const isLock = activeTab === 'lock';
    return {
        width: '100%',
        height: '100%',
        borderRadius: '30px',
        background: isLock
            ? 'linear-gradient(135deg, #1f2041 0%, #4b3f72 50%, #119da4 100%)'
            : 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        padding: '0px 12px 12px',
        userSelect: 'none',
    };
};

const statusBarStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px 2px',
    color: '#ffffff',
    width: '100%',
    boxSizing: 'border-box',
    zIndex: 10,
};

const homeIndicatorStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '6px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100px',
    height: '4px',
    borderRadius: '2px',
    background: 'rgba(255, 255, 255, 0.4)',
    pointerEvents: 'none',
    zIndex: 10,
};

// Lock Screen specific styles
const lockScreenContentStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
    paddingTop: '20px',
    color: '#ffffff',
    position: 'relative',
};

const lockScreenDateStyle: React.CSSProperties = {
    fontSize: '0.62rem',
    fontWeight: 500,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    opacity: 0.9,
    marginBottom: '2px',
};

const lockScreenTimeStyle: React.CSSProperties = {
    fontSize: '3.3rem',
    fontWeight: 200,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    lineHeight: 1,
    marginBottom: '16px',
    opacity: 0.95,
};

const lockWidgetTrayStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 10px',
    minHeight: '94px',
    boxSizing: 'border-box',
};

const lockWidgetStyle: React.CSSProperties = {
    width: '47%',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
};

const lockWidgetTitleStyle: React.CSSProperties = {
    fontSize: '0.5rem',
    fontWeight: 700,
    letterSpacing: '0.05em',
    opacity: 0.55,
    textAlign: 'center',
    textTransform: 'uppercase',
    color: '#ffffff',
};

const lockWidgetGridStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
};

const lockDividerStyle: React.CSSProperties = {
    width: '1px',
    height: '52px',
    background: 'rgba(255, 255, 255, 0.15)',
};

const lockScreenBottomInfoStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '22px',
    fontSize: '0.62rem',
    opacity: 0.55,
    letterSpacing: '0.02em',
    textAlign: 'center',
    width: '100%',
};

// Home Screen specific styles
const homeScreenContentStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    paddingTop: '8px',
    justifyContent: 'space-between',
};

const homeGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px 10px',
    width: '100%',
    boxSizing: 'border-box',
};

const homeWidgetSmallStyle: React.CSSProperties = {
    gridColumn: 'span 2',
    gridRow: 'span 2',
    background: 'rgba(28, 28, 30, 0.85)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRadius: '18px',
    border: '1px solid rgba(255, 255, 255, 0.07)',
    boxShadow: '0 6px 16px rgba(0,0,0,0.3)',
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    height: '246px', // Fit properly in the simulator space
    boxSizing: 'border-box',
};

const homeWidgetMediumStyle: React.CSSProperties = {
    gridColumn: 'span 4',
    gridRow: 'span 2',
    background: 'rgba(28, 28, 30, 0.85)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRadius: '18px',
    border: '1px solid rgba(255, 255, 255, 0.07)',
    boxShadow: '0 6px 16px rgba(0,0,0,0.3)',
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    height: '246px', // Fits two stacked widgets nicely
    boxSizing: 'border-box',
};

const homeWidgetTitleStyle: React.CSSProperties = {
    fontSize: '0.55rem',
    fontWeight: 'bold',
    opacity: 0.6,
    color: '#ffffff',
    marginBottom: '6px',
    paddingLeft: '2px',
};

const smallGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateRows: 'repeat(4, 1fr)',
    gap: '4px',
    flex: 1,
};

const mediumGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gridTemplateRows: 'repeat(4, 1fr)',
    gridAutoFlow: 'column',
    gap: '4px 8px',
    flex: 1,
};

const dockStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '18px',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: '8px 10px',
    height: '52px',
    width: '100%',
    boxSizing: 'border-box',
    marginBottom: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
};

type TabKey = 'lock' | 'small' | 'medium';

const WidgetConfig: React.FC = () => {
    const { habits } = useHabits();
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

    const widgetSpaces = useMemo(() => {
        const spaces = CONSTANTS.WIDGET_SECTIONS.flatMap((section) => createEmptySpaces(section));

        const habitAssignments: { [key: string]: string } = {};
        habits.forEach((habit) => {
            habit.widgetAssignment?.assignments?.forEach((assignment) => {
                const spaceId = `${assignment.type}-${assignment.order}`;
                habitAssignments[spaceId] = habit.id;
            });
        });

        return spaces.map((space) => {
            if (habitAssignments[space.id]) {
                return {
                    ...space,
                    isOccupied: true,
                    habitId: habitAssignments[space.id],
                };
            }
            return space;
        });
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

    const handleDragEnd = useCallback(
        async (event: DragEndEvent) => {
            const { active, over } = event;
            setActiveDragId(null);
            try {
                Haptics.impact({ style: ImpactStyle.Light });
            } catch {}
            const habitId = String(active.id);
            if (!over) return;
            const targetId = String(over.id);
            const { batch } = computeDrop(widgetSpaces, habitById, habitId, targetId);
            if (batch.length === 0) return;
            await HabitEntity.applyWidgetAssignmentBatch(batch);
        },
        [widgetSpaces, habitById],
    );

    const activeHabit = activeDragId ? habitById.get(activeDragId) : undefined;

    const renderSpaceSlot = (spaceId: string, isLock = false) => {
        const space = widgetSpaces.find((s) => s.id === spaceId);
        if (!space) return null;

        return (
            <div key={space.id} style={{ width: '100%', height: isLock ? '32px' : '44px' }}>
                {space.isOccupied && space.habitId ? (
                    (() => {
                        const h = habitById.get(space.habitId);
                        if (!h) {
                            return <DroppableSlot id={space.id} isHighlighted={false} isLock={isLock} />;
                        }
                        return activeDragId === h.id ? (
                            <DroppableSlot id={space.id} isHighlighted={true} isLock={isLock} />
                        ) : (
                            <OccupiedWidgetSlot spaceId={space.id} habit={h} isLock={isLock} />
                        );
                    })()
                ) : (
                    <DroppableSlot id={space.id} isHighlighted={false} isLock={isLock} />
                )}
            </div>
        );
    };

    const renderMockAppIcon = (name: string, icon: string, bg: string, inDock = false) => (
        <div
            key={name || bg}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: inDock ? 'auto' : '54px',
            }}
        >
            <div
                style={{
                    width: inDock ? '38px' : '36px',
                    height: inDock ? '38px' : '36px',
                    borderRadius: '9px',
                    background: bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
                }}
            >
                {icon}
            </div>
            {name && (
                <span
                    style={{
                        fontSize: '0.45rem',
                        color: '#ffffff',
                        marginTop: '2.5px',
                        fontWeight: 600,
                        textAlign: 'center',
                        maxWidth: '44px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {name}
                </span>
            )}
        </div>
    );

    if (habits.length === 0) {
        return (
            <IonPage>
                <IonHeader>
                    <IonToolbar>
                        <IonButtons slot="start">
                            <IonBackButton defaultHref="/home" />
                        </IonButtons>
                        <IonTitle className="ion-text-center">Widget Configuration</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80%', padding: '24px', textAlign: 'center' }}>
                        <IonIcon icon={apps} style={{ fontSize: '4rem', color: 'var(--ion-color-medium)', marginBottom: '16px' }} />
                        <h2 style={{ fontWeight: 'bold' }}>No Habits Found</h2>
                        <p style={{ color: 'var(--ion-color-medium)', maxWidth: '280px', margin: '8px 0 24px', fontSize: '0.95rem', lineHeight: '1.4' }}>
                            You need to create at least one habit before configuring widgets.
                        </p>
                        <IonButton routerLink="/home" expand="block" style={{ width: '200px' }}>
                            Go Back & Create Habit
                        </IonButton>
                    </div>
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
                    <IonTitle className="ion-text-center">Widget Configuration</IonTitle>
                </IonToolbar>
            </IonHeader>

            <IonContent>
                <DndContext
                    sensors={sensors}
                    onDragStart={({ active }) => {
                        setActiveDragId(String(active.id));
                        try {
                            Haptics.impact({ style: ImpactStyle.Light });
                        } catch {}
                    }}
                    onDragCancel={() => setActiveDragId(null)}
                    onDragEnd={handleDragEnd}
                >
                    <div className="ion-padding" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
                        <IonSegment
                            value={activeTab}
                            style={{ marginBottom: '12px' }}
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

                        <p
                            style={{
                                padding: '0 16px',
                                margin: '0 0 12px',
                                fontSize: '0.82rem',
                                color: 'var(--ion-color-medium)',
                                textAlign: 'center',
                                lineHeight: '1.3',
                            }}
                        >
                            {activeTab === 'lock'
                                ? 'Press & drag a habit to a slot in the tray. Tap back to home when done.'
                                : 'Press & drag a habit to a card on the home screen. Tap back to home when done.'
                            }
                        </p>

                        {/* iPhone Simulation Container */}
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={mockPhoneFrameStyle}>
                                <div style={mockScreenStyle(activeTab)}>
                                    {/* Status Bar */}
                                    <div style={statusBarStyle}>
                                        <span style={{ fontSize: '0.62rem', fontWeight: 600 }}>9:41</span>
                                        <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.62rem' }}>📶</span>
                                            <span style={{ fontSize: '0.62rem' }}>🔋</span>
                                        </div>
                                    </div>

                                    {/* Lock Screen View */}
                                    {activeTab === 'lock' && (
                                        <div style={lockScreenContentStyle}>
                                            <div style={lockScreenDateStyle}>Friday, June 5</div>
                                            <div style={lockScreenTimeStyle}>09:41</div>

                                            {/* Widget Tray containing Lock 1 & Lock 2 */}
                                            <div style={lockWidgetTrayStyle}>
                                                <div style={lockWidgetStyle}>
                                                    <div style={lockWidgetTitleStyle}>Widget 1</div>
                                                    <div style={lockWidgetGridStyle}>
                                                        {renderSpaceSlot('lock1-1', true)}
                                                        {renderSpaceSlot('lock1-2', true)}
                                                    </div>
                                                </div>
                                                <div style={lockDividerStyle} />
                                                <div style={lockWidgetStyle}>
                                                    <div style={lockWidgetTitleStyle}>Widget 2</div>
                                                    <div style={lockWidgetGridStyle}>
                                                        {renderSpaceSlot('lock2-1', true)}
                                                        {renderSpaceSlot('lock2-2', true)}
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={lockScreenBottomInfoStyle}>
                                                Drag widgets back to pool to remove
                                            </div>
                                        </div>
                                    )}

                                    {/* Home Screen View */}
                                    {(activeTab === 'small' || activeTab === 'medium') && (
                                        <div style={homeScreenContentStyle}>
                                            <div style={homeGridStyle}>
                                                {activeTab === 'small' ? (
                                                    <>
                                                        {/* Small Widget 1 */}
                                                        <div style={homeWidgetSmallStyle}>
                                                            <span style={homeWidgetTitleStyle}>Habits I</span>
                                                            <div style={smallGridStyle}>
                                                                {renderSpaceSlot('small1-1')}
                                                                {renderSpaceSlot('small1-2')}
                                                                {renderSpaceSlot('small1-3')}
                                                                {renderSpaceSlot('small1-4')}
                                                            </div>
                                                        </div>

                                                        {renderMockAppIcon('Safari', '🧭', 'linear-gradient(to bottom, #00c6ff, #0072ff)')}
                                                        {renderMockAppIcon('Photos', '🌸', '#ffffff')}
                                                        {renderMockAppIcon('Mail', '✉️', 'linear-gradient(to bottom, #2980b9, #2c3e50)')}

                                                        {/* Small Widget 2 */}
                                                        <div style={homeWidgetSmallStyle}>
                                                            <span style={homeWidgetTitleStyle}>Habits II</span>
                                                            <div style={smallGridStyle}>
                                                                {renderSpaceSlot('small2-1')}
                                                                {renderSpaceSlot('small2-2')}
                                                                {renderSpaceSlot('small2-3')}
                                                                {renderSpaceSlot('small2-4')}
                                                            </div>
                                                        </div>

                                                        {renderMockAppIcon('Music', '🎵', 'linear-gradient(to bottom, #ff5e62, #ff9966)')}
                                                    </>
                                                ) : (
                                                    <>
                                                        {/* Medium Widget 1 */}
                                                        <div style={homeWidgetMediumStyle}>
                                                            <span style={homeWidgetTitleStyle}>Habits Medium I</span>
                                                            <div style={mediumGridStyle}>
                                                                {renderSpaceSlot('medium1-1')}
                                                                {renderSpaceSlot('medium1-2')}
                                                                {renderSpaceSlot('medium1-3')}
                                                                {renderSpaceSlot('medium1-4')}
                                                                {renderSpaceSlot('medium1-5')}
                                                                {renderSpaceSlot('medium1-6')}
                                                                {renderSpaceSlot('medium1-7')}
                                                                {renderSpaceSlot('medium1-8')}
                                                            </div>
                                                        </div>

                                                        {renderMockAppIcon('Safari', '🧭', 'linear-gradient(to bottom, #00c6ff, #0072ff)')}
                                                        {renderMockAppIcon('Photos', '🌸', '#ffffff')}
                                                        {renderMockAppIcon('Settings', '⚙️', '#8e8e93')}
                                                        {renderMockAppIcon('Mail', '✉️', 'linear-gradient(to bottom, #2980b9, #2c3e50)')}

                                                        {/* Medium Widget 2 */}
                                                        <div style={homeWidgetMediumStyle}>
                                                            <span style={homeWidgetTitleStyle}>Habits Medium II</span>
                                                            <div style={mediumGridStyle}>
                                                                {renderSpaceSlot('medium2-1')}
                                                                {renderSpaceSlot('medium2-2')}
                                                                {renderSpaceSlot('medium2-3')}
                                                                {renderSpaceSlot('medium2-4')}
                                                                {renderSpaceSlot('medium2-5')}
                                                                {renderSpaceSlot('medium2-6')}
                                                                {renderSpaceSlot('medium2-7')}
                                                                {renderSpaceSlot('medium2-8')}
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            {/* Home Screen Dock */}
                                            <div style={dockStyle}>
                                                {renderMockAppIcon('', '📞', 'linear-gradient(to bottom, #a8ff78, #78ffd6)', true)}
                                                {renderMockAppIcon('', '💬', 'linear-gradient(to bottom, #11998e, #38ef7d)', true)}
                                                {renderMockAppIcon('', '🎵', 'linear-gradient(to bottom, #ff5e62, #ff9966)', true)}
                                                {renderMockAppIcon('', '🏋️‍♂️', 'linear-gradient(to bottom, #f12711, #f5af19)', true)}
                                            </div>
                                        </div>
                                    )}

                                    {/* Mock Home indicator */}
                                    <div style={homeIndicatorStyle} />
                                </div>
                            </div>
                        </div>

                        {/* Available Habits Pool */}
                        <HabitsPool habits={poolHabits} activeDragId={activeDragId} />
                    </div>

                    <DragOverlay dropAnimation={null}>
                        {activeHabit ? (
                            <div style={{ width: 110, height: 60 }}>
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
