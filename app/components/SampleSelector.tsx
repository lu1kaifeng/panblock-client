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

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {selectedContigs.map((sample, idx) => (
                <div
                    key={idx}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, idx)}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'grab' }}
                >
                    <span style={{ color: '#9ca3af', userSelect: 'none' }}>⋮⋮</span>
                    <label
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            color: '#374151',
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={sample.enabled}
                            onChange={() =>
                                setSelectedContigs(prev =>
                                    prev.map((s, i) => (i === idx ? { ...s, enabled: !s.enabled } : s))
                                )
                            }
                            style={{ cursor: 'pointer', accentColor: sample.contig.color }}
                        />
                        <span
                            style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '2px',
                                backgroundColor: sample.contig.color,
                                display: 'inline-block',
                            }}
                        />
                        {sample.contig.line}
                    </label>
                </div>
            ))}
        </div>
    );
};