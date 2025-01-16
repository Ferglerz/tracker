import { useState } from "react";
import { Squircle } from "./Squircle";

export const DroppableSpace: React.FC<{
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
                height: '42px', // Reduced height by 8 pixels
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
        </div>
    );
};