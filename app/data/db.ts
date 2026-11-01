import {openDB, type DBSchema, deleteDB} from 'idb';
import {Contig, Link, type SynBlock} from "~/data/SynBlock";

export interface PanblockDB extends DBSchema {
    blocks: {
        key: number;
        value: SynBlock;
        indexes: { 'by-line': string }; // Define index name and the indexed property's type
    };
    links:{
        key: number;
        value: Link;
        //indexes: { 'by-line': string };
    }
    contigs:{
        key: number;
        value: Contig;
    }
}


export async function saveToDb(links: Link[][],blocks: SynBlock[][],samples: Contig[]) {


    const dbName = 'panblock-db';

    await deleteDB(dbName, {
        blocked() {
            console.warn('Database deletion blocked by an open connection in another tab.');
        }
    });
    // 1. Open database and create/upgrade schema
    const db = await openDB<PanblockDB>(dbName, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains('blocks')) {
                const store = db.createObjectStore('blocks', { keyPath: 'id' });
                // 2. Create the index on the 'age' property
                store.createIndex('by-line', 'line', { unique: false });
            }
        },
    });

    const blocksTx = db.transaction('blocks', 'readwrite');
    const blocksStore = blocksTx.objectStore('blocks');


    const linksTx = db.transaction('links', 'readwrite');
    const linksStore = linksTx.objectStore('links');

    const samplesTx = db.transaction('contigs', 'readwrite');
    const contigsStore = samplesTx.objectStore('contigs');

    await Promise.all([...blocks.map(bs => Promise.all(bs.map(async b => blocksStore.put(b)))),blocksTx.done,links.map(bs => Promise.all(bs.map(async b => linksStore.put(b)))),linksTx.done,samples.map(s=>contigsStore.put(s)),samplesTx.done])

    return db;
}