import React, { useMemo } from 'react';
import { generateSquirclePath } from './Squircle';
import { Habit } from './TypesAndProps';
import { HistoryGridProps } from './TypesAndProps';

// --- Constants ---
const DEFAULT_GRAY = 'rgba(128, 128, 128, 0.1)';
const MAX_ROW_OPACITY = 0.7;
const ROW_OPACITY_DECREMENT = 0.15;
const DEFAULT_BASE_SIZE = 8;
const DEFAULT_GAP = 1;
const DEFAULT_CELLS_PER_ROW = 20;
const DEFAULT_ROWS_COUNT = 3;
const DEFAULT_CORNER_RADIUS = 5;

export type HistoryValue = boolean | [number, number];

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
  value: HistoryValue,
  type: Habit.Type,
  color: string
): string => {
  if (typeof value === 'boolean') {
    return value ? color : DEFAULT_GRAY;
  } else {
    const [quantity, goal] = value;
    const hasQuantity = quantity > 0;
    const colorIntensity = goal && hasQuantity ? Math.min(quantity / goal, 1) : 1;
    return hasQuantity ? adjustColorOpacity(color, colorIntensity) : DEFAULT_GRAY;
  }
};

const DaySquare: React.FC<{
  day: { date: string; value: HistoryValue };
  index: number;
  squareSize: number;
  rowOpacity: number;
  type: Habit.Type;
  color: string;
}> = ({ day, index, squareSize, rowOpacity, type, color }) => {
  const fill = getFillColor(day.value, type, color);

  // --- Optimize Render Cycles: Extract Static Style ---
  const containerStyle = {
    width: `${squareSize}px`,
    height: `${squareSize}px`,
    opacity: rowOpacity,
    position: 'relative' as const, // Explicitly type as 'relative'
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
    </div>
  );
};

const GridRow: React.FC<{
  days: Array<{ date: string; value: HistoryValue }>;
  gap: number;
  squareSize: number;
  rowOpacity: number;
  type: Habit.Type;
  color: string;
}> = ({ days, gap, squareSize, rowOpacity, type, color }) => (
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
      />
    ))}
  </div>
);

export const HistoryGrid: React.FC<HistoryGridProps> = ({
  data,
  color,
  type,
  baseSize = DEFAULT_BASE_SIZE,
  gap = DEFAULT_GAP,
  cellsPerRow = DEFAULT_CELLS_PER_ROW,
}) => {
  const squareSize = baseSize - gap;
  const cornerRadius = DEFAULT_CORNER_RADIUS;
  const rowsCount = DEFAULT_ROWS_COUNT;
  const gridWidth = cellsPerRow * squareSize + (cellsPerRow - 1) * gap;

  // --- Optimize Render Cycles: Extract Static Style ---
  const gridContainerStyle = {
    width: `${gridWidth}px`,
    display: 'flex',
    flexDirection: 'column' as const, // Explicitly type as 'column'
    padding: '0px',
    gap: `${gap}px`,
  };

  return (
    <div style={gridContainerStyle}>
      <SquircleDefinition squareSize={squareSize} cornerRadius={cornerRadius} />

      {[...Array(rowsCount)].map((_, rowIndex) => {
        const rowStart = rowIndex * cellsPerRow;
        const rowOpacity = MAX_ROW_OPACITY - (rowsCount - 1 - rowIndex) * ROW_OPACITY_DECREMENT;

        return (
          <GridRow
            key={rowIndex}
            days={data.slice(rowStart, rowStart + cellsPerRow)}
            gap={gap}
            squareSize={squareSize}
            rowOpacity={rowOpacity}
            type={type}
            color={color}
          />
        );
      })}
    </div>
  );
};