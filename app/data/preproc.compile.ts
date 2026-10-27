import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'
import {type Adjacency, Contig, Link} from "~/data/SynBlock";

export const sampleData = compileTime(() => {
    // Path to your local data folder containing your CSV/TSV files
    const dataDir = path.resolve(__dirname, 'raw/Coords')
    const files = fs.readdirSync(dataDir)
    let samplesRaw = Papa.parse<[string,string,number,number]>(fs.readFileSync(path.resolve(__dirname, 'raw/samples.tsv'), 'utf-8'),{
        header: false,skipEmptyLines: true,
        dynamicTyping: true, // Automatically casts numbers/booleans
        delimiter: '\t'
    }).data
    let samples = samplesRaw.map(sample =>
        new Contig(sample[0],sample[1],sample[2],sample[3])
    )

    let dataMat: Adjacency = new Map()
    const chunksDir = path.resolve(__dirname, 'chunks')
    for(let sample1 of samples) {
        for(let sample2 of samples) {
            if(sample1 == sample2) continue;
            if(sample1.contig != sample2.contig) continue;
            let p  = path.resolve(__dirname,`raw/Coords/${sample1.line}-vs-${sample2.line}-${sample1.contig}.coords`)
            if(!fs.existsSync(p)) continue;
            let links = Papa.parse<[number,number,number,number,number,number,number,number,number,number,number,string,string]>(fs.readFileSync(p, 'utf-8'),{
                header: false,skipEmptyLines: true,
                dynamicTyping: true, // Automatically casts numbers/booleans
                delimiter: '\t'
            })
            let linkArr : Array<Link> = []
            for(let l of links.data) {
                    linkArr.push(new Link(sample1,sample2,[l[0],l[1]],[l[2],l[3]],l[6]))
            }
            fs.writeFileSync(path.join(chunksDir,`${sample1.line}-${sample2.line}-${sample1.contig}.json`),JSON.stringify(linkArr),{})
            fs.writeFileSync(path.join(chunksDir,`${sample2.line}-${sample1.line}-${sample2.contig}.json`),JSON.stringify(linkArr.map(l => l.T)),{})
        }
    }
    // This payload is bundled as a static JSON map in your final code
    return { data:samples.map( s => s.toJSON()) }
})