import React, {useEffect, useMemo, useRef, useState} from "react";
import {useSelector, useStore} from "react-redux";
import type {AppStore, RootState} from "~/store";
import {useHref, useSearchParams} from "react-router";
import {
    loadBlocksByContigIdx,
    loadLoadBlocks,
    loadLoadLinksBetween,
    loadLoadTraceBetween,
    Samples
} from "~/data/registry";
import {type Contig, Link, SynBlock, Tracer} from "~/data/SynBlock";
import GenomeSectionBrowser from "~/components/DnaSequenceSectionViewer";
import {trace} from "~/components/DnaSequenceViewer";
import {RangeFinder} from "~/data/RangeFinder";
import {ContigSectionSelect, type SectionSelection} from "~/components/SectionSelect";

export function openBlockPopup(href:string,blockId?:  number,contigId?:number, selectedContigIds?: number[]) {
    if(blockId == undefined || contigId == undefined || selectedContigIds == undefined) return;
    const width = Math.min(800, window.innerWidth);
    const height = Math.min(600, window.innerHeight);
    const left = Math.round(window.screenX + (window.outerWidth - width) / 2);
    const top = Math.round(window.screenY + (window.outerHeight - height) / 2);
    const popup = window.open(
        `${href}?b=${encodeURIComponent(String(blockId))}&c=${encodeURIComponent(String(contigId))}&f=${encodeURIComponent(selectedContigIds.map(i => String(i)).join(','))}`,
        "panblock-details",
        `popup=yes,width=${width},height=${height},left=${left},top=${top}`,
    );

    popup?.focus();
}

type BlockDetailDialogProps = {
};

export function BlockDetailDialog({ }: BlockDetailDialogProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ width: 0, height: 0 });
    const [searchParams, setSearchParams] = useSearchParams();

    const [links, setLinks] = useState<Link[][] >([]);
    const [blocks, setBlocks] = useState<SynBlock[][]>([]);
    const [tracers, setTracers] = useState<Tracer[]>([]);

    const [viewerHeight,setViewerHeight] = useState(0);
    const viewerRef = useRef<HTMLDivElement>(null);
    const [viewerWidth, setViewerWidth] = useState(0);

    const blockId = searchParams.get('b')
    const contigId = searchParams.get('c')
    const focusedContigIds = searchParams.get('f')
    if (blockId == null || contigId == null || focusedContigIds == null) return (<></>);
    let numFocusedIds = focusedContigIds.split(',').map(id => Number(id));
    const [numContigId] = useState(Number(contigId))
    const [numBlockId] = useState(Number(blockId))
    const [contig,setContig] = useState(Samples.filter(s=>s.idx == numContigId)[0])
    const [block, setBlock] = useState<SynBlock | null>(null);
    const [userSelection, setUserSelection] = useState<SectionSelection[] | null>(null);
    if(contig == undefined) return (<></>);
    //numFocusedIds = numFocusedIds.filter(i => i != contig.idx)
    let idDict = new Map<number,number>()
    numFocusedIds.forEach((idx,pos) => {
        idDict.set(idx, pos);
    })
    let lineArr:Contig[] = []
    Samples.forEach(s => {
        let i = idDict.get(s.idx)
        if(i!= undefined) {
            lineArr[i] = s
        }
    })
    const [focusedLines, setFocusedLines] = useState(lineArr);
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const observer = new ResizeObserver(([entry]) => {
            const width = Math.floor(entry.contentRect.width);
            const height = Math.floor(entry.contentRect.height);

            setSize((prev) =>
                prev.width === width && prev.height === height
                    ? prev
                    : { width, height }
            );
        });

        const wrapper = viewerRef.current;
        if (!wrapper) return;

        const wrapperObserver = new ResizeObserver(([entry]) => {
            setViewerWidth(Math.min(1180, Math.floor(entry.contentRect.width)));
        });

        wrapperObserver.observe(wrapper);

        observer.observe(container);

        (async()=>{

            const b: SynBlock[][] = await Promise.all(numFocusedIds.map(c=>loadBlocksByContigIdx(c)))
            const l: Link[][] = [];
            const ttt : Tracer[] = []
            let i = 0
            let j = 1
            let enabled_samples = focusedLines
            while(enabled_samples.length > j){
                let blocks = await loadLoadLinksBetween(enabled_samples[i],enabled_samples[j])
                ttt.push(await loadLoadTraceBetween(enabled_samples[i],enabled_samples[j]))
                l.push(blocks)
                i++
                j++
            }
            setLinks(l)
            setBlocks(b)
            setTracers(ttt)
            const contigPos = idDict.get(numContigId)
            if(contigPos != undefined) {
                const targetBlock = b[contigPos].filter(b => b.id == numBlockId)[0]
                setBlock(targetBlock)
            }

        })()

        return () => {observer.disconnect();wrapperObserver.disconnect();}
    }, []);

    const {coFocusBlocks,coFocusLinks} = useMemo(() => trace(tracers,blocks,block), [tracers,blocks,block]);
    const {ranges} = useMemo(() => {
        if(block == undefined) return {ranges:[]}
        let rangeFinder = new RangeFinder([block?.id,...coFocusBlocks],blocks,focusedLines)
        let ranges = rangeFinder.mergeWithinMargin()
        return {ranges}
    }, [coFocusBlocks,blocks,block,focusedLines]);
    const sectionSelections = userSelection ?? ranges.flatMap((sections, contigId) =>
        (sections ?? []).map((_, sectionId) => ({ contigId, sectionId }))
    );

    const selectedIds = new Set(
        sectionSelections.map(({ contigId, sectionId }) => `${contigId}/${sectionId}`)
    );

    const visibleRanges = focusedLines.map((_, contigId) =>
        (ranges[contigId] ?? []).filter((_, sectionId) =>
            selectedIds.has(`${contigId}/${sectionId}`)
        )
    );
    return (
        <div ref={containerRef}>
            <ContigSectionSelect
                contigs={focusedLines}
                ranges={ranges}
                value={sectionSelections}
                onChange={setUserSelection}
            />

            <div
                ref={viewerRef}
                style={{ display: "flex", justifyContent: "center" }}
            >
                {visibleRanges.some((sections) => sections.length > 0) && (
                    <GenomeSectionBrowser
                        totalKbp={50000}
                        width={viewerWidth}
                        height={viewerHeight}
                        setHeight={setViewerHeight}
                        contigs={focusedLines}
                        links={links}
                        blocks={blocks}
                        ranges={visibleRanges}
                    />
                )}
            </div>
        </div>
    );
}