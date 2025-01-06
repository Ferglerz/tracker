// Squircle.tsx
import React, { useRef, useEffect, useState, useMemo } from 'react';

const generateCornerPoints = (size: number, steps: number, n: number, powN: number) => {
    const memoKey = `${size}-${steps}-${n}`;
    if (memoizedCornerPoints[memoKey]) {
        return memoizedCornerPoints[memoKey];
    }

    const points: [number, number][] = [];
    const piOver2 = Math.PI / 2;
    for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * piOver2;
        const cos = Math.cos(t);
        const sin = Math.sin(t);
        const x = size * (1 - (1 - Math.pow(Math.abs(sin), n)) ** powN);
        const y = size * (1 - (1 - Math.pow(Math.abs(cos), n)) ** powN);
        points.push([x, y]);
    }

    memoizedCornerPoints[memoKey] = points;
    return points;
};

interface MemoizedCornerPoints {
    [key: string]: [number, number][];
}

const memoizedCornerPoints: MemoizedCornerPoints = {};
export const generateSquirclePath = (width: number, height: number, cornerRadius: number) => {
    const memoKey = `${width}-${height}-${cornerRadius}`;
    if (memoizedPaths[memoKey]) {
        return memoizedPaths[memoKey];
    }

    const maxDim = Math.max(width, height);
    const maxDimSqrt = Math.ceil(Math.sqrt(maxDim)) * 1.5;
    const steps = Math.max(6, Math.min(50, maxDimSqrt));
    const n = 4;
    const powN = 2 / n;

    const cornerPoints = generateCornerPoints(cornerRadius, steps, n, powN);
    const hasWidth = width > 2 * cornerRadius;
    const hasHeight = height > 2 * cornerRadius;

    const pathSegments = [];
    pathSegments.push(`M ${cornerRadius} 0`);

    // To top-right
    if (hasWidth) {
        pathSegments.push(`L ${width - cornerRadius} 0`);
    }
    // Top-right corner
    cornerPoints.forEach(([x, y]) => {
        pathSegments.push(`L ${width - y} ${x}`);
    });
    // To bottom-right
    if (hasHeight) {
        pathSegments.push(`L ${width} ${height - cornerRadius}`);
    }
    // Bottom-right corner
    cornerPoints.forEach(([x, y]) => {
        pathSegments.push(`L ${width - x} ${height - y}`);
    });
    // To bottom-left
    if (hasWidth) {
        pathSegments.push(`L ${cornerRadius} ${height}`);
    }
    // Bottom-left corner
    cornerPoints.forEach(([x, y]) => {
        pathSegments.push(`L ${y} ${height - x}`);
    });
    // To top-left
    if (hasHeight) {
        pathSegments.push(`L 0 ${cornerRadius}`);
    }
    // Top-left corner
    cornerPoints.forEach(([x, y]) => {
        pathSegments.push(`L ${x} ${y}`);
    });

    const d = pathSegments.join(' ') + ' Z';

    memoizedPaths[memoKey] = d;
    return d;
};

interface MemoizedPaths {
    [key: string]: string;
}

const memoizedPaths: MemoizedPaths = {};

export const SquircleMask: React.FC<{
    id: string;
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

export type FillType = string | [string, string];

export const Squircle: React.FC<{
    width?: number | string;
    height?: number | string;
    cornerRadius?: number;
    fill?: FillType;
    className?: string;
    style?: React.CSSProperties;
    dashed?: boolean;
    strokeWidth?: number;
    stroke?: string;
}> = ({
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
    const gradientId = useMemo(() => `gradient-${Math.random().toString(36).substr(2, 9)}`, []);

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

        const resizeObserver = new ResizeObserver(updateDimensions);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    const path = useMemo(() => {
        return generateSquirclePath(dimensions.width, dimensions.height, cornerRadius);
    }, [dimensions, cornerRadius])

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
                    {Array.isArray(fill) && (
                        <defs>
                            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor={fill[0]} />
                                <stop offset="100%" stopColor={fill[1]} />
                            </linearGradient>
                        </defs>
                    )}
                    <path
                        d={path}
                        fill={dashed ? 'none' : (Array.isArray(fill) ? `url(#${gradientId})` : (fill || "#4a90e2"))}
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