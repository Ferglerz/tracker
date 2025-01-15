import React, { useMemo } from 'react';
import { generateSquirclePath } from './Squircle';
import { Habit, HistoryGridProps } from '@utils/TypesAndProps';
import { CONSTANTS } from '@utils/Constants';
import { adjustColor, getFillColor } from '@utils/Utilities';

const SquircleDefinition: React.FC<{
  squareSize: number;
  cornerRadius: number;
}> = ({ squareSize, cornerRadius }) => {
  const pathD = useMemo(() =>
    generateSquirclePath(squareSize, squareSize, cornerRadius),
    [squareSize, cornerRadius]
  );

  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }}>
      <defs>
        <path
          id="squircle-cell"
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
  history: HistoryGridProps['data'];
  defaultGoal: number;
}> = ({ day, index, squareSize, rowOpacity, type, color, history }) => {
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
          href="#squircle-cell"
          fill={fill}
          width={squareSize}
          height={squareSize}
        />
      </svg>
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
  history: HistoryGridProps['data'];
}>(({ days, gap, squareSize, rowOpacity, type, color, history }) => {
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
          history={history}
          defaultGoal={0} 
        />
      ))}
    </div>
  );
});

export const HistoryGrid: React.FC<HistoryGridProps> = ({
  data,
  color,
  type,
  baseSize = CONSTANTS.UI.DEFAULT_BASE_SIZE,
  gap = CONSTANTS.UI.DEFAULT_GAP,
  cellsPerRow = CONSTANTS.UI.CELLS_PER_ROW,
  hideGrid = false,
}) => {
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
      <SquircleDefinition squareSize={squareSize} cornerRadius={cornerRadius} />
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
            history={data}
          />
        );
      })}
    </div>
  );
};