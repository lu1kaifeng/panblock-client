import React, { useRef, useState, useLayoutEffect } from 'react';
import { Text } from 'react-konva';

interface RightAlignedLabelProps {
    text: string;
    subText?: string;
    x: number;
    y: number;
}

export const RightAlignedLabel: React.FC<RightAlignedLabelProps> = ({
                                                                        text,
    subText,
                                                                        x,
                                                                        y,

                                                                    }) => {
    const textRef = useRef<any>(null);
    const [width, setWidth] = useState<number>(0);

    const fontSize = 11
    const fontStyle = 'normal'
    const fill = '#111827'
    const subFontSize = fontSize - 8
    const subY = y + fontSize
    // Automatically measures the width on mount, handling any text length effortlessly
    useLayoutEffect(() => {
        if (textRef.current) {
            setWidth(textRef.current.width());
        }
    }, [text]);

    return (
        <React.Fragment>
            <Text
                ref={textRef}
                text={text}
                x={x}
                y={y - 2}
                offsetX={width} // Automatically shifts the text box left by its exact measured width
                fontSize={fontSize}
                fontStyle={fontStyle}
                fill={fill}

            />
            {subText != undefined && (<Text offsetX={width} x={x} y={subY} fontSize={fontSize - 4} text={subText} fill={'#6B7280'}/>)}
        </React.Fragment>

    );
};