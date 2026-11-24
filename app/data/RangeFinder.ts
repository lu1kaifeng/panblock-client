import {Contig, type SynBlock} from "~/data/SynBlock";


type Range = [number, number];

export interface BlockRange{
    span: Range;
    blocks: Set<SynBlock>
}

function inflate(r: BlockRange, margin:number,min:number,max: number):BlockRange{
    const lower = Math.max(min,r.span[0] - margin)
    const upper = Math.min(max - 1,r.span[1] + margin)
    return {
        span:[lower, upper],
        blocks:r.blocks
    }
}

export class RangeFinder {
    ranges: BlockRange[][] = [];
    contigs: Contig[] = [];
 constructor( coFocusBlocks: number[],blocks: SynBlock[][],contigs: Contig[]) {
     this.contigs = contigs;
     let blockSet = new Set(coFocusBlocks);
     blocks.forEach((block,idx) => {
         let row: BlockRange[] = [];
         block.forEach((b,idx) => {
             if(blockSet.has(b.id)) {
                 row.push({span: [b.startBp.bp,b.endBp.bp],blocks:new Set([b])})
             }
         })
         this.ranges.push(row)
     })
 }

 mergeWithinMargin(margin = 500_000){
    const inflated = this.ranges.map( (range,idx) => range.map(r=>inflate(r,margin,this.contigs[idx].startBp.bp,this.contigs[idx].endBp.bp)))
     return inflated.map(i=>RangeFinder.mergeBlockRanges(i))
 }

    private static mergeBlockRanges(ranges: readonly BlockRange[]): BlockRange[] {
        if (ranges.length === 0) return [];

        const sorted = [...ranges].sort((a, b) => a.span[0] - b.span[0]);

        const merged: BlockRange[] = [
            {
                span: [...sorted[0].span],
                blocks: new Set(sorted[0].blocks),
            },
        ];

        for (let i = 1; i < sorted.length; i++) {
            const current = sorted[i];
            const last = merged[merged.length - 1];

            if (current.span[0] <= last.span[1]) {
                last.span[1] = Math.max(last.span[1], current.span[1]);
                for (const block of current.blocks) {
                    last.blocks.add(block);
                }
            } else {
                merged.push({
                    span: [...current.span],
                    blocks: new Set(current.blocks),
                });
            }
        }

        return merged;
    }

}