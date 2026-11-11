import React from 'react';
import { Stage, Layer, Group, Wedge, Text } from 'react-konva';
import Konva from "konva";

export interface PieChartItem {
    label: string;
    value: number;
    color: string;
}

export interface PieChartProps {
    data: PieChartItem[];
    width?: number;
    height?: number;
    radius?: number;
}

export const PieChart: React.FC<PieChartProps> = ({
                                                      data,
                                                      width = 400,
                                                      height = 400,
                                                      radius = 120,
                                                  }) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const [tooltip, setTooltip] = React.useState<{
        text: string;
        x: number;
        y: number;
    } | null>(null);



    // Calculate total sum of values
    const total = data.reduce((sum, item) => sum + item.value, 0);

    // Track cumulative angle as we iterate over slices
    let cumulativeAngle = 0;

    return (<div
            style={{ position: 'relative', width, height }}
            onMouseLeave={() => setTooltip(null)}
        >
        <Stage width={width} height={height}>
            <Layer>
                {data.map((item, index) => {
                    // Calculate slice angle in degrees
                    const sliceAngle = (item.value / total) * 360;
                    const startAngle = cumulativeAngle;

                    // Angle bisector for positioning text inside the slice
                    const midAngle = startAngle + sliceAngle / 2;

                    // Increment cumulative angle for next iteration
                    cumulativeAngle += sliceAngle;

                    // Polar coordinates to Cartesian coordinates conversion
                    const labelRadius = radius * 0.65;
                    const angleInRadians = (midAngle * Math.PI) / 180;
                    const labelX = centerX + labelRadius * Math.cos(angleInRadians);
                    const labelY = centerY + labelRadius * Math.sin(angleInRadians);

                    const percentage = `${((item.value / total) * 100).toFixed(1)}%`;

                    const label = `${item.label}\n${percentage}`;

                    const labelWidth = 60;
                    const fontSize = 12;

                    const labelHeight = fontSize * 2;

                    const fitsLabel = (textHeight: number) => {
                        const inset = 2;
                        const halfWidth = labelWidth / 2 + inset;
                        const halfHeight = textHeight / 2 + inset;
                        const halfAngle = Math.min(sliceAngle, 180) * Math.PI / 360;
                        const cos = Math.cos(angleInRadians);
                        const sin = Math.sin(angleInRadians);

                        return [-halfWidth, halfWidth].every((offsetX) =>
                            [-halfHeight, halfHeight].every((offsetY) => {
                                const dx = labelX + offsetX - centerX;
                                const dy = labelY + offsetY - centerY;
                                const along = dx * cos + dy * sin;
                                const across = -dx * sin + dy * cos;

                                return (
                                    Math.hypot(dx, dy) <= radius &&
                                    Math.abs(Math.atan2(across, along)) <= halfAngle
                                );
                            }),
                        );
                    };

                    const showLabel = fitsLabel(labelHeight);

                    const showTooltip = (stage: Konva.Stage | null) => {
                        const pointer = stage?.getPointerPosition();
                        if (pointer) {
                            setTooltip({ text: label, x: pointer.x, y: pointer.y });
                        }
                    };

                    return (
                        <Group key={`${item.label}-${index}`}>
                            {/* Pie Slice */}
                            <Wedge
                                onMouseEnter={showLabel ? undefined : (event) => {
                                    showTooltip(event.target.getStage());
                                }}
                                onMouseMove={showLabel ? undefined : (event) => {
                                    showTooltip(event.target.getStage());
                                }}
                                onMouseLeave={showLabel ? undefined : () => setTooltip(null)}
                                x={centerX}
                                y={centerY}
                                radius={radius}
                                angle={sliceAngle}
                                rotation={startAngle}
                                fill={item.color}
                                stroke="#ffffff"
                                strokeWidth={2}
                            />

                            {/* Text Label */}
                            {showLabel && <Text
                                x={labelX}
                                y={labelY}
                                text={`${item.label}\n${percentage}`}
                                fontSize={12}
                                fontStyle="bold"
                                fill="#ffffff"
                                align="center"
                                offsetX={30}
                                offsetY={12}
                                width={60}
                            />}
                        </Group>
                    );
                })}
            </Layer>
        </Stage>

    {tooltip && (
        <div
            role="tooltip"
            style={{
                position: 'absolute',
                left: tooltip.x,
                top: tooltip.y,
                transform: tooltip.x > width / 2
                    ? 'translate(calc(-100% - 10px), 10px)'
                    : 'translate(10px, 10px)',
                pointerEvents: 'none',
                whiteSpace: 'pre',
                padding: '6px 8px',
                borderRadius: 4,
                background: '#1f2937',
                color: '#fff',
                fontSize: 12,
                zIndex: 1,
            }}
        >
            {tooltip.text}
        </div>
    )}</div>
    );
};