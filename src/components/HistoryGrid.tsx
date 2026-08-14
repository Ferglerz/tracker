import React, { useId, useMemo } from 'react';
import { generateSquirclePath } from './Squircle';
import { Habit, HistoryGridProps } from '@utils/TypesAndProps';
import { CONSTANTS } from '@utils/Constants';
import { getFillColor } from '@utils/Utilities';

const SquircleDefinition: React.FC<{
  squareSize: number;
  cornerRadius: number;
  pathId: string;
}> = ({ squareSize, cornerRadius, pathId }) => {
  const pathD = useMemo(() =>
    generateSquirclePath(squareSize, squareSize, cornerRadius),
    [squareSize, cornerRadius]
  );

  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }}>
      <defs>
        <path
          id={pathId}
          d={pathD}
        />
      </defs>
    </svg>
  );
};

const DaySquare: React.FC<{
  day: { date: string; value: [number, number] };
  index: number;
  squareSize: number;
  rowOpacity: number;
  type: Habit.Type;
  color: string;
  pathId: string;
}> = ({ day, index, squareSize, rowOpacity, type, color, pathId }) => {
  const [quantity, goal] = day.value;

  const fill = useMemo(() =>
    getFillColor(day.value, type, color),
    [day.value, type, color]
  );

  const containerStyle = useMemo(() => ({
    width: `${squareSize}px`,
    height: `${squareSize}px`,
    opacity: rowOpacity,
    position: 'relative' as const,
  }), [squareSize, rowOpacity]);

  const emoji = useMemo(() => {
    if (type !== 'quantity' || !goal || quantity < goal * 2) {
      return null;
    }
    if (quantity >= goal * 4) return '🚀';
    if (quantity >= goal * 3) return '🔥';
    if (quantity >= goal * 2) return '⚡';
    return null;
  }, [quantity, goal, type]);

  const emojiStyle = useMemo(() => ({
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: `${squareSize * 0.55}px`,
    pointerEvents: 'none' as const,
    userSelect: 'none' as const,
    lineHeight: 1,
  }), [squareSize]);

  return (
    <div
      key={`${day.date}-${index}`}
      style={containerStyle}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${squareSize} ${squareSize}`}
      >
        <use
          href={`#${pathId}`}
          fill={fill}
          width={squareSize}
          height={squareSize}
        />
      </svg>
      {squareSize >= 12 && emoji && (
        <span style={emojiStyle}>
          {emoji}
        </span>
      )}
    </div>
  );
};

const GridRow = React.memo<{
  days: Array<{ date: string; value: [number, number] }>;
  gap: number;
  squareSize: number;
  rowOpacity: number;
  type: Habit.Type;
  color: string;
  pathId: string;
}>(({ days, gap, squareSize, rowOpacity, type, color, pathId }) => {
  const rowStyle = useMemo(() => ({
    display: 'flex',
    gap: `${gap}px`
  }), [gap]);

  return (
    <div style={rowStyle}>
      {days.map((day, index) => (
        <DaySquare
          key={`${day.date}-${index}`}
          day={day}
          index={index}
          squareSize={squareSize}
          rowOpacity={rowOpacity}
          type={type}
          color={color}
          pathId={pathId}
        />
      ))}
    </div>
  );
});
GridRow.displayName = 'GridRow';

export const HistoryGrid: React.FC<HistoryGridProps> = ({
  data,
  color,
  type,
  baseSize = CONSTANTS.UI.DEFAULT_BASE_SIZE,
  gap = CONSTANTS.UI.DEFAULT_GAP,
  cellsPerRow = CONSTANTS.UI.CELLS_PER_ROW,
  hideGrid = false,
}) => {
  const pathId = `squircle-cell-${useId().replace(/:/g, '')}`;
  const squareSize = baseSize - gap;
  const cornerRadius = CONSTANTS.UI.DEFAULT_CORNER_RADIUS;
  const rowsCount = CONSTANTS.HISTORY_GRID.DEFAULT_ROWS_COUNT;

  const gridWidth = useMemo(() =>
    cellsPerRow * squareSize + (cellsPerRow - 1) * gap,
    [cellsPerRow, squareSize, gap]
  );

  const gridContainerStyle = useMemo(() => ({
    width: `${gridWidth}px`,
    display: 'flex' as const,
    flexDirection: 'column' as const,
    padding: '0px',
    gap: `${gap}px`,
  }), [gridWidth, gap]);

  return (
    <div className={`history-grid ${hideGrid ? 'hide-grid-elements' : ''}`} style={gridContainerStyle}>
      <SquircleDefinition squareSize={squareSize} cornerRadius={cornerRadius} pathId={pathId} />
      {[...Array(rowsCount)].map((_, rowIndex) => {
        const rowStart = rowIndex * cellsPerRow;
        const rowOpacity = CONSTANTS.UI.MAX_ROW_OPACITY -
          (rowsCount - 1 - rowIndex) * CONSTANTS.UI.ROW_OPACITY_DECREMENT;

        return (
          <GridRow
            key={rowIndex}
            days={data.slice(rowStart, rowStart + cellsPerRow)}
            gap={gap}
            squareSize={squareSize}
            rowOpacity={rowOpacity}
            type={type}
            color={color}
            pathId={pathId}
          />
        );
      })}
    </div>
  );
};