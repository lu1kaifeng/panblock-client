import React, { useState } from 'react';
import type {Contig} from "~/data/SynBlock";

interface ContigListParam{
    selectedContigs: {contig:Contig,enabled:boolean}[];
    setSelectedContigs: React.Dispatch<React.SetStateAction<{contig:Contig,enabled:boolean}[]>>;
}

export const ContigList: React.FC<ContigListParam> = ({selectedContigs,setSelectedContigs}: ContigListParam) => {

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.dataTransfer.setData('text/plain', index.toString());
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetIdx: number) => {
        e.preventDefault();
        const sourceIdx = Number(e.dataTransfer.getData('text/plain'));
        if (sourceIdx === targetIdx || Number.isNaN(sourceIdx)) return;

        setSelectedContigs(prev => {
            const updated = [...prev];
            const [movedItem] = updated.splice(sourceIdx, 1);
            updated.splice(targetIdx, 0, movedItem);
            return updated;
        });
    };

    const displayedContigs = selectedContigs
        .map((sample, originalIdx) => ({ ...sample, originalIdx }))
        .sort((a, b) => Number(b.enabled) - Number(a.enabled));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {displayedContigs.map((sample) => (
                <div
                    key={sample.originalIdx}
                    draggable={sample.enabled}
                    onDragStart={(e) => handleDragStart(e, sample.originalIdx)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, sample.originalIdx)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'grab',
                    }}
                >
                    <span style={{ color: '#9ca3af', userSelect: 'none' }}>⋮⋮</span>

                    <label
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            color: sample.enabled ? '#374151' : '#9ca3af',
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={sample.enabled}
                            onChange={() =>
                                setSelectedContigs(prev =>
                                    prev.map((s, i) =>
                                        i === sample.originalIdx
                                            ? { ...s, enabled: !s.enabled }
                                            : s
                                    )
                                )
                            }
                            style={{
                                cursor: 'pointer',
                                accentColor: sample.contig.color,
                            }}
                        />

                        <span
                            style={{
                                width: '10px',
                                height: '10px',
                                boxSizing: 'border-box',
                                borderRadius: '2px',
                                display: 'inline-block',
                                flexShrink: 0,
                                border: sample.enabled
                                    ? '1px solid transparent'
                                    : '1px solid #9ca3af',
                                background: sample.enabled
                                    ? sample.contig.color
                                    : `linear-gradient(
                            135deg,
                            transparent 43%,
                            #9ca3af 43%,
                            #9ca3af 57%,
                            transparent 57%
                        )`,
                            }}
                        />

                        <span
                            style={{
                                textDecoration: sample.enabled ? 'none' : 'line-through',
                            }}
                        >
                {sample.contig.line}
            </span>
                    </label>
                </div>
            ))}
        </div>
    );
};