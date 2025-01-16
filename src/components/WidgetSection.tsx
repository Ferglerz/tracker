import { IonItem } from "@ionic/react";
import { HabitEntity } from "@utils/HabitEntity";
import { WidgetSpaceProps } from "@utils/TypesAndProps";
import { HabitBadge } from "@components/HabitBadge";
import { DroppableSpace } from "@components/DroppableSpace";

export const WidgetSection: React.FC<{
    title: string;
    spaces: WidgetSpaceProps[];
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
                        '--min-height': '42px',
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
                            onRemove={() => onDrop(space.habitId!, 'habits-container')}
                            isAssigned={true}
                        />
                    ) : (
                        <DroppableSpace spaceId={space.id} onDrop={onDrop} />
                    )}
                </IonItem>
            ))}
        </div>
    </div>
);