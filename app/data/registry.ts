import {sampleData} from "~/data/preproc.compile";
import {Contig, Link} from "~/data/SynBlock";

export const Samples = sampleData.data.map(s => Contig.fromJSON(s))

const chunkRegistry = import.meta.glob('./chunks/*.json')

export type ViteJsonModuleLoader = () => Promise<{ default: any[] }>;

export async function loadLoadLinksBetween(c1: Contig, c2: Contig) {
    const jsonPath= `./chunks/${c1.line}-${c2.line}-${c1.contig}.json`
    if(jsonPath in chunkRegistry){
        return (await (chunkRegistry[jsonPath] as unknown as ViteJsonModuleLoader)()).default.map(l=>Link.fromJSON(l))
    }
    else{
        return Promise.resolve(null)
    }

}