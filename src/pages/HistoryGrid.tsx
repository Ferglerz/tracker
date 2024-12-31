import React, { useMemo } from 'react';
import { generateSquirclePath } from './Squircle';
import { Habit } from './Types';

type HistoryValue = boolean | [number, number];

interface HistoryGridProps {
  data: Array<{ date: string; value: HistoryValue }>;
  color: string;
  type: Habit.Type;
  gap?: number;
  squareSize?: number;
  rowPadding?: number;
}

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
  if (type === 'checkbox') {
    return (value as boolean) ? color : 'rgba(128, 128, 128, 0.1)';
  } else {
    const [quantity, goal] = value as [number, number];
    const hasQuantity = quantity > 0;
    const colorIntensity = goal && hasQuantity ? Math.min(quantity / goal, 1) : 1;
    return hasQuantity ? adjustColorOpacity(color, colorIntensity) : 'rgba(128, 128, 128, 0.1)';
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
  
  return (
    <div
      key={`${day.date}-${index}`}
      style={{
        width: `${squareSize}px`,
        height: `${squareSize}px`,
        opacity: rowOpacity,
        position: 'relative'
      }}
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

const WeekRow: React.FC<{
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
  gap = 1,
  squareSize = 8 - gap,
  rowPadding = 2,
}) => {
  const last56Days = data.slice(-56);
  const cornerRadius = 2;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: `${gap}px`,
      padding: '8px'
    }}>
      <SquircleDefinition squareSize={squareSize} cornerRadius={cornerRadius} />
      
      {[0, 1, 2, 3].map(rowIndex => {
        const rowStart = rowIndex * 14;
        const rowOpacity = 1 - (3 - rowIndex) * 0.25;

        return (
          <div
            key={rowIndex}
            style={{
              display: 'flex',
              gap: `${gap}px`
            }}
          >
            <div style={{ marginRight: `${rowPadding}px` }}>
              <WeekRow
                days={last56Days.slice(rowStart, rowStart + 7)}
                gap={gap}
                squareSize={squareSize}
                rowOpacity={rowOpacity}
                type={type}
                color={color}
              />
            </div>
            <WeekRow
              days={last56Days.slice(rowStart + 7, rowStart + 14)}
              gap={gap}
              squareSize={squareSize}
              rowOpacity={rowOpacity}
              type={type}
              color={color}
            />
          </div>
        );
      })}
    </div>
  );
};