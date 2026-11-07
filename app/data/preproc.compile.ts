import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'
import {type Adjacency, Contig, Link, SynBlock} from "~/data/SynBlock";
import {DatabaseSync} from 'node:sqlite';

export const sampleData = compileTime(() => {

    const db = new DatabaseSync(':memory:');

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

        db.exec(`
            CREATE TABLE IF NOT EXISTS "${from.idx}-blocks"
            (
                id
                INTEGER
                PRIMARY
                KEY,
                line
                number
                NOT
                NULL,
                fromBp
                number
                NOT
                NULL,
                toBp
                number
                NOT
                NULL,
                originContigId
                number,
                originBlockId
                number
            )
        `);

        let p = path.resolve(__dirname, `raw/Haps/${from.line}.filtered.bed`)
        let blocks = Papa.parse<[string, number, number, string]>(fs.readFileSync(p, 'utf-8'), {
            header: false, skipEmptyLines: true,
            dynamicTyping: true, // Automatically casts numbers/booleans
            delimiter: '\t'
        })

        for (let b of blocks.data) {
            if (b[0] != from.contig) continue;
            const stmt = db.prepare(`insert into "${from.idx}-blocks"(id, line, fromBp, toBp, originContigId)
                                     values (?, ?, ?, ?, ?)`)
            stmt.run(blockIdx, from.idx, b[1], b[2], samples.filter(s => s.line == b[3] && s.contig == from.contig)[0].idx)
            blockIdx += 1
        }

        samples.forEach(to => {
            if (from.contig != to.contig) return;
            if (from.line == to.line) return;
            let lp = path.resolve(__dirname, `raw/Coords/${from.line}-vs-${to.line}-${from.contig}.coords`)
            if (!fs.existsSync(lp)) return;
            let links = Papa.parse<[number, number, number, number, number, number, number, number, number, number, number, string, string]>(fs.readFileSync(lp, 'utf-8'), {
                header: false, skipEmptyLines: true,
                dynamicTyping: true, // Automatically casts numbers/booleans
                delimiter: '\t'
            })
            db.exec(`
                CREATE TABLE IF NOT EXISTS "${from.idx}-${to.idx}-links"
                (
                    id
                    INTEGER
                    PRIMARY
                    KEY,
                    contig
                    string
                    NOT
                    NULL,
                    fromLine
                    number
                    NOT
                    NULL,
                    toLine
                    number
                    NOT
                    NULL,
                    fromBp1
                    number
                    NOT
                    NULL,
                    fromBp2
                    number
                    NOT
                    NULL,
                    toBp1
                    number
                    NOT
                    NULL,
                    toBp2
                    number
                    NOT
                    NULL,
                    percentIdy
                    number
                    NOT
                    NULL,
                    fromBlockId
                    number,
                    toBlockId
                    number
                )
            `);

            for (let l of links.data) {
                const stmt = db.prepare(`insert into "${from.idx}-${to.idx}-links"(id, contig, fromLine, toLine,
                                                                                   fromBp1, fromBp2, toBp1, toBp2,
                                                                                   percentIdy)
                                         values (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
                stmt.run(linkIdx, to.contig, from.idx, to.idx, l[0], l[1], l[2], l[3], l[6]);
                linkIdx += 1
            }


        })
    })
    samples.forEach((from,idx) =>{
        samples.forEach(to => {
            if (from.contig != to.contig) return;
            if (from.line == to.line) return;
            if(from.idx > to.idx) return;
            db.exec(`create table '${from.idx}-${to.idx}-trace' as select i.id as id, from_block_id, to_block_id,i.percentIdy as percentIdy
                                     from (select "${from.idx}-${to.idx}-links".id as id,
                                                  "${from.idx}-blocks".id          as "from_block_id",percentIdy
                                           from "${from.idx}-${to.idx}-links"
                                                    join "${from.idx}-blocks" on fromBp <= fromBp1 and toBp >= fromBp2) i
                                              join (select "${from.idx}-${to.idx}-links".id as id, "${to.idx}-blocks".id as "to_block_id"
                                                    from "${from.idx}-${to.idx}-links"
                                                             join "${to.idx}-blocks" on fromBp <= toBp1 and toBp >= toBp2) j
                                                   on i.id = j.id`);
            const stmt = db.prepare(`select * from '${from.idx}-${to.idx}-trace'`);
            let lArr:Link[] = []
            for (let lll of stmt.all()) {
                const fromBlock = db.prepare(`select fromBp,toBp from "${from.idx}-blocks" where id = ${lll.from_block_id}`).all()[0]
                const toBlock = db.prepare(`select fromBp,toBp from "${to.idx}-blocks" where id = ${lll.to_block_id}`).all()[0]
                let l = new Link(lll.id as number,from.idx,to.idx,[fromBlock.fromBp as number,fromBlock.toBp as number],[toBlock.fromBp as number,toBlock.toBp as number],lll.percentIdy as number,lll.from_block_id as number,lll.to_block_id as number)
                lArr.push(l)
            }
            fs.writeFileSync(path.join(chunksDir,`${from.idx}-${to.idx}-links.json`),JSON.stringify(lArr),{})
            fs.writeFileSync(path.join(chunksDir,`${to.idx}-${from.idx}-links.json`),JSON.stringify(lArr.map((l)=>l.T)),{})
        })
    })
    samples.forEach((s,idx) =>{
        if(idx == 0) {
            let bArr:SynBlock[] = []
            let stmt = db.prepare(`select * from '${s.idx}-blocks'`)
            for (let lll of stmt.all()) {
                let bbb = new SynBlock(lll.id as number, lll.line as number, lll.fromBp as number, lll.toBp as number, "")
                bbb.originContig = lll.originContigId as number
                bbb.originBlock = lll.originBlockId as number
                bArr.push(bbb)
            }
            fs.writeFileSync(path.join(chunksDir,`${s.idx}-blocks`),JSON.stringify(bArr),{})
        }else{
        let bArr:SynBlock[] = []
        let stmt = db.prepare(`select b.id as id,b.line as line, b.fromBp as fromBp,b.toBp as toBp, b.originContigId as originContigId,from_block_id as originBlockId from '${s.idx}-blocks' b left join '${samples[0].idx}-${s.idx}-trace' t on b.id = to_block_id and not b.originContigId = ${s.idx}`)
        for (let lll of stmt.all()) {
            let bbb = new SynBlock(lll.id as number, lll.line as number, lll.fromBp as number, lll.toBp as number, "")
            bbb.originContig = lll.originContigId as number
            bbb.originBlock = lll.originBlockId as number
            bArr.push(bbb)
        }
            fs.writeFileSync(path.join(chunksDir,`${s.idx}-blocks`),JSON.stringify(bArr),{})
    }
    })
    // for(let sample in sampleBlockRecord){
    //     fs.writeFileSync(path.join(chunksDir,`${sample}-blocks.json`),JSON.stringify(sampleBlockRecord[sample]),{})
    // }
    // This payload is bundled as a static JSON map in your final code
    return { data:samples.map( s => s.toJSON()) }
})