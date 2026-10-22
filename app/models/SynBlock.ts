import samples from '~/assets/samples.tsv?raw'
import NAM01 from '~/assets/NAM01.filtered.bed?raw'
import NAM04 from '~/assets/NAM04.filtered.bed?raw'
import NAM05 from '~/assets/NAM05.filtered.bed?raw'
import {getInfiniteHexColor} from "~/utils/colors";

export class BpPos{
    bp:number;
    constructor(bp:number) {
        this.bp = bp;
    }
    get kBp(){
        return this.bp / 1000
    }
    get Mbp(){
        return this.bp / 1000_000
    }
}

export class Contig{
    line: string;
    contig: string;
    startBp: BpPos;
    endBp: BpPos;
    color: string;
    static colorIdx = 0
    constructor(line: string, contig: string, startBp: number, endBp: number) {
        this.line = line;
        this.contig = contig;
        this.startBp = new BpPos(startBp);
        this.endBp = new BpPos(endBp);
        this.color = getInfiniteHexColor(Contig.colorIdx)
        Contig.colorIdx = Contig.colorIdx + 1
    }
}

export class SynBlock {
    get length(): BpPos {
        return new BpPos(this.endBp.bp - this.startBp.bp);
    }

    line: string;
    contig: string;
    startBp: BpPos;
    endBp: BpPos;
    tag: string;

    constructor(line: string, contig: string, startPos: number, endPos: number,tag: string) {
        this.line = line;
        this.contig = contig;
        this.startBp = new BpPos( startPos);
        this.endBp = new BpPos( endPos);
        this.tag = tag;
    }
    toString() {
        return `${this.line}.${this.contig}.${this.startBp}-${this.endBp}`;
    }
}

export function parseDelimitedText(text: string, delimiter: string = ','): string[][] {
    // Normalize line endings and filter out empty rows
    const lines: string[] = text.split(/\r?\n/).filter((line: string) => line.trim() !== '');

    return lines.map((line: string): string[] => {
        return line.split(delimiter).map((value: string) => value.trim());
    });
}
export let NAM01Blocks: SynBlock[] = []
for( let b of parseDelimitedText(NAM01,'\t')){
    NAM01Blocks.push(new SynBlock('NAM01',b[0],Number(b[1]),Number(b[2]),b[3]))
}
export let NAM04Blocks: SynBlock[] = []
for( let b of parseDelimitedText(NAM04,'\t')){
    NAM04Blocks.push(new SynBlock('NAM04',b[0],Number(b[1]),Number(b[2]),b[3]))
}
export let NAM05Blocks: SynBlock[] = []
for( let b of parseDelimitedText(NAM05,'\t')){
    NAM05Blocks.push(new SynBlock('NAM05',b[0],Number(b[1]),Number(b[2]),b[3]))
}
export let Samples: Contig[] = []
for (let s of parseDelimitedText(samples,'\t')){
    Samples.push(new Contig(s[0],s[1],Number(s[2]),Number(s[3])))
}
export let SynBlocks: SynBlock[][] = [NAM01Blocks,NAM04Blocks,NAM05Blocks]
