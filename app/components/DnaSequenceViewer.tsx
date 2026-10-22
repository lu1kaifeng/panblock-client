import React, { useState, useCallback, useMemo } from 'react';
import { Stage, Layer, Line, Text, Rect, Group } from 'react-konva';
import { ZoomIn, ZoomOut, RotateCcw, MoveHorizontal } from 'lucide-react';
import Konva from 'konva';
import {Contig, Samples, SynBlock} from "~/models/SynBlock";

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
    initialKbpPerPx?: number;
    contigs: {contig:Contig,synBlocks:SynBlock[]}[];
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
                                                                height = 280,
                                                                initialKbpPerPx = 70, // Default zoom: 1 px = 70 kb (~50 Mb fits across ~714px)
                                                                             contigs = [],
}) => {
    const [kbpPerPx, setKbpPerPx] = useState<number>(initialKbpPerPx);
    const [stageX, setStageX] = useState<number>(0);

    const marginX = 60;
    const scaleY = 60;

    const minKbpPerPx = 0.5;  // High zoom-in detail level
    const maxKbpPerPx = 150;  // Wide overview level

    const totalWidthPx = totalKbp / kbpPerPx;
    const minX = Math.min(0, width - (totalWidthPx + marginX * 2));
    const maxX = 0;

    const clampX = (newX: number) => Math.max(minX, Math.min(maxX, newX));

    const handleZoom = useCallback((zoomFactor: number) => {
        setKbpPerPx((prev) => {
            const next = prev / zoomFactor;
            return Math.max(minKbpPerPx, Math.min(maxKbpPerPx, next));
        });
    }, []);

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

            {/* Canvas Viewport */}
            <Stage
                width={width}
                height={height}
                onWheel={handleWheel}
                style={{ background: '#F9FAFB', borderRadius: '6px', overflow: 'hidden', cursor: 'grab' }}
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
                        {contigs.map((feature, idx) => {
                            const featureX = marginX + feature.contig.startBp.kBp / kbpPerPx;
                            const featureWidth = (feature.contig.endBp.kBp - feature.contig.startBp.kBp) / kbpPerPx;
                            const featureY = scaleY + 35 + idx * 50;

                            return (
                                <Group key={idx}>
                                    <Rect
                                        x={featureX}
                                        y={featureY}
                                        width={Math.max(3, featureWidth)}
                                        height={26}
                                        fill={feature.contig.color}
                                        cornerRadius={4}
                                    />
                                    <Text
                                        x={featureX + 6}
                                        y={featureY + 6}
                                        text={`${feature.contig.line} (${formatLabel(feature.contig.startBp.kBp)} - ${formatLabel(feature.contig.endBp.kBp)})`}
                                        fontSize={11}
                                        fontStyle="bold"
                                        fill="#FFFFFF"
                                        listening={false}
                                    />
                                    {feature.synBlocks.map((synBlock, i) => {

                                        return (<Rect
                                            key={`${idx}-${i}`}
                                            x={featureX+ synBlock.startBp.kBp / kbpPerPx}
                                            y={featureY}
                                            width={(synBlock.endBp.kBp - synBlock.startBp.kBp) / kbpPerPx}
                                            height={26}
                                            fill="#10B981"
                                            cornerRadius={4}
                                        />)}
                                    )}
                                </Group>
                            );
                        })}
                    </Group>
                </Layer>
            </Stage>
        </div>
    );
};

export default GenomeBrowser;