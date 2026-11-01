import React from 'react';
import { Stage, Layer, Group, Wedge, Text } from 'react-konva';

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

    // Calculate total sum of values
    const total = data.reduce((sum, item) => sum + item.value, 0);

    // Track cumulative angle as we iterate over slices
    let cumulativeAngle = 0;

    return (
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

                    return (
                        <Group key={`${item.label}-${index}`}>
                            {/* Pie Slice */}
                            <Wedge
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
                            <Text
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
                            />
                        </Group>
                    );
                })}
            </Layer>
        </Stage>
    );
};