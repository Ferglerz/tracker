import React from 'react';
import { Squircle } from './Squircle';

interface GridProps<T> {
  data: Array<{ date: string; value: T }>;
  color: string;
  squareSize?: number;
  gap?: number;
  rowPadding?: number;
  renderContent: (day: { date: string; value: T }, rowIndex: number, index: number) => React.ReactNode;
}

const DaySquare = <T,>({ day, index, squareSize, rowOpacity, renderContent, rowIndex }: {
  day: { date: string; value: T };
  index: number;
  squareSize: number;
  rowOpacity: number;
  renderContent: (day: { date: string; value: T }, rowIndex: number, index: number) => React.ReactNode;
  rowIndex: number;
}) => (
  <div
    key={`${day.date}-${index}`}
    style={{
      width: `${squareSize}px`,
      height: `${squareSize}px`,
      opacity: rowOpacity,
    }}
  >
    {renderContent(day, rowIndex, index)}
  </div>
);

const WeekRow = <T,>({ days, gap, squareSize, rowOpacity, renderContent, rowIndex }: {
  days: Array<{ date: string; value: T }>;
  gap: number;
  squareSize: number;
  rowOpacity: number;
  renderContent: (day: { date: string; value: T }, rowIndex: number, index: number) => React.ReactNode;
  rowIndex: number;
}) => (
  <div style={{ display: 'flex', gap: `${gap}px` }}>
    {days.map((day, index) => (
      <DaySquare
        key={`${day.date}-${index}`}
        day={day}
        index={index}
        squareSize={squareSize}
        rowOpacity={rowOpacity}
        renderContent={renderContent}
        rowIndex={rowIndex}
      />
    ))}
  </div>
);

const renderGrid = <T,>({ data, color, gap = 3, squareSize = 8 - gap, rowPadding = 3, renderContent }: GridProps<T>) => {
  const last56Days = data.slice(-56);
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: `${gap}px`,
      padding: '8px'
    }}>
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
                renderContent={renderContent}
                rowIndex={rowIndex}
              />
            </div>
            <WeekRow
              days={last56Days.slice(rowStart + 7, rowStart + 14)}
              gap={gap}
              squareSize={squareSize}
              rowOpacity={rowOpacity}
              renderContent={renderContent}
              rowIndex={rowIndex}
            />
          </div>
        );
      })}
    </div>
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

interface CheckboxHistoryProps {
  data: Array<{ date: string; value: boolean }>;
  color: string;
}

export const CheckboxHistory: React.FC<CheckboxHistoryProps> = ({ data, color }) => {
  return renderGrid({
    data,
    color,
    renderContent: (day) => (
      <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'transparent'
          }}
        >
          <Squircle 
            width="5px" 
            height="5px" 
            cornerRadius={2} 
            fill={day.value ? color : 'rgba(128, 128, 128, 0.1)'}
          />
        </div>
    )
  });
};

interface QuantityHistoryProps {
  data: Array<{ date: string; value: [number, number] }>;
  color: string;
}

export const QuantityHistory: React.FC<QuantityHistoryProps> = ({ data, color }) => {
  return renderGrid({
    data,
    color,
    renderContent: (day) => {
      const [quantity, goal] = day.value;
      const hasQuantity = quantity > 0;
      const colorIntensity = goal && hasQuantity ? Math.min(quantity / goal, 1) : 1;

      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'transparent'
          }}
        >
          <Squircle 
            width="5px" 
            height="5px" 
            cornerRadius={2} 
            fill={hasQuantity 
              ? adjustColorOpacity(color, colorIntensity)
              : 'rgba(128, 128, 128, 0.1)'}
          />
        </div>
      );
    }
  });
};