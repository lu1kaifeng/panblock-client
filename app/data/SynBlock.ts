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
    toString(){
        return this.bp.toString();
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
    toString() {
        return `${this.line}_${this.contig}`;
    }
    toJSON(){
        return {
            line: this.line,
            contig: this.contig,
            startBp: this.startBp.bp,
            endBp: this.endBp.bp,
            color: this.color,
        }
    }
    static fromJSON(c: {
        line: string
        contig: string
        startBp: number
        endBp: number
        color: string
    }){
        let k = new Contig(c.line, c.contig, c.startBp, c.endBp);
        k.color = c.color
        return k
    }
}
export type Adjacency = Map<[Contig,Contig],Link | null>

export class Link{
    fromLine: Contig;
    constructor(fromLine: Contig, toLine: Contig, from: [number, number], to: [number, number],percentIdy: number) {
        this.fromLine = fromLine;
        this.toLine = toLine;
        this.from = [new BpPos(from[0]),new BpPos(from[1])];
        this.to =  [new BpPos(to[0]),new BpPos(to[1])];
        this.percentIdy = percentIdy
    }

    toLine: Contig;
    from:[BpPos,BpPos];
    to:[BpPos,BpPos]
    percentIdy:number;
    get T(): Link {
        return new Link(this.toLine, this.fromLine, [this.to[0].bp, this.to[1].bp], [this.from[0].bp, this.from[1].bp], this.percentIdy);
    }
    static fromJSON(l: {
        fromLine : {
            line: string
            contig: string
            startBp: number
            endBp: number
            color: string
        },
        toLine: {
            line: string
            contig: string
            startBp: number
            endBp: number
            color: string
        },
        from: [number,number],
        to: [number, number],
        percentIdy: number
    }){
        return new Link(Contig.fromJSON(l.fromLine),Contig.fromJSON(l.toLine),[l.from[0],l.from[1]],[l.to[0],l.to[1]],l.percentIdy)
    }
    toJSON(){
        return {
            fromLine : this.fromLine.toJSON(),
            toLine: this.toLine.toJSON(),
            from: [this.from[0].bp, this.from[1].bp],
            to: [this.to[0].bp, this.to[1].bp],
            percentIdy: this.percentIdy
        }
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

