import React, { useMemo } from 'react';
import { generateSquirclePath } from './Squircle';
import { Habit, HistoryGridProps } from '@utils/TypesAndProps';
import { GoalChangeIndicator } from './GoalChangeIndicator';
import { getGoalChange } from '@utils/Utilities';
import { CONSTANTS } from '@utils/Constants'; // Import CONSTANTS

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

const adjustColorOpacity = (color: string, opacity: number): string => {
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  if (color.startsWith('rgb')) {
    if (color.startsWith('rgba')) {
      return color.replace(/[\d.]+\)$/g, `${opacity})`);
    }
    return color.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
  }
  return color;
};

const getFillColor = (
  value: [number, number],
  type: Habit.Type,
  color: string
): string => {
  const [quantity, goal] = value;
  if (type === 'checkbox') {
    return quantity > 0 ? color : CONSTANTS.HISTORY_GRID.DEFAULT_GRAY;
  } else {
    const hasQuantity = quantity > 0;
    const colorIntensity = goal && hasQuantity ? Math.min(quantity / goal, 1) : 1;
    return hasQuantity ? adjustColorOpacity(color, colorIntensity) : CONSTANTS.HISTORY_GRID.DEFAULT_GRAY;
  }
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
}> = ({ day, index, squareSize, rowOpacity, type, color, history, defaultGoal }) => {
  const fill = getFillColor(day.value, type, color);

  // Transform history to the correct format
  const historyObject: Record<string, Habit.HistoryEntry> = {}; 
  history.forEach(entry => {
    historyObject[entry.date] = { 
      goal: entry.value[1],
      quantity: entry.value[0],
    };
  });

  const goalChange = getGoalChange(day.date, historyObject, defaultGoal);

  const containerStyle = {
    width: `${squareSize}px`,
    height: `${squareSize}px`,
    opacity: rowOpacity,
    position: 'relative' as const,
  };

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
      {goalChange !== null && (
        <div style={{
          position: 'absolute',
          bottom: '1px',
          left: '1px'
        }}>
          <GoalChangeIndicator
            change={goalChange}
            showBadge={false}
            size={6}
          />
        </div>
      )}
    </div>
  );
};

const GridRow: React.FC<{
  days: Array<{ date: string; value: [number, number] }>;
  gap: number;
  squareSize: number;
  rowOpacity: number;
  type: Habit.Type;
  color: string;
  history: HistoryGridProps['data'];
}> = ({ days, gap, squareSize, rowOpacity, type, color, history }) => (
  <div style={{ display: 'flex', gap: `${gap}px` }}>
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

export const HistoryGrid: React.FC<HistoryGridProps> = ({
  data,
  color,
  type,
  baseSize = CONSTANTS.UI.DEFAULT_BASE_SIZE,
  gap = CONSTANTS.UI.DEFAULT_GAP,
  cellsPerRow = CONSTANTS.UI.CELLS_PER_ROW,
}) => {
  const squareSize = baseSize - gap;
  const cornerRadius = CONSTANTS.UI.DEFAULT_CORNER_RADIUS;
  const rowsCount = CONSTANTS.HISTORY_GRID.DEFAULT_ROWS_COUNT;
  const gridWidth = cellsPerRow * squareSize + (cellsPerRow - 1) * gap;

  const gridContainerStyle = {
    width: `${gridWidth}px`,
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '0px',
    gap: `${gap}px`,
  };

  return (
    <div style={gridContainerStyle}>
      <SquircleDefinition squareSize={squareSize} cornerRadius={cornerRadius} />

      {[...Array(rowsCount)].map((_, rowIndex) => {
        const rowStart = rowIndex * cellsPerRow;
        const rowOpacity = CONSTANTS.UI.MAX_ROW_OPACITY - (rowsCount - 1 - rowIndex) * CONSTANTS.UI.ROW_OPACITY_DECREMENT;

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