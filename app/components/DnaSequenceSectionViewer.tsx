import React, {useState, useCallback, useMemo, useEffect, type Dispatch, useRef} from 'react';
import {Stage, Layer, Line, Text, Rect, Group, Path} from 'react-konva';
import { ZoomIn, ZoomOut, RotateCcw, MoveHorizontal } from 'lucide-react';
import Konva from 'konva';
import {BpPos, Contig, Link, SynBlock, Tracer} from "~/data/SynBlock";
import {getColor, getJaggedEdgePath, getVerticalRibbonPath} from "~/data/utils";
import {RightAlignedLabel} from "~/components/RightAlignedLabel";
import {Tooltip} from "~/components/ToolTip";
import type {KonvaEventObject} from "konva/lib/Node";
import type {IDBPDatabase, IDBPTransaction} from "idb";
import type {PanblockDB} from "~/data/db";
import {ContigLabels} from "~/components/ContigLabels";
import {useHref, useNavigate} from "react-router";
import {openBlockPopup} from "~/pages/BlockDetailDialog";
import {trace} from "~/components/DnaSequenceViewer";
import type {BlockRange} from "~/data/RangeFinder";
import {ContigSectionLabels} from "~/components/ContigSectionLabels";
interface GenomicFeature {
    id: string;
    name: string;
    startKbp: number; // Position in kilobases
    endKbp: number;   // Position in kilobases
    color: string;
}

export interface GenomeSectionBrowserProps {
    totalKbp?: number; // 50,000 Kbp = 50 Mb max scale
    features?: GenomicFeature[];
    width?: number;
    height?: number;
    setHeight: Dispatch<React.SetStateAction<number>>;
    initialKbpPerPx?: number;
    contigs: Contig[];
    links: Link[][];
    blocks: SynBlock[][];
    ranges: BlockRange[][];
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

export const GenomeSectionBrowser: React.FC<GenomeSectionBrowserProps> = ({
                                                                totalKbp = 50000, // 50 Megabases max scale
                                                                features = DEFAULT_FEATURES,
                                                                width = 800,
                                                                height = 380,
                                                                initialKbpPerPx = 70, // Default zoom: 1 px = 70 kb (~50 Mb fits across ~714px)
                                                                             contigs = [],links = [],blocks = [],ranges= [],setHeight
}) => {
    const [kbpPerPx, setKbpPerPx] = useState<number>(initialKbpPerPx);
    const [stageX, setStageX] = useState<number>(0);
    const [blockInFocus, setBlockInFocus] = useState<SynBlock | null>(null);
    const [tooltip, setTooltip] = useState<TooltipData | null>(null);
    const detailHref = useHref('/detail')
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
    const navigate = useNavigate();

    const marginX = 30//60;
    const marginRange = 30;
    const scaleY = 60;
    const sampleHeight = 26
    const YSpacing = 70
    const labelWidth = 160
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
    const tickIntervalKbp = (kbpPerPx:number) => {
        const rawSpan = kbpPerPx * 120;
        if (rawSpan > 25000) return 10000; // every 10 Mb
        if (rawSpan > 12000) return 5000;  // every 5 Mb
        if (rawSpan > 5000) return 2000;   // every 2 Mb
        if (rawSpan > 2500) return 1000;   // every 1 Mb
        if (rawSpan > 1000) return 500;    // every 500 kb
        if (rawSpan > 400) return 200;     // every 200 kb
        return 100;                        // every 100 kb
    };

    const formatLabel = (kbp: number,tickIntervalKbp: number,kbpPerPx:number) => {
        const pixelGap = tickIntervalKbp / kbpPerPx;

        // Dynamically skip labels if the space between ticks is too narrow
        const skipFactor = pixelGap < 45 ? 4 : pixelGap < 75 ? 2 : 1;
        const tickIndex = Math.round(kbp / tickIntervalKbp);

        if (kbp > 0 && tickIndex % skipFactor !== 0) {
            return ''; // Hide overlapping label text while leaving the tick mark
        }

        if (kbp >= 1000 && kbp % 1000 === 0) {
            return `${(kbp / 1000).toFixed(2)}Mb`;
        }
        return `${kbp.toFixed(2)}kb`;
    };

    const rulerTicks = (startKbp: number, lenKbp:number,kbpPerPx:number) => {
        let interval = tickIntervalKbp(kbpPerPx)

        const items = [];
        for (let kbp = startKbp; kbp <= startKbp+lenKbp; kbp += interval) {
            items.push(kbp);
        }
        return items;
    }

    const translate = (ranges:BlockRange[], num:number):number | undefined=>{
        let prevRange = 0;
        let featureX = marginX
        for(let r of ranges){
            if(r.span[0] <= num && num <= r.span[1]  ){
                return ranges.indexOf(r)== 0?featureX+(num - r.span[0]) / 1000 / kbpPerPx:featureX + prevRange / 1000 / kbpPerPx + marginRange + (num - r.span[0]) / 1000 / kbpPerPx;
            }else{
                prevRange +=r.span[1] -  r.span[0]
            }
        }
        return undefined
    }

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
            <ContigSectionLabels contigs={contigs} ranges={ranges} labelWidth={labelWidth} scaleY={scaleY} rowSpacing={YSpacing}  dynamicHeight={height} />
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

                        {/* Genomic Features placed relative to 50 Mb scale */}
                        {
                            contigs.map((feature, idx) => {
                                const featureX = marginX //+ feature.startBp.kBp / kbpPerPx;
                                const featureWidth = (feature.endBp.kBp - feature.startBp.kBp) / kbpPerPx;
                                const featureY = scaleY  + idx * YSpacing;
                                const nextFeatureY = scaleY  + (idx+1) * YSpacing;
                                let prevRange = 0;
                                //console.log(blocks)
                                return (
                                    <Group key={`contig-${idx}`}>
                                        {

                                            ranges[idx]?.map((r,rid)=>{

                                                if(rid != 0)prevRange +=ranges[idx][rid - 1].span[1] -  ranges[idx][rid - 1].span[0]
                                                const ticks = rulerTicks(r.span[0] / 1000,(r.span[1] - r.span[0]) / 1000,kbpPerPx)
                                                const x = rid == 0?featureX:featureX + prevRange / 1000 / kbpPerPx + marginRange
                                                const y= featureY
                                                const len = (r.span[1] - r.span[0]) / 1000/ kbpPerPx
                                                //console.log(r,rid,prevRange,'x',x)
                                                return (<React.Fragment key={`contig-${idx}-range-${rid}`}>
                                                    <Line points={[x - marginRange *0.4, y + sampleHeight / 2,x,  y + sampleHeight / 2]} stroke={'#9CA3AF'} strokeWidth={2} dash={[3,3]}/>
                                                    <Line points={[x+len,  y + sampleHeight / 2,x+len+marginRange * 0.4 ,y + sampleHeight / 2,]} stroke={'#9CA3AF'} strokeWidth={2} dash={[3,3]}/>
                                                    <Group>
                                                    {ticks.map((tickKbp, idxt)=>{
                                                        const tx = x + (tickKbp - r.span[0] / 1000) / kbpPerPx;
                                                        const isFirst = idxt === 0;
                                                        const isLast = idxt === ticks.length - 1;
                                                        const isEdge = isFirst || isLast;
                                                        //console.log('first',isFirst,'last',isLast)
                                                        const label = formatLabel(tickKbp,tickIntervalKbp(kbpPerPx),kbpPerPx)
                                                        const labelWidth = 72;

                                                        const labelX = isFirst
                                                            ? tx
                                                            : isLast
                                                                ? tx - labelWidth
                                                                : tx - labelWidth / 2;
                                                        return (<React.Fragment key={`contig-${idx}-tick-${idxt}`}>
                                                            <Line points={[tx, y - (isEdge ? 7 : 5), tx, y]} stroke={isEdge ? '#374151' : '#9CA3AF'} strokeWidth={isEdge ? 1.5 : 1}/>
                                                            <Text x={labelX} y ={y - 21} width={labelWidth} text={label} fontSize={11} fontStyle={isEdge ? 'bold' : 'normal'} fill={isEdge ? '#111827' : '#6B7280'} align={isFirst ? 'left' : isLast ? 'right' : 'center'}/>
                                                        </React.Fragment>)
                                                    })}</Group>
                                                    <Rect x={x} y={y} width={len} height={sampleHeight} fill={'#E5E7EB'} stroke={'#9CA3AF'} strokeWidth={1}/>
                                                    <Path data={getJaggedEdgePath(x,y,sampleHeight,"left")} stroke={'#374151'}
                                                    strokeWidth={2} lineJoin={"round"}
                                                    />
                                                    <Path data={getJaggedEdgePath(x+len,y,sampleHeight,"right")} stroke={'#374151'}
                                                          strokeWidth={2} lineJoin={"round"}
                                                    />
                                                    {
                                                        [...r.blocks].map((b,bidx)=>{
                                                            return (<React.Fragment key={`contig-${idx}-range-${rid}-block-${bidx}`}>
                                                                <Rect
                                                                    x={x+(b.startBp.bp - r.span[0]) / 1000 / kbpPerPx}
                                                                    y={y}
                                                                    // Bright outer border when focused, hidden otherwise
                                                                    stroke={ 'transparent'}
                                                                    strokeWidth={ 0}

                                                                    // Enhanced shadow glow when focused
                                                                    //shadowColor={(coFocus ) ? '#2563eb' : '#000000'}
                                                                    //shadowBlur={(coFocus ) ? 16 : 6}
                                                                    //shadowOpacity={(coFocus ) ? 0.6 : 0.15}
                                                                    //shadowOffsetY={(coFocus ) ? 4 : 2}
                                                                    width={(b.endBp.kBp - b.startBp.kBp) / kbpPerPx}
                                                                    height={sampleHeight}
                                                                    fill={getColor(b,contigs,feature,'#000000')}
                                                                    //cornerRadius={4}
                                                                    onClick={(e)=>{
                                                                        e.cancelBubble = true;
                                                                        handleRectClick(x,y,b)}}
                                                                    onTap={(e) => {
                                                                        e.cancelBubble = true;
                                                                        handleRectClick(x, y, b);
                                                                    }}
                                                                />
                                                            </React.Fragment>)
                                                        })
                                                    }

                                                </React.Fragment>)
                                            })
                                        }


                                        {/*blocks[idx]?.map((b,bid)=>{
                                                const x = featureX+ b.startBp.kBp / kbpPerPx
                                                const y= featureY
                                                return (
                                                <Rect
                                                    key={`contig-${idx}-block-${bid}`}
                                                    x={x}
                                                    y={y}
                                                    // Bright outer border when focused, hidden otherwise
                                                    stroke={ 'transparent'}
                                                    strokeWidth={ 0}

                                                    // Enhanced shadow glow when focused
                                                    //shadowColor={(coFocus ) ? '#2563eb' : '#000000'}
                                                    //shadowBlur={(coFocus ) ? 16 : 6}
                                                    //shadowOpacity={(coFocus ) ? 0.6 : 0.15}
                                                    //shadowOffsetY={(coFocus ) ? 4 : 2}
                                                    width={(b.endBp.kBp - b.startBp.kBp) / kbpPerPx}
                                                    height={sampleHeight}
                                                    fill={getColor(b,contigs,feature,'#000000')}
                                                    //cornerRadius={4}
                                                    onClick={(e)=>{
                                                        e.cancelBubble = true;
                                                        handleRectClick(x,y,b)}}
                                                    onTap={(e) => {
                                                        e.cancelBubble = true;
                                                        handleRectClick(x, y, b);
                                                    }}
                                                />
                                            )})*/
                                        }
                                        {
                                            links[idx]?.map((l,lidx)=>{
                                                const x1Left = translate(ranges[idx],featureX+ l.from[0].bp)
                                            const x1Right = translate(ranges[idx],l.from[1].bp)
                                            const x2Left = translate(ranges[idx+1],l.to[0].bp)
                                            const x2Right = translate(ranges[idx+1],l.to[1].bp )
                                                if(x1Left == undefined || x1Right == undefined || x2Left == undefined || x2Right == undefined) return (<React.Fragment key={`contig-${idx}-link-${lidx}`}></React.Fragment>)
                                                return (<React.Fragment key={`contig-${idx}-link-${lidx}`}>
                                                    <Path

                                                        data={getVerticalRibbonPath(featureY+sampleHeight,x1Left,x1Right,nextFeatureY,x2Left,x2Right)}
                                                        fill={!l.ifReversed?'rgba(150, 150, 150, 0.25)':'rgba(72, 192, 114,0.25)'}
                                                        stroke={!l.ifReversed?'rgba(150, 150, 150, 0.25)':'rgba(72, 192, 114,0.25)'}
                                                        strokeWidth={1}
                                                    />
                                                </React.Fragment>)
                                            })
                                        }
                                    </Group>
                                );
                            })}
                        {/* Genomic Features placed relative to 50 Mb scale */}
                        {
                            /*contigs.map((feature, idx) => {
                            const featureX = marginX + feature.startBp.kBp / kbpPerPx;
                            const featureWidth = (feature.endBp.kBp - feature.startBp.kBp) / kbpPerPx;
                            const featureY = scaleY  + idx * YSpacing;
                            const nextFeatureY = scaleY  + (idx+1) * YSpacing;
                            return (
                                <Group key={`${idx}-links`}>
                                    {idx < links.length ? links[idx]?.map((synBlock, i) =>  (<Group
                                            key={`${idx}-links-${i}`}
                                        >

                                            {/!*<Rect

                                                x={featureX+ synBlock.from[0].kBp / kbpPerPx}
                                                y={featureY}
                                                width={(synBlock.from[1].kBp - synBlock.from[0].kBp) / kbpPerPx}
                                                height={26}
                                                fill={synBlock.fromLine.color+"C0"}
                                                cornerRadius={4}
                                            />*!/}
                                            {/!*<Line
                                                stroke="grey"
                                                strokeWidth={1}
                                                cornerRadius={20}
                                                lineCap="round"
                                                lineJoin="round"
                                                tension={0.1}
                                                points={[featureX+ synBlock.from[0].kBp / kbpPerPx + (synBlock.from[1].kBp - synBlock.from[0].kBp) / kbpPerPx / 2,featureY+26,

                                                featureX+ synBlock.to[0].kBp / kbpPerPx + (synBlock.to[1].kBp - synBlock.to[0].kBp) / kbpPerPx / 2,nextFeatureY]} />*!/}

                                        <Path

                                            data={getVerticalRibbonPath(featureY+sampleHeight,featureX+ synBlock.from[0].kBp / kbpPerPx,featureX+ synBlock.from[0].kBp / kbpPerPx + (synBlock.from[1].kBp - synBlock.from[0].kBp) / kbpPerPx,nextFeatureY,featureX+ synBlock.to[0].kBp / kbpPerPx,featureX+ synBlock.to[0].kBp / kbpPerPx + (synBlock.to[1].kBp - synBlock.to[0].kBp) / kbpPerPx)}
                                            fill={!synBlock.ifReversed?'rgba(150, 150, 150, 0.25)':'rgba(72, 192, 114,0.25)'}
                                            stroke={!synBlock.ifReversed?'rgba(150, 150, 150, 0.25)':'rgba(72, 192, 114,0.25)'}
                                            strokeWidth={1}
                                        />
                                            {/!*<Rect

                                                x={featureX+ synBlock.to[0].kBp / kbpPerPx}
                                                y={nextFeatureY}
                                                width={(synBlock.to[1].kBp - synBlock.to[0].kBp) / kbpPerPx}
                                                height={26}
                                                fill={synBlock.toLine.color+"C0"}
                                                cornerRadius={4}
                                            />*!/}
                                        </Group>)

                                    ):(<Group key={`${idx}-links`}></Group>)}
                                </Group>
                            );
                        })*/}
                        {/* --- 5. Pop-out Info Bubble Component --- */}
                        {tooltip && (
                            <Tooltip
                                x={tooltip.x}
                                y={tooltip.y}
                                content={tooltip.content}
                                onViewDetails={()=>openBlockPopup(detailHref,blockInFocus?.id,blockInFocus?.line,contigs.map(c=>c.idx))}
                            />
                        )}
                    </Group>

                </Layer>
            </Stage>
</div>
        </div>
    );
};

export default GenomeSectionBrowser;