import {Contig, type SynBlock} from "~/data/SynBlock";
import type {PieChartItem} from "~/components/PieChart";

export function getColor(block: SynBlock,contigList: Contig[],currentContig:Contig,fallback: string): string {
    if(block.originContig != undefined){
        return contigList.filter(contig => contig.idx == block.originContig).at(0)?.color || fallback
    }else{
        return currentContig.color
    }
}

export function getVerticalRibbonPath(y1: number,         // Top Y (bottom edge of the upper block)
x1Left: number,     // Upper block segment start X
x1Right: number,    // Upper block segment end X
y2: number,         // Bottom Y (top edge of the lower block)
x2Left: number,     // Lower block segment start X
x2Right: number): string {
    const dy = y2 - y1;

    // Vertical midpoint control points for smooth vertical flow
    const cpY1 = y1 + dy * 0.5;
    const cpY2 = y1 + dy * 0.5;

    return [
        `M ${x1Left} ${y1}`,                                          // 1. Start at top-left on upper block
        `L ${x1Right} ${y1}`,                                         // 2. Straight horizontal line across upper block width
        `C ${x1Right} ${cpY1}, ${x2Right} ${cpY2}, ${x2Right} ${y2}`, // 3. Right wave curve down to lower block right
        `L ${x2Left} ${y2}`,                                          // 4. Straight horizontal line across lower block width (backwards)
        `C ${x2Left} ${cpY2}, ${x1Left} ${cpY1}, ${x1Left} ${y1}`,    // 5. Left wave curve back up to upper block left
        `Z`                                                           // 6. Close path
    ].join(' ');
}

export function getStats(samples: {contig:Contig,enabled:boolean}[],blocks: SynBlock[][]): PieChartItem[]{
    let counter: Record<number, number> = {}
    samples.forEach(sample => {
        counter[sample.contig.idx] = 0
    })
    blocks.flat().forEach(b=>{
        if(b.originContig == undefined){
            counter[b.line] +=1
        }else{
            counter[b.originContig] +=1
        }
    })
    let piArr: PieChartItem[] = []
    for(let c in counter){
        if(counter[c] == 0){continue}
        piArr.push({
            color:samples[c].enabled?samples[c].contig.color:samples[c].contig.color+'C0',
            value:counter[c],
            label:samples[c].contig.line
        })
    }
    return piArr
}