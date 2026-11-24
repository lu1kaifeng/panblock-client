import React from "react";
import { Group, Rect, Text } from "react-konva";

interface TooltipProps {
    x: number;
    y: number;
    content: string;
    width?: number;
    height?: number;
    onViewDetails: () => void;
}

export const Tooltip: React.FC<TooltipProps> = ({
                                                    x,
                                                    y,
                                                    content,
                                                    width = 200,
                                                    height = 40,
                                                    onViewDetails,
                                                }) => {
    const padding = 12;
    const buttonHeight = 32;
    const innerWidth = width - 2 * padding;

    // `height` is the space reserved for the original tooltip text.
    const totalHeight = height + buttonHeight + padding;

    return (
        <Group x={x} y={y}>
            <Rect
                width={width}
                height={totalHeight}
                fill="#1f2937"
                cornerRadius={6}
                shadowColor="black"
                shadowBlur={10}
                shadowOpacity={0.3}
            />

            <Text
                x={padding}
                y={padding}
                width={innerWidth}
                height={height - padding}
                text={content}
                fill="#f9fafb"
                fontSize={13}
                listening={false}
            />

            <Group
                x={padding}
                y={height}
                onClick={(e) => {
                    e.cancelBubble = true;
                    onViewDetails();
                }}
                onTap={(e) => {
                    e.cancelBubble = true;
                    onViewDetails();
                }}
            >
                <Rect
                    width={innerWidth}
                    height={buttonHeight}
                    fill="#2563eb"
                    cornerRadius={5}
                />
                <Text
                    width={innerWidth}
                    height={buttonHeight}
                    text="View block details"
                    align="center"
                    verticalAlign="middle"
                    fontSize={13}
                    fill="white"
                    listening={false}
                />
            </Group>
        </Group>
    );
};