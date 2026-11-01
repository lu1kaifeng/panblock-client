import React, { useRef, useState, useLayoutEffect } from 'react';
import { Text } from 'react-konva';

interface RightAlignedLabelProps {
    text: string;
    x: number;
    y: number;
    fontSize?: number;
    fontStyle?: string;
    fill?: string;
}

export const RightAlignedLabel: React.FC<RightAlignedLabelProps> = ({
                                                                        text,
                                                                        x,
                                                                        y,
                                                                        fontSize = 16,
    fontStyle = 'normal',
                                                                        fill = '#1f2937',
                                                                    }) => {
    const textRef = useRef<any>(null);
    const [width, setWidth] = useState<number>(0);

    // Automatically measures the width on mount, handling any text length effortlessly
    useLayoutEffect(() => {
        if (textRef.current) {
            setWidth(textRef.current.width());
        }
    }, [text]);

    return (
        <Text
            ref={textRef}
            text={text}
            x={x}
            y={y}
            offsetX={width} // Automatically shifts the text box left by its exact measured width
            fontSize={fontSize}
            fontStyle={fontStyle}
            fill={fill}

        />
    );
};