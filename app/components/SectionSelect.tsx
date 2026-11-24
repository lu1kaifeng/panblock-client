import { useState } from "react";
import { Layer, Rect, Stage } from "react-konva";
import type { Contig } from "~/data/SynBlock";
import type { BlockRange } from "~/data/RangeFinder";

export type SectionSelection = {
    contigId: number;  // index in focusedLines
    sectionId: number; // index in the original ranges[contigId]
};

type Props = {
    contigs: readonly Contig[];
    ranges: ReadonlyArray<readonly BlockRange[] | undefined>;
    value: readonly SectionSelection[];
    onChange: (next: SectionSelection[]) => void;
    barWidth?: number;
};

export function ContigSectionSelect({
                                        contigs,
                                        ranges,
                                        value,
                                        onChange,
                                        barWidth = 240,
                                    }: Props) {
    const selectedByContig = new Map<number, Set<number>>();

    for (const { contigId, sectionId } of value) {
        let ids = selectedByContig.get(contigId);
        if (!ids) {
            ids = new Set<number>();
            selectedByContig.set(contigId, ids);
        }
        ids.add(sectionId);
    }

    function replaceContigSelection(contigId: number, sectionIds: number[]) {
        onChange([
            ...value.filter((item) => item.contigId !== contigId),
            ...sectionIds.map((sectionId) => ({ contigId, sectionId })),
        ]);
    }

    return (
        <fieldset style={{ minWidth: 0, margin: 0 }}>
            <legend>Visible sections</legend>

            {contigs.map((contig, contigId) => (
                <ContigRow
                    key={contig.idx}
                    contig={contig}
                    sections={ranges[contigId] ?? []}
                    selected={selectedByContig.get(contigId) ?? new Set<number>()}
                    onChange={(ids) => replaceContigSelection(contigId, ids)}
                    barWidth={barWidth}
                />
            ))}
        </fieldset>
    );
}

type RowProps = {
    contig: Contig;
    sections: readonly BlockRange[];
    selected: ReadonlySet<number>;
    onChange: (ids: number[]) => void;
    barWidth: number;
};

function ContigRow({ contig, sections, selected, onChange, barWidth }: RowProps) {
    const [expanded, setExpanded] = useState(false);
    const name = contig.toString();
    const allChecked = sections.length > 0 && selected.size === sections.length;
    const partiallyChecked = selected.size > 0 && !allChecked;
    const origin = contig.startBp.bp;
    const last = contig.endBp.bp;
    const length = last - origin + 1;

    function toggle(sectionId: number) {
        const next = new Set(selected);
        if (next.has(sectionId)) next.delete(sectionId);
        else next.add(sectionId);
        onChange([...next]);
    }

    return (
        <div style={{ padding: "5px 0" }}>
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <input
                    type="checkbox"
                    aria-label={`All sections of ${name}`}
                    checked={allChecked}
                    disabled={sections.length === 0}
                    ref={(input) => {
                        if (input) input.indeterminate = partiallyChecked;
                    }}
                    onChange={() => onChange(allChecked ? [] : sections.map((_, i) => i))}
                />

                <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => setExpanded((open) => !open)}
                >
                    {expanded ? "▾" : "▸"} {name} ({selected.size}/{sections.length})
                </button>

                {length > 0 && barWidth > 0 && (
                    <Stage width={barWidth} height={28}>
                        <Layer>
                            <Rect
                                x={0}
                                y={11}
                                width={barWidth}
                                height={6}
                                fill={contig.color}
                                opacity={0.3}
                                listening={false}
                            />

                            {sections.map(({ span }, sectionId) => {
                                const start = Math.max(origin, Math.min(...span));
                                const end = Math.min(last, Math.max(...span));
                                if (start > end) return null;

                                const x = ((start - origin) / length) * barWidth;
                                const width = Math.min(
                                    barWidth,
                                    Math.max(1, ((end - start + 1) / length) * barWidth),
                                );
                                const checked = selected.has(sectionId);

                                return (
                                    <Rect
                                        key={sectionId}
                                        x={Math.min(x, barWidth - width)}
                                        y={checked ? 4 : 8}
                                        width={width}
                                        height={checked ? 20 : 12}
                                        fill={checked ? contig.color : "#94a3b8"}
                                        onClick={() => toggle(sectionId)}
                                        onTap={() => toggle(sectionId)}
                                    />
                                );
                            })}
                        </Layer>
                    </Stage>
                )}
            </div>

            {expanded && sections.map(({ span, blocks }, sectionId) => (
                <label key={sectionId} style={{ display: "block", marginLeft: 28 }}>
                    <input
                        type="checkbox"
                        checked={selected.has(sectionId)}
                        onChange={() => toggle(sectionId)}
                    />{" "}
                    Section {sectionId + 1} · {span[0].toLocaleString()}–
                    {span[1].toLocaleString()} bp · {blocks.size}{" "}
                    {blocks.size === 1 ? "block" : "blocks"}
                </label>
            ))}
        </div>
    );
}