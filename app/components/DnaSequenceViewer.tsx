import React, {useState, useCallback, useMemo, useEffect, type Dispatch, useRef} from 'react';
import {Stage, Layer, Line, Text, Rect, Group, Path} from 'react-konva';
import { ZoomIn, ZoomOut, RotateCcw, MoveHorizontal } from 'lucide-react';
import Konva from 'konva';
import {Contig, Link, SynBlock, Tracer} from "~/data/SynBlock";
import {getColor, getVerticalRibbonPath} from "~/data/utils";
import {RightAlignedLabel} from "~/components/RightAlignedLabel";
import {Tooltip} from "~/components/ToolTip";
import type {KonvaEventObject} from "konva/lib/Node";
import type {IDBPDatabase, IDBPTransaction} from "idb";
import type {PanblockDB} from "~/data/db";
import {ContigLabels} from "~/components/ContigLabels";

interface GenomicFeature {
    id: string;
    name: string;
    startKbp: number; // Position in kilobases
    endKbp: number;   // Position in kilobases
    color: string;
}

interface GenomeBrowserProps {
    totalKbp?: number; // 50,000 Kbp = 50 Mb max scale
    features?: GenomicFeature[];
    width?: number;
    height?: number;
    setHeight: Dispatch<React.SetStateAction<number>>;
    initialKbpPerPx?: number;
    contigs: Contig[];
    links: Link[][];
    blocks: SynBlock[][];
    tracers: Tracer[];
    contigList: Contig[];
    //db?: IDBPDatabase<PanblockDB>
}

interface TooltipData {
    x: number;
    y: number;
    content: string;
}

const DEFAULT_FEATURES: GenomicFeature[] = [
    { id: '1', name: 'Gene Cluster A', startKbp: 4000, endKbp: 11000, color: '#4F46E5' }, // 4Mb - 11Mb
    { id: '2', name: 'Structural Variant Region', startKbp: 18000, endKbp: 28000, color: '#10B981' }, // 18Mb - 28Mb
    { id: '3', name: 'Kinase Superfamily', startKbp: 36000, endKbp: 44000, color: '#EF4444' }, // 36Mb - 44Mb
];

export const GenomeBrowser: React.FC<GenomeBrowserProps> = ({
                                                                totalKbp = 50000, // 50 Megabases max scale
                                                                features = DEFAULT_FEATURES,
                                                                width = 800,
                                                                height = 380,
                                                                initialKbpPerPx = 70, // Default zoom: 1 px = 70 kb (~50 Mb fits across ~714px)
                                                                             contigs = [],links = [],blocks = [],tracers = [],contigList,setHeight
}) => {
    const [kbpPerPx, setKbpPerPx] = useState<number>(initialKbpPerPx);
    const [stageX, setStageX] = useState<number>(0);
    const [blockInFocus, setBlockInFocus] = useState<SynBlock | null>(null);
    const [tooltip, setTooltip] = useState<TooltipData | null>(null);
    // Position bubble safely ABOVE the clicked rectangle to prevent covering it
    const handleRectClick = (posX: number, posY: number,block: SynBlock) => {
        setTooltip(null)
        setBlockInFocus(null)
        if(blockInFocus === block) return;
        setBlockInFocus(block);
        setTooltip({
            x: posX,
            y: posY - 52, // 52px gap above the rect (bubble height is 40px, leaves a clean 12px margin)
            content: `${block.line}:${block.startBp.bp}-${block.endBp.bp} id:${block.id}`,
        });
    };

    const { coFocusLinks, coFocusBlocks } = useMemo(() => {
        if(blockInFocus){
            //console.log(tracers)
            let coFocus1 = tracers.flatMap( t=>
                t.byToBlockId[blockInFocus.id]
            ).filter(f=>f != undefined)//.map(t=>t[1])
            //console.log(coFocus1)
            let coFocus1links = coFocus1.map(c=>c[0])
            let coFocus1Blocks = coFocus1.map(t=>t[1])
            let coFocus2 = tracers.flatMap( t=>
                t.byFromBlockId[blockInFocus.id]
            ).filter(f=>f != undefined)//.map(t=>t[2])
            let coFocus2links = coFocus2.map(c=>c[0])
            let coFocus2Blocks = coFocus2.map(t=>t[2])
            /*console.log({coFocusLinks:coFocus1links.concat(coFocus2links),
                coFocusBlocks: coFocus1Blocks.concat(coFocus2Blocks)})*/

            if(blockInFocus.originBlock != undefined){
                coFocus1Blocks = coFocus1Blocks.concat(blocks.flatMap(b=>b)
                    .filter(b=>b.originBlock === blockInFocus.originBlock|| b.id ===blockInFocus.originBlock)
                    .map(b=>b.id))
            }else{
                coFocus1Blocks = coFocus1Blocks.concat(blocks.flatMap(b=>b)
                    .filter(b=>b.originBlock === blockInFocus.id || b.id === blockInFocus.id)
                    .map(b=>b.id))
            }

            return {coFocusLinks:coFocus1links.concat(coFocus2links),
            coFocusBlocks: coFocus1Blocks.concat(coFocus2Blocks)}
        }else{
            return {coFocusLinks:[],
                coFocusBlocks: []}
        }
    }, [blockInFocus,tracers]);

    const marginX = 10//60;
    const scaleY = 60;
    const sampleHeight = 26
    const YSpacing = 70
    const labelWidth = 60
    useEffect(() => {
        if(contigs.length == 0){
            setHeight(()=>sampleHeight+YSpacing+scaleY)
        }else{
            setHeight(()=>sampleHeight*contigs.length +YSpacing*contigs.length +scaleY)
        }
    }, [contigs]);


    const minKbpPerPx = 0.5;  // High zoom-in detail level
    const maxKbpPerPx = 150;  // Wide overview level
    const viewportWidth = width - labelWidth;
    const totalWidthPx = totalKbp / kbpPerPx;
    const minX = Math.min(0, width - (totalWidthPx + marginX * 2));
    const maxX = 0;

    const clampX = (x: number, resolution = kbpPerPx) => {
        const contentWidth = totalKbp / resolution + marginX * 2;
        const minX = Math.min(0, viewportWidth - contentWidth);
        return Math.max(minX, Math.min(0, x));
    };
    const handleZoom = (zoomFactor: number) => {
        const nextKbpPerPx = Math.max(
            minKbpPerPx,
            Math.min(maxKbpPerPx, kbpPerPx / zoomFactor),
        );

        let nextStageX = stageX;

        if (blockInFocus) {
            const rowIndex = blocks.findIndex((row) => row?.includes(blockInFocus));
            const contig = contigs[rowIndex];

            if (contig) {
                const startKbp = contig.startBp.kBp + blockInFocus.startBp.kBp;
                const widthKbp = blockInFocus.endBp.kBp - blockInFocus.startBp.kBp;
                const midpointX = marginX + (startKbp + widthKbp / 2) / nextKbpPerPx;

                nextStageX = viewportWidth / 2 - midpointX;

                setTooltip((prev) =>
                    prev ? { ...prev, x: marginX + startKbp / nextKbpPerPx } : prev,
                );
            }
        }

        setKbpPerPx(nextKbpPerPx);
        setStageX(clampX(nextStageX, nextKbpPerPx));
    };

    const previousPinchDistance = useRef<number | null>(null);

    const handleTouchMove = (e: Konva.KonvaEventObject<TouchEvent>) => {
        const touches = e.evt.touches;
        if (touches.length !== 2) return;

        if (e.evt.cancelable) e.evt.preventDefault();

        // Pause Konva's one-finger drag while two fingers are on the canvas.
        const group = e.target.getStage()?.findOne('#genome-pan-group');
        group?.stopDrag();

        const [first, second] = [touches[0], touches[1]];
        const distance = Math.hypot(
            second.clientX - first.clientX,
            second.clientY - first.clientY,
        );

        const previousDistance = previousPinchDistance.current;
        previousPinchDistance.current = distance;

        if (previousDistance !== null && previousDistance > 0 && distance > 0) {
            handleZoom(distance / previousDistance);
        }
    };

    const resetPinch = () => {
        previousPinchDistance.current = null;
    };

    const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
        e.evt.preventDefault();
        if (e.evt.ctrlKey || e.evt.metaKey) {
            const zoomFactor = e.evt.deltaY < 0 ? 1.15 : 0.85;
            handleZoom(zoomFactor);
        } else {
            const delta = e.evt.deltaX || e.evt.deltaY;
            setStageX((prevX) => clampX(prevX - delta));
        }
    };

    const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
        setStageX(clampX(e.target.x()));
        e.target.y(0);
    };
    // Adaptive tick intervals adjusted for up to 50 Mb scale
    const tickIntervalKbp = useMemo(() => {
        const rawSpan = kbpPerPx * 120;
        if (rawSpan > 25000) return 10000; // every 10 Mb
        if (rawSpan > 12000) return 5000;  // every 5 Mb
        if (rawSpan > 5000) return 2000;   // every 2 Mb
        if (rawSpan > 2500) return 1000;   // every 1 Mb
        if (rawSpan > 1000) return 500;    // every 500 kb
        if (rawSpan > 400) return 200;     // every 200 kb
        return 100;                        // every 100 kb
    }, [kbpPerPx]);

    const ticks = useMemo(() => {
        const items = [];
        for (let kbp = 0; kbp <= totalKbp; kbp += tickIntervalKbp) {
            items.push(kbp);
        }
        return items;
    }, [totalKbp, tickIntervalKbp]);

    const formatLabel = (kbp: number) => {
        const pixelGap = tickIntervalKbp / kbpPerPx;

        // Dynamically skip labels if the space between ticks is too narrow
        const skipFactor = pixelGap < 45 ? 4 : pixelGap < 75 ? 2 : 1;
        const tickIndex = Math.round(kbp / tickIntervalKbp);

        if (kbp > 0 && tickIndex % skipFactor !== 0) {
            return ''; // Hide overlapping label text while leaving the tick mark
        }

        if (kbp >= 1000 && kbp % 1000 === 0) {
            return `${kbp / 1000}Mb`;
        }
        return `${kbp}kb`;
    };

    return (
        <div style={{ display: 'inline-block', fontFamily: 'sans-serif', margin:'0px', padding: '0px' }}>
            {/* Control Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <button
                    onClick={() => handleZoom(1.25)}
                    style={{ padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #D1D5DB', borderRadius: '4px', background: '#FFF' }}
                >
                    <ZoomIn size={16} /> Zoom In
                </button>
                <button
                    onClick={() => handleZoom(0.8)}
                    style={{ padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #D1D5DB', borderRadius: '4px', background: '#FFF' }}
                >
                    <ZoomOut size={16} /> Zoom Out
                </button>
                <button
                    onClick={() => { setKbpPerPx(initialKbpPerPx); setStageX(0); }}
                    style={{ padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #D1D5DB', borderRadius: '4px', background: '#FFF' }}
                >
                    <RotateCcw size={16} /> Reset
                </button>

                <span style={{ fontSize: '12px', color: '#6B7280', marginLeft: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <MoveHorizontal size={14} /> Drag to pan (0 - 50 Mb)
        </span>

                <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#6B7280' }}>
          Resolution: <strong>{kbpPerPx.toFixed(1)} kb/px</strong>
        </span>
            </div>
<div style={{display:'flex'}}>
            {/* Canvas Viewport */}
            <ContigLabels samples={contigs} width={labelWidth} height={height} />
            <Stage
                width={viewportWidth}
                height={height}
                onWheel={handleWheel}
                onTouchMove={handleTouchMove}
                onTouchEnd={resetPinch}
                onTouchCancel={resetPinch}
                onClick={()=>{
                    setTooltip(null)
                    setBlockInFocus(null)
                }}
                onTap={()=>{
                    setTooltip(null)
                    setBlockInFocus(null)
                }}
                style={{ background: '#F9FAFB', borderRadius: '6px', overflow: 'hidden', cursor: 'grab',touchAction: 'none' }}
            >
                <Layer>
                    <Group
                        draggable
                        x={stageX}
                        y={0}
                        onDragMove={handleDragMove}
                        dragBoundFunc={(pos) => ({ x: clampX(pos.x), y: 0 })}
                    >
                        {/* Background Hit-Area Rect for Panning */}
                        <Rect x={0} y={0} width={Math.max(width, totalWidthPx + marginX * 2)} height={height} fill="transparent" />

                        {/* Main Axis Line spanning 0 to 50 Mb */}
                        <Line
                            points={[marginX, scaleY, marginX + totalWidthPx, scaleY]}
                            stroke="#374151"
                            strokeWidth={2}
                        />

                        {/* Scale Ticks and Labels up to 50 Mb */}
                        {ticks.map((kbp) => {
                            const x = marginX + kbp / kbpPerPx;
                            return (
                                <Group key={`tick-${kbp}`}>
                                    <Line points={[x, scaleY - 6, x, scaleY + 6]} stroke="#374151" strokeWidth={1.5} />
                                    <Text
                                        x={x - 30}
                                        y={scaleY - 24}
                                        text={formatLabel(kbp)}
                                        fontSize={11}
                                        fill="#4B5563"
                                        width={60}
                                        align="center"
                                    />
                                </Group>
                            );
                        })}
                        {/* Genomic Features placed relative to 50 Mb scale */}
                        {
                            contigs.map((feature, idx) => {
                                const featureX = marginX + feature.startBp.kBp / kbpPerPx;
                                const featureWidth = (feature.endBp.kBp - feature.startBp.kBp) / kbpPerPx;
                                const featureY = scaleY + 35 + idx * YSpacing;
                                const nextFeatureY = scaleY + 35 + (idx+1) * YSpacing;
                                //console.log(blocks)
                                return (
                                    <Group key={`contig-${idx}`}>
                                        <Rect
                                        x={featureX}
                                        y={featureY}
                                        width={Math.max(3, featureWidth)}
                                        height={sampleHeight}
                                        fill={'lightgrey'}
                                        cornerRadius={4}
                                    />
                                        {/*<RightAlignedLabel
                                            x={featureX - 6}
                                            y={featureY + 6}
                                            text={`${feature.line}`}
                                            /*text={`${feature.line} (${formatLabel(feature.startBp.kBp)} - ${formatLabel(feature.endBp.kBp)})`}* /
                                            fontSize={11}
                                            fontStyle="bold"
                                            fill="#000000"
                                        />*/}
                                        {


                                            blocks[idx]?.map((b,bid)=>{
                                                const x = featureX+ b.startBp.kBp / kbpPerPx
                                                const y= featureY
                                                const coFocus = coFocusBlocks.includes(b.id) || blockInFocus === b
                                                return (
                                                <Rect
                                                    key={`contig-${idx}-block-${bid}`}
                                                    x={x}
                                                    y={y}
                                                    // Bright outer border when focused, hidden otherwise
                                                    stroke={(coFocus ) ? '#ffffff' : 'transparent'}
                                                    strokeWidth={(coFocus ) ? 3 : 0}

                                                    // Enhanced shadow glow when focused
                                                    //shadowColor={(coFocus ) ? '#2563eb' : '#000000'}
                                                    //shadowBlur={(coFocus ) ? 16 : 6}
                                                    //shadowOpacity={(coFocus ) ? 0.6 : 0.15}
                                                    //shadowOffsetY={(coFocus ) ? 4 : 2}
                                                    width={(b.endBp.kBp - b.startBp.kBp) / kbpPerPx}
                                                    height={sampleHeight}
                                                    fill={getColor(b,contigList,feature,'#000000')}
                                                    //cornerRadius={4}
                                                    onClick={(e)=>{
                                                        e.cancelBubble = true;
                                                        handleRectClick(x,y,b)}}
                                                    onTap={(e) => {
                                                        e.cancelBubble = true;
                                                        handleRectClick(x, y, b);
                                                    }}
                                                />
                                            )})
                                        }
                                    </Group>
                                );
                            })}
                        {/* Genomic Features placed relative to 50 Mb scale */}
                        {
                            contigs.map((feature, idx) => {
                            const featureX = marginX + feature.startBp.kBp / kbpPerPx;
                            const featureWidth = (feature.endBp.kBp - feature.startBp.kBp) / kbpPerPx;
                            const featureY = scaleY + 35 + idx * YSpacing;
                            const nextFeatureY = scaleY + 35 + (idx+1) * YSpacing;
                            return (
                                <Group key={`${idx}-links`}>
                                    {idx < links.length ? links[idx]?.map((synBlock, i) =>  (<Group
                                            key={`${idx}-links-${i}`}
                                        >

                                            {/*<Rect

                                                x={featureX+ synBlock.from[0].kBp / kbpPerPx}
                                                y={featureY}
                                                width={(synBlock.from[1].kBp - synBlock.from[0].kBp) / kbpPerPx}
                                                height={26}
                                                fill={synBlock.fromLine.color+"C0"}
                                                cornerRadius={4}
                                            />*/}
                                            {/*<Line
                                                stroke="grey"
                                                strokeWidth={1}
                                                cornerRadius={20}
                                                lineCap="round"
                                                lineJoin="round"
                                                tension={0.1}
                                                points={[featureX+ synBlock.from[0].kBp / kbpPerPx + (synBlock.from[1].kBp - synBlock.from[0].kBp) / kbpPerPx / 2,featureY+26,

                                                featureX+ synBlock.to[0].kBp / kbpPerPx + (synBlock.to[1].kBp - synBlock.to[0].kBp) / kbpPerPx / 2,nextFeatureY]} />*/}

                                        <Path

                                            data={getVerticalRibbonPath(featureY+sampleHeight,featureX+ synBlock.from[0].kBp / kbpPerPx,featureX+ synBlock.from[0].kBp / kbpPerPx + (synBlock.from[1].kBp - synBlock.from[0].kBp) / kbpPerPx,nextFeatureY,featureX+ synBlock.to[0].kBp / kbpPerPx,featureX+ synBlock.to[0].kBp / kbpPerPx + (synBlock.to[1].kBp - synBlock.to[0].kBp) / kbpPerPx)}
                                            fill={coFocusLinks.includes(synBlock.id) ? 'rgba(218, 224, 72, 0.25)' : !synBlock.ifReversed?'rgba(150, 150, 150, 0.25)':'rgba(72, 192, 114,0.25)'}
                                            stroke={coFocusLinks.includes(synBlock.id) ? 'rgba(218, 224, 72, 0.25)' : !synBlock.ifReversed?'rgba(150, 150, 150, 0.25)':'rgba(72, 192, 114,0.25)'}
                                            strokeWidth={1}
                                        />
                                            {/*<Rect

                                                x={featureX+ synBlock.to[0].kBp / kbpPerPx}
                                                y={nextFeatureY}
                                                width={(synBlock.to[1].kBp - synBlock.to[0].kBp) / kbpPerPx}
                                                height={26}
                                                fill={synBlock.toLine.color+"C0"}
                                                cornerRadius={4}
                                            />*/}
                                        </Group>)

                                    ):(<Group key={`${idx}-links`}></Group>)}
                                </Group>
                            );
                        })}
                        {/* --- 5. Pop-out Info Bubble Component --- */}
                        {tooltip && (
                            <Tooltip
                                x={tooltip.x}
                                y={tooltip.y}
                                content={tooltip.content}
                            />
                        )}
                    </Group>

                </Layer>
            </Stage>
</div>
        </div>
    );
};

export default GenomeBrowser;