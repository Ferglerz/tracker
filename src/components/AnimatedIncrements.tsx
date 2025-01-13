import { getTransform, useAnimatedPress } from "@utils/Utilities";

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
        transition: 'all 0.2s ease-in-out',
        transform: getTransform(isPressed, type),
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

    </div>
  );
};