import {openDB, type DBSchema, deleteDB} from 'idb';
import {Contig, Link, type SynBlock} from "~/data/SynBlock";

export interface PanblockDB extends DBSchema {
    blocks: {
        key: number;
        value: SynBlock;
        indexes: { 'line': number,'start_bp': number,'end_bp':number,'all':[number,number,number] }; // Define index name and the indexed property's type
    };
    links:{
        key: number;
        value: Link;
        indexes: { 'from_line': number,'to_line':number,'from_bp':number,'from_bp1':number,'to_bp':number,'to_bp1':number,'from_line_and_bp':[number,number,number],'to_line_and_bp':[number,number,number] };
    }
    contigs:{
        key: number;
        value: Contig;
    }
}


export async function saveToDb(links: Link[][],blocks: SynBlock[][],samples: Contig[]) {




    const allDbs = await indexedDB.databases()
    allDbs.forEach(async (db) => {
        if(db.name){
            try {
                await deleteDB(db.name, {
                    blocked() {
                        console.warn(`Deletion of "${dbName}" was blocked by an active tab connection.`);
                    }
                });
                console.log(`Successfully deleted database: ${dbName}`);
            } catch (err) {
                console.error(`Failed to delete database "${dbName}":`, err);
            }
        }
    })
    const tabSessionId = crypto.randomUUID();
    const dbName = `panblock-${tabSessionId}`;
    /*await deleteDB(dbName, {
        blocked() {
            console.warn('Database deletion blocked by an open connection in another tab.');
        }
    });*/
    // 1. Open database and create/upgrade schema
    const db = await openDB<PanblockDB>(dbName, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains('blocks')) {
                const store = db.createObjectStore('blocks', { keyPath: 'id' });
                // 2. Create the index on the 'age' property
                /*store.createIndex('line', 'line', { unique: false });
                store.createIndex('start_bp','startBp.bp', { unique: false });
                store.createIndex('end_bp','endBp.bp', { unique: false });*/
                store.createIndex('all',['line','startBp.bp','endBp.bp'],{ unique: false })
            }
            if (!db.objectStoreNames.contains('links')) {
                const store = db.createObjectStore('links', { keyPath: 'id' });
                // 2. Create the index on the 'age' property
                /*store.createIndex('from_line', 'fromLine', { unique: false });
                store.createIndex('to_line', 'toLine', { unique: false });
                store.createIndex('from_bp','fromBpIdx', { unique: false });
                store.createIndex('from_bp1','fromBpIdx1', { unique: false });
                store.createIndex('to_bp','toBpIdx', { unique: false });
                store.createIndex('to_bp1','toBpIdx1', { unique: false });*/
                store.createIndex('from_line_and_bp',['fromLine','fromBpIdx','fromBpIdx1'],{ unique: false });
                store.createIndex('to_line_and_bp',['toLine','toBpIdx','toBpIdx1'],{ unique: false })
            }
            if(!db.objectStoreNames.contains('contigs')) {
                const store = db.createObjectStore('contigs', { keyPath: 'idx' });
            }
        },
    });

    const blocksTx = db.transaction('blocks', 'readwrite');
    const blocksStore = blocksTx.objectStore('blocks');


    const linksTx = db.transaction('links', 'readwrite');
    const linksStore = linksTx.objectStore('links');

    const samplesTx = db.transaction('contigs', 'readwrite');
    const contigsStore = samplesTx.objectStore('contigs');

    await Promise.all([...blocks.map(bs => Promise.all(bs.map(async b => blocksStore.put(b)))),blocksTx.done,...links.map(bs => Promise.all(bs.map(async b => linksStore.put(b)))),linksTx.done,...samples.map(s=>contigsStore.put(s)),samplesTx.done])

    const blocksTx1 = db.transaction('blocks', 'readwrite');
    const blocksStore1 = blocksTx1.objectStore('blocks');
    const dbBlocks = blocksStore1.getAll();
    const toDelete:Array<SynBlock> = [];
    (await dbBlocks).map(async (block) => {
        console.log(block,await blocksStore1.index('all').getAll(IDBKeyRange.bound([block.line,block.startBp.bp,block.startBp.bp],[block.line,block.endBp.bp,block.endBp.bp],true,true)))
    })
    console.log(dbBlocks);
    return db;
}