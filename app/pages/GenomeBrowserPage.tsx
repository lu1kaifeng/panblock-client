import React, {use, useState} from 'react';
import { GenomeBrowser } from '~/components/DnaSequenceViewer';
// Assumes GenomeBrowser component is in the same directory
import { Dna, Filter, Layers, Search, Info, Settings, Download } from 'lucide-react';
import {type Contig, NAM01Blocks, Samples, SynBlock, SynBlocks} from "~/models/SynBlock";

interface FeatureFilter {
    id: string;
    label: string;
    color: string;
    enabled: boolean;
}

export const GenomeBrowserPage: React.FC = () => {
    const [chromosome, setChromosome] = useState<string>('chr1');
    const [searchQuery, setSearchQuery] = useState<string>('');


    const [samples,setSamples] = useState<{contig: Contig,synBlocks:SynBlock[],enabled: boolean}[]>(Samples.map((s,idx)=> ({contig: s,synBlocks:SynBlocks[idx],enabled: true})))

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6', color: '#1F2937', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
    {/* Header */}
    <header style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E7EB', padding: '16px 32px' }}>
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    <div style={{ backgroundColor: '#EEF2FF', padding: '8px', borderRadius: '8px', color: '#4F46E5', display: 'flex' }}>
    <Dna size={24} />
    </div>
    <div>
    <h1 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: '#111827' }}>Genome Sequence Explorer</h1>
    <p style={{ fontSize: '13px', margin: 0, color: '#6B7280' }}>High-resolution chromosome mapping & genomic feature browser</p>
    </div>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', border: '1px solid #D1D5DB', borderRadius: '6px', backgroundColor: '#FFF', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
    <Download size={15} /> Export Data
    </button>
    <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', border: '1px solid #D1D5DB', borderRadius: '6px', backgroundColor: '#FFF', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
    <Settings size={15} /> Track Settings
    </button>
    </div>
    </div>
    </header>

    {/* Main Content Container */}
    <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 32px' }}>
    {/* Navigation & Search Bar */}
    <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', padding: '16px 20px', marginBottom: '20px', border: '1px solid #E5E7EB', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', justifyContent: 'space-between' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Target Chromosome:</label>
    <select
    value={chromosome}
    onChange={(e) => setChromosome(e.target.value)}
    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #D1D5DB', backgroundColor: '#F9FAFB', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
>
    <option value="chr1">Chr 1 (50 Mb Region)</option>
    <option value="chr2">Chr 2 (48 Mb Region)</option>
    <option value="chr3">Chr 3 (52 Mb Region)</option>
    <option value="chrX">Chr X (45 Mb Region)</option>
    </select>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', maxWidth: '400px' }}>
    <div style={{ position: 'relative', width: '100%' }}>
    <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
    <input
    type="text"
    placeholder="Search gene, variant ID, or position (e.g. 18 Mb)..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '13px', boxSizing: 'border-box' }}
    />
    </div>
    </div>
    </div>

    {/* Genome Browser Container */}
    <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', padding: '20px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
    <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
    <Layers size={18} color="#4F46E5" /> Visual Track Viewer: {chromosome.toUpperCase()}
    </h2>
    <span style={{ fontSize: '12px', color: '#6B7280', backgroundColor: '#F3F4F6', padding: '4px 10px', borderRadius: '12px' }}>
    Scale Range: <strong>0 – 50 Mb (50,000 Kbp)</strong>
    </span>
    </div>

    {/* Integrated Konva Browser */}
    <div style={{ display: 'flex', justifyContent: 'center' }}>
    <GenomeBrowser totalKbp={50000} width={1180} height={300} contigs={samples.filter(s=>s.enabled).map(s=>({contig: s.contig,synBlocks: s.synBlocks}))} />
    </div>
    </div>

    {/* Sidebar Controls & Metadata Section */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
    {/* Feature Track Controls */}
    <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', padding: '20px', border: '1px solid #E5E7EB' }}>
    <h3 style={{ fontSize: '14px', fontWeight: 600, marginTop: 0, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
    <Filter size={16} /> Track Filters
    </h3>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
    {samples.map((sample,idx) => (
        <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', color: '#374151' }}>
        <input
            type="checkbox"
        checked={sample.enabled}
        onChange={() =>
            setSamples(prevSamples =>
                prevSamples.map((s, i) =>
                    i === idx ? { ...s, enabled: !s.enabled } : s
                )
            )
        }
        style={{ cursor: 'pointer', accentColor: sample.contig.color }}
        />
        <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: sample.contig.color, display: 'inline-block' }}></span>
        {sample.contig.line}
        </label>
    ))}
    </div>
    </div>

    {/* Region Statistics & Info */}
    <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', padding: '20px', border: '1px solid #E5E7EB' }}>
    <h3 style={{ fontSize: '14px', fontWeight: 600, marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
    <Info size={16} /> Region Summary
    </h3>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
    <div style={{ backgroundColor: '#F9FAFB', padding: '12px', borderRadius: '6px', border: '1px solid #F3F4F6' }}>
    <span style={{ fontSize: '11px', color: '#6B7280', display: 'block' }}>Assembly Version</span>
    <strong style={{ fontSize: '14px', color: '#111827' }}>GRCh38.p14</strong>
    </div>
    <div style={{ backgroundColor: '#F9FAFB', padding: '12px', borderRadius: '6px', border: '1px solid #F3F4F6' }}>
    <span style={{ fontSize: '11px', color: '#6B7280', display: 'block' }}>GC Content</span>
    <strong style={{ fontSize: '14px', color: '#111827' }}>41.2%</strong>
    </div>
    <div style={{ backgroundColor: '#F9FAFB', padding: '12px', borderRadius: '6px', border: '1px solid #F3F4F6' }}>
    <span style={{ fontSize: '11px', color: '#6B7280', display: 'block' }}>Mapped Features</span>
    <strong style={{ fontSize: '14px', color: '#111827' }}>1,248</strong>
    </div>
    </div>
    </div>
    </div>
    </main>
    </div>
);
};

export default GenomeBrowserPage;