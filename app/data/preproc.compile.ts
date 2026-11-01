import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'
import {type Adjacency, Contig, Link, SynBlock} from "~/data/SynBlock";

export const sampleData = compileTime(() => {
    // Path to your local data folder containing your CSV/TSV files
    const dataDir = path.resolve(__dirname, 'raw/Coords')
    const files = fs.readdirSync(dataDir)
    let samplesRaw = Papa.parse<[string,string,number,number]>(fs.readFileSync(path.resolve(__dirname, 'raw/samples.tsv'), 'utf-8'),{
        header: false,skipEmptyLines: true,
        dynamicTyping: true, // Automatically casts numbers/booleans
        delimiter: '\t'
    }).data
    let samples = samplesRaw.map((sample,idx) =>
        new Contig(idx,sample[0],sample[1],sample[2],sample[3])
    )

    let dataMat: Adjacency = new Map()
    let linkIdx = 1
    let blockIdx = 1
    let blockRecord: Record<string, SynBlock> = {}
    let sampleBlockRecord: Record<number, SynBlock[]> = {}
    const chunksDir = path.resolve(__dirname, 'chunks')
    samples.forEach((from,idx) =>{
        if(idx + 1 < samples.length){
            samples.slice(idx+1).forEach((to,idx) => {
                if(!(from.idx in sampleBlockRecord)){
                    sampleBlockRecord[from.idx] = []
                }
                if(!(to.idx in sampleBlockRecord)){
                    sampleBlockRecord[to.idx] = []
                }
                let p  = path.resolve(__dirname,`raw/Coords/${from.line}-vs-${to.line}-${from.contig}.coords`)
                let links = Papa.parse<[number,number,number,number,number,number,number,number,number,number,number,string,string]>(fs.readFileSync(p, 'utf-8'),{
                    header: false,skipEmptyLines: true,
                    dynamicTyping: true, // Automatically casts numbers/booleans
                    delimiter: '\t'
                })
                let linkArr : Array<Link> = []
                for(let l of links.data) {
                    let link = new Link(linkIdx,from.idx,to.idx,[l[0],l[1]],[l[2],l[3]],l[6])
                    linkArr.push(link)
                    let fromB = new SynBlock(blockIdx,from.idx,l[0],l[1],"")
                    blockIdx++
                    if(!(fromB.toString() in blockRecord)){
                        blockRecord[from.toString()] = fromB
                    }
                    sampleBlockRecord[from.idx].push(fromB)
                    let toB = new SynBlock(blockIdx,to.idx,l[2],l[3],"")
                    blockIdx++
                    toB.originLink = link.id
                    if(blockRecord[from.toString()].originBlock){
                        toB.originBlock = blockRecord[from.toString()].originBlock
                        toB.originContig = blockRecord[from.toString()].originContig
                    }else{
                        toB.originBlock = fromB.id
                        toB.originContig = link.fromLine
                    }
                    sampleBlockRecord[to.idx].push(toB)
                    blockRecord[to.toString()] = toB
                    linkIdx++
                }
                fs.writeFileSync(path.join(chunksDir,`${from.idx}-${to.idx}.json`),JSON.stringify(linkArr),{})
                fs.writeFileSync(path.join(chunksDir,`${to.idx}-${from.idx}.json`),JSON.stringify(linkArr.map(l => l.T)),{})
            })
        }
    })
    for(let sample in sampleBlockRecord){
        fs.writeFileSync(path.join(chunksDir,`${sample}-blocks.json`),JSON.stringify(sampleBlockRecord[sample]),{})
    }
    // This payload is bundled as a static JSON map in your final code
    return { data:samples.map( s => s.toJSON()) }
})