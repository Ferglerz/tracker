import { useState } from "react";

export const AnimatedIncrements: React.FC<{
  onClick: () => void;
  type: 'increment' | 'decrement';
  color: string;
}> = ({ onClick, type, color }) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPressed(true);
    onClick();
    setTimeout(() => setIsPressed(false), 150);
  };

  return (
    <div
      onClick={handleClick}
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
        transition: 'all 0.15s ease-in-out',
        transform: isPressed 
          ? (type === 'increment' ? 'scale(1.2)' : 'scale(0.8)')
          : 'scale(1)',
      }}
    >
      {/* Symbol container */}
      <div style={{
        width: '14px',
        height: '14px',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Horizontal line */}
        <div style={{
          position: 'absolute',
          width: '14px',
          height: '3px',
          backgroundColor: '#ffffff',
          borderRadius: '1px'
        }} />
        
        {/* Vertical line (only for increment) */}
        {type === 'increment' && (
          <div style={{
            position: 'absolute',
            width: '3px',
            height: '14px',
            backgroundColor: '#ffffff',
            borderRadius: '1px'
          }} />
        )}
      </div>

      {/* Glow effect */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: '5px',
          pointerEvents: 'none',
          transition: 'all 0.3s ease-out',
          boxShadow: isPressed 
            ? `0 0 20px ${color}80`
            : '0 0 0 rgba(0,0,0,0)',
          opacity: isPressed ? 1 : 0,
        }}
      />
    </div>
  );
};