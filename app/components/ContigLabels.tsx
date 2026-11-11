import {Layer, Stage} from "react-konva";
import type {Contig} from "~/data/SynBlock";
import {RightAlignedLabel} from "~/components/RightAlignedLabel";
import React from "react";

export interface ContigLabelsProps{
    samples: Contig[]
    width: number
    height: number
}

export const ContigLabels: React.FC<ContigLabelsProps>=({samples,width,height})=>{
    const scaleY = 60;
    const YSpacing = 70

    return (<Stage
        width={width}
        height={height}
        style={{ flexShrink: 0, background: '#F9FAFB' }}
    >
        <Layer listening={false}>
            {samples.map((feature, idx) => (
                <RightAlignedLabel
                    key={`contig-label-${idx}`}
                    x={width - 6}
                    y={scaleY + 35 + idx * YSpacing + 6}
                    text={feature.line}
                    fontSize={11}
                    fontStyle="bold"
                    fill="#000000"
                />
            ))}
        </Layer>
    </Stage>)
}