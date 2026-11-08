import {sampleData} from "~/data/preproc.compile";
import {Contig, Link, SynBlock, Tracer} from "~/data/SynBlock";

export const Samples = sampleData.data.map(s => Contig.fromJSON(s))

const chunkRegistry = import.meta.glob('./chunks/*.json')

export type ViteJsonModuleLoader = () => Promise<{ default: any[] }>;

export async function loadLoadLinksBetween(c1: Contig, c2: Contig) {
    const jsonPath= `./chunks/${c1.idx}-${c2.idx}-links.json`
    if(jsonPath in chunkRegistry){
        return (await (chunkRegistry[jsonPath] as unknown as ViteJsonModuleLoader)()).default.map(l=>Link.fromJSON(l))
    }
    else{
        return Promise.resolve([])
    }

}

export async function loadLoadTraceBetween(c1: Contig, c2: Contig) {
    const jsonPath= `./chunks/${c1.idx}-${c2.idx}-trace.json`
    if(jsonPath in chunkRegistry){
        return new Tracer((await (chunkRegistry[jsonPath] as unknown as ViteJsonModuleLoader)()).default.map(l=>l as unknown as [number,number,number,number]))
    }
    else{
        return Promise.resolve(new Tracer([]))
    }

}

export async function loadLoadBlocks(c: Contig) {
    const jsonPath= `./chunks/${c.idx}-blocks.json`
    if(jsonPath in chunkRegistry){
        return (await (chunkRegistry[jsonPath] as unknown as ViteJsonModuleLoader)()).default.map(l=>SynBlock.fromJSON(l))
    }
    else{
        return Promise.resolve([])
    }

}