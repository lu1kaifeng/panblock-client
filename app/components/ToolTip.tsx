import React from 'react';
import { Group, Rect, Text } from 'react-konva';

interface TooltipProps {
    x: number;
    y: number;
    content: string;
    width?: number;
    height?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
                                                    x,
                                                    y,
                                                    content,
                                                    width = 200,
                                                    height = 40,
                                                }) => {
    return (
        <Group x={x} y={y}>
            {/* Bubble Background Box */}
            <Rect
                width={width}
                height={height}
                fill="#1f2937"
                cornerRadius={6}
                shadowColor="black"
                shadowBlur={10}
                shadowOpacity={0.3}
            />
            {/* Bubble Text */}
            <Text
                x={12}
                y={12}
                text={content}
                fill="#f9fafb"
                fontSize={13}
            />
        </Group>
    );
};