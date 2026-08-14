import { describe, it, expect } from 'vitest';
import { computeDrop, HABITS_POOL_ID } from './WidgetConfig';
import { HabitEntity } from '../utils/HabitEntity';
import { CONSTANTS } from '../utils/Constants';
import type { Habit } from '../utils/TypesAndProps';

interface WidgetSpace {
    id: string;
    type: string;
    order: number;
    isOccupied: boolean;
    habitId?: string;
}

const createEmptySpaces = (section: any): WidgetSpace[] =>
    Array.from({ length: section.spaces }, (_, index) => ({
        id: `${section.type}-${index + 1}`,
        type: section.type,
        order: index + 1,
        isOccupied: false,
    }));

// Derivation logic from WidgetConfig.tsx
function getWidgetSpaces(habits: HabitEntity[]) {
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
}

function getAssignedIds(widgetSpaces: WidgetSpace[], activeTab: string) {
    const s = new Set<string>();
    widgetSpaces.forEach((sp) => {
        if (sp.isOccupied && sp.habitId) {
            if (activeTab === 'lock' && sp.type.startsWith('lock')) s.add(sp.habitId);
            if (activeTab === 'home' && (sp.type.startsWith('small') || sp.type.startsWith('medium'))) s.add(sp.habitId);
        }
    });
    return s;
}

describe('WidgetConfig derivations', () => {
    it('normalizes duplicate assignments when moving a habit', () => {
        const habit = new HabitEntity({
            id: 'habit-A',
            name: 'Exercise',
            type: 'checkbox',
            goal: 1,
            bgColor: '#3880f4',
            quantity: 0,
            history: {},
            widgets: {
                assignments: [
                    { type: 'small1', order: 1 },
                    { type: 'small1', order: 2 },
                ],
            },
        });
        const spaces: WidgetSpace[] = [
            { id: 'small1-1', type: 'small1', order: 1, isOccupied: true, habitId: habit.id },
            { id: 'small1-2', type: 'small1', order: 2, isOccupied: true, habitId: habit.id },
            { id: 'small1-3', type: 'small1', order: 3, isOccupied: false },
        ];

        const result = computeDrop(
            spaces,
            new Map([[habit.id, habit]]),
            habit.id,
            'small1-3',
            'small1-1',
        );

        expect(result.batch[0].widgets.assignments).toEqual([{ type: 'small1', order: 3 }]);
        expect(result.nextSpaces.filter((space) => space.isOccupied)).toEqual([
            { id: 'small1-3', type: 'small1', order: 3, isOccupied: true, habitId: habit.id },
        ]);
    });

    it('correctly manages pool availability when removing a habit assigned to both lock and home screen', () => {
        // 1. Initial State: habit is assigned to BOTH lock screen (lock1-1) and homescreen (small1-1)
        const initialHabitProps: Habit.Habit = {
            id: 'habit-A',
            name: 'Exercise',
            type: 'checkbox',
            goal: 1,
            bgColor: '#3880f4',
            quantity: 0,
            history: {},
            widgets: {
                assignments: [
                    { type: 'lock1', order: 1 },
                    { type: 'small1', order: 1 }
                ]
            }
        };

        let habits = [new HabitEntity(initialHabitProps)];

        // Compute derivations for lock tab
        let widgetSpaces = getWidgetSpaces(habits);
        let assignedIds = getAssignedIds(widgetSpaces, 'lock');
        let poolHabits = habits.filter((h) => !assignedIds.has(h.id));

        // Expect: habit is assigned on lock tab, so it is in assignedIds and NOT in pool
        expect(assignedIds.has('habit-A')).toBe(true);
        expect(poolHabits).toHaveLength(0);

        // Compute derivations for home tab
        widgetSpaces = getWidgetSpaces(habits);
        assignedIds = getAssignedIds(widgetSpaces, 'home');
        poolHabits = habits.filter((h) => !assignedIds.has(h.id));

        // Expect: habit is assigned on home tab, so it is in assignedIds and NOT in pool
        expect(assignedIds.has('habit-A')).toBe(true);
        expect(poolHabits).toHaveLength(0);

        // 2. Drag off lock screen: computeDrop creates new batch update
        const habitById = new Map<string, HabitEntity>([[habits[0].id, habits[0]]]);
        const dropResult = computeDrop(widgetSpaces, habitById, 'habit-A', HABITS_POOL_ID, 'lock1-1');

        expect(dropResult.batch).toHaveLength(1);
        const updatedWidgets = dropResult.batch[0].widgets;
        expect(updatedWidgets.assignments).toEqual([{ type: 'small1', order: 1 }]);

        // Apply updated widgets to habits list
        const updatedHabitProps = { ...initialHabitProps, widgets: updatedWidgets };
        habits = [new HabitEntity(updatedHabitProps)];

        // 3. Recompute derivations for Lock tab
        widgetSpaces = getWidgetSpaces(habits);
        assignedIds = getAssignedIds(widgetSpaces, 'lock');
        poolHabits = habits.filter((h) => !assignedIds.has(h.id));

        // Expect: since it's no longer assigned on Lock tab, it should NOT be in assignedIds
        // and it SHOULD be in poolHabits for Lock tab!
        expect(assignedIds.has('habit-A')).toBe(false);
        expect(poolHabits).toHaveLength(1);
        expect(poolHabits[0].id).toBe('habit-A');

        // 4. Recompute derivations for Home tab
        widgetSpaces = getWidgetSpaces(habits);
        assignedIds = getAssignedIds(widgetSpaces, 'home');
        poolHabits = habits.filter((h) => !assignedIds.has(h.id));

        // Expect: since it is still assigned on Home tab, it should be in assignedIds
        // and NOT in poolHabits for Home tab
        expect(assignedIds.has('habit-A')).toBe(true);
        expect(poolHabits).toHaveLength(0);
    });
});
