import React from 'react';

interface GridProps<T> {
  data: Array<{ date: string; value: T }>;
  color: string;
  squareSize?: number;
  gap?: number;
  rowPadding?: number;
  renderContent: (day: { date: string; value: T }, rowIndex: number, index: number) => React.ReactNode;
}

const renderGrid = <T,>({ data, color, gap = 3, squareSize = 8 - gap, rowPadding = 3, renderContent }: GridProps<T>) => {
  // Take last 56 days
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
        const rowOpacity = 1 - (3 - rowIndex) * 0.25; // Inverted opacity calculation
        
        return (
          <div
            key={rowIndex}
            style={{
              display: 'flex',
              gap: `${gap}px`
            }}
          >
            {/* First 7 days */}
            <div style={{ display: 'flex', gap: `${gap}px`, marginRight: `${rowPadding}px` }}>
              {last56Days.slice(rowStart, rowStart + 7).map((day, index) => (
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
              ))}
            </div>
            {/* Last 7 days */}
            <div style={{ display: 'flex', gap: `${gap}px` }}>
              {last56Days.slice(rowStart + 7, rowStart + 14).map((day, index) => (
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
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
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
          backgroundColor: day.value ? color : 'rgba(128, 128, 128, 0.1)',
        }}
      />
    )
  });
};

interface QuantityHistoryProps {
  data: Array<{ date: string; value: [number, number] }>;
  color: string;
}

export const QuantityHistory: React.FC<QuantityHistoryProps> = ({ data, color }) => {
  // Helper function to adjust color opacity
  const adjustColorOpacity = (color: string, opacity: number): string => {
    // If the color is in hex format (#RRGGBB)
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    // If the color is already in rgb/rgba format
    if (color.startsWith('rgb')) {
      if (color.startsWith('rgba')) {
        return color.replace(/[\d.]+\)$/g, `${opacity})`);
      }
      return color.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
    }
    return color;
  };

  return renderGrid({
    data,
    color,
    renderContent: (day) => {
      const [quantity, goal] = day.value;
      const hasQuantity = quantity > 0;
      
      // Calculate color intensity based on quantity/goal ratio
      let colorIntensity = 1;
      if (goal && hasQuantity) {
        colorIntensity = Math.min(quantity / goal, 1);

        
      }   

      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: hasQuantity 
              ? adjustColorOpacity(color, colorIntensity)
              : 'rgba(128, 128, 128, 0.1)',
          }}
        />
      );
    }
  });
};