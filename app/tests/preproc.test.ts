import { describe, it, expect, beforeAll, vi } from 'vitest'


// 1. Extend the globalThis Interface rather than declaring a variable
declare global {
    interface typeofGlobalThis {
        compileTime: <T>(fnOrValue: (() => T) | T) => T;
    }
}

// 2. Force Vitest to execute the definition before static imports run
vi.hoisted(() => {
    (globalThis as any).compileTime = vi.fn((fnOrValue) => {
        return typeof fnOrValue === 'function' ? fnOrValue() : fnOrValue;
    });
});

describe('Data Preprocessing Pipeline', () => {
    let sampleData: any;
    beforeAll(async () => {
        // 2. Dynamically import AFTER globalThis.compileTime is guaranteed to exist
        const module = await import('~/data/preproc.compile');
        sampleData = module.sampleData;
    },0);

    it('should piss and fart', () => {
        //execSync('npm run build', { stdio: 'pipe' })
        const sheets = sampleData.data
        sheets
        //expect(Array.isArray(sheets)).toBe(true)
        // Confirm it accurately detects identifiers stripped of extensions
        //expect(sheets[0]).toHaveProperty('id')
        //expect(sheets[0]).toHaveProperty('path')
    })

})
