import React from 'react';
import { Stage, Layer, Group, Rect, Text } from 'react-konva';
import { Contig } from '~/data/SynBlock';
import type {BlockRange} from "~/data/RangeFinder";

/*export interface CroppedSectionLabelItem {
    contigIndex: number;
    contig: Contig & { color?: string };
    windowStartKbp: number;
    windowEndKbp: number;
    spanKbp: number;
}*/

interface ContigSectionLabelsProps {
    ranges: BlockRange[][];
    contigs: Contig[];
    labelWidth: number;
    dynamicHeight: number;
    scaleY: number;
    rowSpacing: number;
    formatCoord?: (kbp: number,unit?:boolean) => string;
}

export const ContigSectionLabels: React.FC<ContigSectionLabelsProps> = ({
                                                                                        ranges,
    contigs,
                                                                                        labelWidth,
                                                                                        dynamicHeight,
                                                                                        scaleY,
                                                                                        rowSpacing,
                                                                                        formatCoord = (kbp,unit=true)=>`${(kbp / 1000_000).toFixed(2)}${unit?'MBp':''}`,
                                                                                    }) => {
    const padX = 10;
    const contentWidth = Math.max(40, labelWidth - padX * 2);
    const barHeight = 7;
    if(ranges.length == 0 || contigs.length == 0) {return (<></>)}
    return (
        <Stage
            width={labelWidth}
            height={dynamicHeight}
            style={{
                flexShrink: 0,
                background: '#F3F4F6',
                borderRight: '1px solid #E5E7EB',
                userSelect: 'none',
            }}
        >
            <Layer>
                {/* Header */}
                <Text
                    x={padX}
                    y={14}
                    width={contentWidth}
                    text="CROPPED SECTION"
                    fontSize={10}
                    fontStyle="bold"
                    fill="#6B7280"
                    align="right"
                />

                {contigs.map((contig, idx) => {
                    const topY = scaleY + idx * rowSpacing - 12;
                    const contigStart = contig.startBp?.bp ?? 0;
                    const contigEnd = contig.endBp?.bp
                    const totalContigSpan = Math.max(1, contigEnd - contigStart);
                    const barY = topY + 21;


                    return (
                        <Group key={`label-line-${idx}`}>
                            {/* Contig Line Name */}
                            <Text
                                x={padX}
                                y={topY + 1}
                                width={60}
                                text={contig.line}
                                fontSize={12}
                                fontStyle="bold"
                                fill="#111827"
                                align="left"
                                ellipsis
                            />

                            {/* Percentage Pill Badge
                            <Rect
                                x={badgeX}
                                y={topY}
                                width={badgeWidth}
                                height={badgeHeight}
                                fill="#E0E7FF"
                                cornerRadius={3}
                            />
                            <Text
                                x={badgeX}
                                y={topY + 2.5}
                                width={badgeWidth}
                                text={pctText}
                                fontSize={9}
                                fontStyle="bold"
                                fill="#3730A3"
                                align="center"
                            />*/}

                            {/* Mini Full-Chromosome Locator Track */}
                            <Rect
                                x={padX}
                                y={barY}
                                width={contentWidth}
                                height={barHeight}
                                fill="#D1D5DB"
                                stroke="#9CA3AF"
                                strokeWidth={1}
                                cornerRadius={4}
                            />
                            {ranges[idx].map((v, i) => {
                                const pctStart = Math.max(
                                    0,
                                    Math.min(1, (v.span[0] - contigStart) / totalContigSpan)
                                );
                                //console.log(v.span[0],contigStart,totalContigSpan)
                                const pctWidth = Math.max(
                                    0.06,
                                    Math.min(1 - pctStart, (v.span[1] - v.span[0]) / totalContigSpan)
                                );
                                const pctWhole = Math.round(((v.span[1] - v.span[0]) / totalContigSpan) * 100);
                                const pctText = `${pctWhole}%`;

                                // Approximate badge width & position so contig line sits right next to it
                                //const badgeWidth = Math.max(28, pctText.length * 6.5 + 10);
                                const badgeHeight = 14;
                                //const badgeX = padX + contentWidth - badgeWidth;
                                //const lineMaxWidth = Math.max(20, contentWidth - badgeWidth - 6);


                                const sliceX = padX + pctStart * contentWidth;
                                const sliceW = Math.max(3, pctWidth * contentWidth);
                                return (<React.Fragment key={`side-label-${idx}-${i}`}>
                                    {/* Highlighted Cropped Window Slice */}
                                    <Rect
                                        x={sliceX}
                                        y={barY}
                                        width={sliceW}
                                        height={barHeight}
                                        fill={contig.color || '#4F46E5'}
                                        cornerRadius={2}
                                    />


                                </React.Fragment>)
                            })}
                            {/* Cropped Coordinate Range */}
                            <Text
                                x={padX}
                                y={barY + barHeight + 4}
                                width={contentWidth}
                                text={ranges[idx].map(r=>`${formatCoord(r.span[0],false)}-${formatCoord(r.span[1],false)}`).join(',')+'Mbp'}
                                fontSize={10}
                                fontFamily="monospace"
                                fontStyle="bold"
                                fill="#374151"
                                align="right"
                            />

                            {/* Total Chromosome Length */}
                            <Text
                                x={padX}
                                y={barY + barHeight + 17}
                                width={contentWidth}
                                text={`of ${formatCoord(contigEnd)} total`}
                                fontSize={9}
                                fill="#6B7280"
                                align="right"
                            />
                        </Group>
                    );
                })}
            </Layer>
        </Stage>
    );
};