import React, { useEffect, useRef } from 'react';
import { Stage, Layer, Group, Text, Arc } from 'react-konva';
import Konva from 'konva';

interface LoadingSpinnerProps {
    width: number;
    height: number;
    text: string;
}

// High-performance canvas spinner with its own independent Stage and Layer
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ width, height, text }) => {
    const arcRef = useRef<Konva.Arc>(null);
    const layerRef = useRef<Konva.Layer>(null);

    useEffect(() => {
        const layer = layerRef.current;
        if (!layer) return;

        const anim = new Konva.Animation((frame) => {
            if (arcRef.current && frame) {
                // Fixed: added missing '*' multiplication operator
                const angle = (frame.time * 0.3) % 360;
                arcRef.current.rotation(angle);
            }
        }, layer);

        anim.start();
        return () => {
            anim.stop();
        };
    }, []);

    return (
        <Stage
            width={width}
            height={height}
            style={{ background: '#F9FAFB', borderRadius: '6px', overflow: 'hidden', cursor: 'grab' }}
        >
            {/* Added Layer so Konva can render the contents and attach the animation */}
            <Layer ref={layerRef}>
                <Group x={width / 2} y={height / 2}>
                    <Arc
                        ref={arcRef}
                        innerRadius={30}
                        outerRadius={42}
                        angle={270}
                        fill="#61dafb"
                        stroke="#ffffff"
                        strokeWidth={2}
                    />
                    <Text
                        text={text}
                        y={60}
                        offsetX={45}
                        fill="#555555"
                        fontSize={13}
                        fontStyle="bold"
                        align="center"
                        width={90}
                    />
                </Group>
            </Layer>
        </Stage>
    );
};