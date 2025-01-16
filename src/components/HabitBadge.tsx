import { IonIcon } from "@ionic/react";
import { HabitEntity } from "@utils/HabitEntity";
import { adjustColor } from "@utils/Utilities";
import { closeCircle } from "ionicons/icons";
import { useState, useRef, useEffect } from "react";
import { Squircle } from "./Squircle";
import * as icons from 'ionicons/icons';

export const HabitBadge: React.FC<{ 
    habit: HabitEntity,
    onRemove?: () => void,
    isAssigned?: boolean 
  }> = ({ habit, onRemove, isAssigned }) => {
    const [isLongPressing, setIsLongPressing] = useState(false);
    const longPressTimer = useRef<NodeJS.Timeout>();
    const [showRemove, setShowRemove] = useState(false);
    const iconSize = '20px'
  
    const handleTouchStart = () => {
      
      longPressTimer.current = setTimeout(() => {
        setIsLongPressing(true);
      }, 150); // Faster long press
    };
  
    const handleTouchEnd = () => {
      if (isLongPressing) {
          setIsLongPressing(false);
        }
  
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
        }
      
    };
  
    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isAssigned) {
        setShowRemove(!showRemove);
      }
    };
  
    useEffect(() => {
      return () => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
        }
      };
    }, []);
  
  
    return (
      <div
        draggable={!showRemove}
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', habit.id);
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        onClick={handleClick}
        className={`${isLongPressing ? 'habit-long-press' : ''}`}
        style={{
          position: 'relative',
          width: '100%',
          height: '42px', // Reduced height by 8 pixels
          cursor: showRemove ? 'pointer' : 'grab',
          userSelect: 'none',
        }}
      >
        <Squircle
          width="100%"
          height="100%"
          cornerRadius={16}
          fill={[
            adjustColor(habit.bgColor, { lighter: true }),
            habit.bgColor
          ]}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        />
        {showRemove && isAssigned && (
            <div 
              onClick={(e) => {
                e.stopPropagation();
                onRemove?.();
              }}
              style={{
                position: 'absolute',
                top: '50%',
                left: '8px',
                transform: 'translateY(-50%)',
                zIndex: 1,
              }}
            >
              <IonIcon
                size="large"
                style={{
                  width: iconSize,
                  height: iconSize,
                }}
                icon={closeCircle}
              />
            </div>
          )}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          padding: '8px',
          color: 'var(--ion-text-color)',
        }}>
          {!showRemove && (
            <>
              {habit.icon && (
                <IonIcon
                  style={{
                    width: iconSize,
                    height: iconSize,
                    marginRight: '8px',
                    marginLeft: showRemove && isAssigned ? '28px' : '0',
                  }}
                  icon={icons[habit.icon as keyof typeof icons]}
                />
              )}
              <span style={{ 
                fontSize: '0.85rem',
                fontWeight: '500',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginLeft: showRemove && isAssigned ? '28px' : '0',
              }}>
                {habit.name}
              </span>
            </>
          )}
        </div>
      </div>
    );
  };