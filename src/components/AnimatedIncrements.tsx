import React from 'react';
import { getTransform, useAnimatedPress } from "@utils/Utilities";

const symbolContainerStyle: React.CSSProperties = {
  width: '14px',
  height: '14px',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const horizontalLineStyle: React.CSSProperties = {
  position: 'absolute',
  width: '14px',
  height: '3px',
  backgroundColor: '#ffffff',
  borderRadius: '1px'
};

const verticalLineStyle: React.CSSProperties = {
  position: 'absolute',
  width: '3px',
  height: '14px',
  backgroundColor: '#ffffff',
  borderRadius: '1px'
};

export const AnimatedIncrements: React.FC<{
  onClick: (e: React.MouseEvent) => void;
  type: 'increment' | 'decrement';
  color: string;
}> = ({ onClick, type, color }) => {
  const { isPressed, handlePress } = useAnimatedPress();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handlePress(() => onClick(e));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={type === 'increment' ? 'Increase value' : 'Decrease value'}
      style={{
        position: 'relative',
        width: '24px',
        height: '24px',
        borderRadius: '5px',
        backgroundColor: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        border: 0,
        padding: 0,
        transition: 'all 0.2s ease-in-out',
        transform: getTransform(isPressed, type),
      }}
    >
      <div style={symbolContainerStyle}>
        <div style={horizontalLineStyle} />
        {type === 'increment' && (
          <div style={verticalLineStyle} />
        )}
      </div>
    </button>
  );
};