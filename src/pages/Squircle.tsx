// Squircle.tsx
import React, { useRef, useEffect, useState } from 'react';

// Export the path generation function so it can be reused
export const generateSquirclePath = (width: number, height: number, cornerRadius: number) => {
    const steps = Math.max(6,Math.max(width, height) / 5); 
    const n = 4;
    const powN = 2 / n;
    const generateCornerPoints = (size: number) => {
        const points = [];
        for (let i = 0; i <= steps; i++) {
            const t = (i / steps) * (Math.PI / 2);
            const cos = Math.cos(t);
            const sin = Math.sin(t);
            const x = size * (1 - (1 - Math.pow(Math.abs(sin), n)) ** powN);
            const y = size * (1 - (1 - Math.pow(Math.abs(cos), n)) ** powN);
            points.push([x, y]);
        }
        return points;
    };

    const cornerPoints = generateCornerPoints(cornerRadius);
    let d = `M ${cornerRadius} 0`;
    // To top-right
    if (width > 2 * cornerRadius) {
        d += ` L ${width - cornerRadius} 0`;
    }
    // Top-right corner
    cornerPoints.forEach(([x, y]) => {
        d += ` L ${width - y} ${x}`;
    });
    // To bottom-right
    if (height > 2 * cornerRadius) {
        d += ` L ${width} ${height - cornerRadius}`;
    }
    // Bottom-right corner
    cornerPoints.forEach(([x, y]) => {
        d += ` L ${width - x} ${height - y}`;
    });
    // To bottom-left
    if (width > 2 * cornerRadius) {
        d += ` L ${cornerRadius} ${height}`;
    }
    // Bottom-left corner
    cornerPoints.forEach(([x, y]) => {
        d += ` L ${y} ${height - x}`;
    });
    // To top-left
    if (height > 2 * cornerRadius) {
        d += ` L 0 ${cornerRadius}`;
    }
    // Top-left corner
    cornerPoints.forEach(([x, y]) => {
        d += ` L ${x} ${y}`;
    });
    return d + ' Z';
};

// Add a new component specifically for creating masks
export const SquircleMask: React.FC<{
    id: string;
    width?: number | string;
    height?: number | string;
    cornerRadius?: number;
}> = ({
    id,
    cornerRadius = 20
}) => (
        <svg width="0" height="0" style={{ position: 'absolute' }}>
            <defs>
                <mask id={id}>
                    <path
                        d={generateSquirclePath(100, 100, cornerRadius)}
                        fill="white"
                    />
                </mask>
            </defs>
        </svg>
    );

interface SquircleProps {
    width?: number | string;
    height?: number | string;
    cornerRadius?: number;
    fill?: string;
    className?: string;
    style?: React.CSSProperties;
    dashed?: boolean;
    strokeWidth?: number;
    stroke?: string;
}

// Modified Squircle component with dashed border option and percentage support
export const Squircle: React.FC<SquircleProps> = ({
    width = 200,
    height = 200,
    cornerRadius = 20,
    fill,
    className = "",
    style = {},
    dashed = false,
    strokeWidth = 3,
    stroke = "#444444"
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setDimensions({
                    width: rect.width,
                    height: rect.height
                });
            }
        };

        updateDimensions();

        // Create ResizeObserver to watch for container size changes
        const resizeObserver = new ResizeObserver(updateDimensions);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className={className}
            style={{
                ...style,
                width: typeof width === 'number' ? `${width}px` : width,
                height: typeof height === 'number' ? `${height}px` : height,
                position: 'relative',
            }}
        >
            {dimensions.width > 0 && dimensions.height > 0 && (
                <svg
                    width="100%"
                    height="100%"
                    viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                    }}
                >
                    <path
                        d={generateSquirclePath(dimensions.width, dimensions.height, cornerRadius)}
                        fill={dashed ? 'none' : (fill || "#4a90e2")}
                        stroke={dashed ? stroke : 'none'}
                        strokeWidth={dashed ? strokeWidth : 0}
                        strokeDasharray={dashed ? "5,5" : 'none'}
                        vectorEffect="non-scaling-stroke"
                    />
                </svg>
            )}
        </div>
    );
};