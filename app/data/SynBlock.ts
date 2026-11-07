import {getInfiniteHexColor} from "~/utils/colors";
import {unstable_setDevServerHooks} from "react-router";

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
    toJSON(){
        return this.bp
    }
    fromJSON(bp:number){
        return new BpPos(bp)
    }
}

export class Contig{
    idx:number;
    line: string;
    contig: string;
    startBp: BpPos;
    endBp: BpPos;
    color: string;
    static colorIdx = 0
    constructor(idx:number,line: string, contig: string, startBp: number, endBp: number) {
        this.idx = idx;
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
            idx: this.idx,
            line: this.line,
            contig: this.contig,
            startBp: this.startBp.toJSON(),
            endBp: this.endBp.toJSON(),
            color: this.color,
        }
    }
    static fromJSON(c: {
        idx:number;
        line: string
        contig: string
        startBp: number
        endBp: number
        color: string
    }){
        let k = new Contig(c.idx,c.line, c.contig, c.startBp, c.endBp);
        k.color = c.color
        return k
    }
}
export type Adjacency = Map<[Contig,Contig],Link | null>

export class Link{
    id: number;
    fromLine: number;
    fromBpIdx: number;
    toBpIdx: number;
    fromBpIdx1: number;
    toBpIdx1: number;
    fromBlock: number;
    toBlock:number;
    constructor(id:number,fromLine: number, toLine: number, from: [number, number], to: [number, number],percentIdy: number,fromBlock: number,
    toBlock:number) {
        this.id = id;
        this.fromLine = fromLine;
        this.toLine = toLine;
        this.from = [new BpPos(from[0]),new BpPos(from[1])];
        this.to =  [new BpPos(to[0]),new BpPos(to[1])];
        this.percentIdy = percentIdy
        this.fromBpIdx = from[0]
        this.toBpIdx = to[0]
        this.fromBpIdx1 = from[1]
        this.toBpIdx1 = to[1]
        this.fromBlock = fromBlock
        this.toBlock = toBlock
    }

    toLine: number;
    from:[BpPos,BpPos];
    to:[BpPos,BpPos]
    percentIdy:number;
    get T(): Link {
        return new Link(-this.id,this.toLine, this.fromLine, [this.to[0].bp, this.to[1].bp], [this.from[0].bp, this.from[1].bp], this.percentIdy,this.toBlock,this.fromBlock);
    }
    static fromJSON(l: {
        id: number;
        fromLine : number,
        toLine: number,
        from: [number,number],
        to: [number, number],
        percentIdy: number,fromBlock: number,
        toBlock:number
    }){
        return new Link(l.id,l.fromLine,l.toLine,[l.from[0],l.from[1]],[l.to[0],l.to[1]],l.percentIdy,l.fromBlock,l.toBlock)
    }
    toJSON(){
        return {
            id: this.id,
            fromLine : this.fromLine,
            toLine: this.toLine,
            from: [this.from[0].toJSON(), this.from[1].toJSON()],
            to: [this.to[0].toJSON(), this.to[1].toJSON()],
            percentIdy: this.percentIdy,fromBlock: this.fromBlock,toBlock:this.toBlock
        }
    }
}

export class SynBlock {
    get length(): BpPos {
        return new BpPos(this.endBp.bp - this.startBp.bp);
    }
    id: number;
    line: number;
    startBp: BpPos;
    endBp: BpPos;
    tag: string;
    originBlock?: number
    originLink?: number
    originContig?: number
    constructor(id: number,line: number, startPos: number, endPos: number,tag: string) {
        this.id = id;
        this.line = line;
        this.startBp = new BpPos( startPos);
        this.endBp = new BpPos( endPos);
        this.tag = tag;
    }
    toString() {
        return `${this.line}.${this.startBp}-${this.endBp}`;
    }
    toJSON(){
        return {
            id: this.id,
            line: this.line,
            startBp: this.startBp.toJSON(),
            endBp: this.endBp.toJSON(),
            tag: this.tag,
            originBlock: this?.originBlock,
            originLink: this?.originLink,
            originContig: this?.originContig,
        }
    }
    static fromJSON(sb: {
        id: number;
        line: number;
                 startBp: number;
                 endBp: number;
                 tag: string;
                 originBlock?: number;
                 originContig?: number;
    originLink?: number}){
        let b = new SynBlock(sb.id,sb.line,sb.startBp,sb.endBp,sb.tag);
        b.originBlock = sb.originBlock;
        b.originLink = sb.originLink;
        b.originContig = sb.originContig;
        return b;
    }
}

export function parseDelimitedText(text: string, delimiter: string = ','): string[][] {
    // Normalize line endings and filter out empty rows
    const lines: string[] = text.split(/\r?\n/).filter((line: string) => line.trim() !== '');

    return lines.map((line: string): string[] => {
        return line.split(delimiter).map((value: string) => value.trim());
    });
}

