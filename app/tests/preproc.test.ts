import { describe, it, expect, beforeAll, vi } from 'vitest'
import { sheetsData } from '~/data/preproc.compile'
import {execSync} from "node:child_process";

describe('Data Preprocessing Pipeline', () => {
    it('should piss and fart', () => {
        //execSync('npm run build', { stdio: 'pipe' })
        const sheets = sheetsData()

        //expect(Array.isArray(sheets)).toBe(true)
        // Confirm it accurately detects identifiers stripped of extensions
        //expect(sheets[0]).toHaveProperty('id')
        //expect(sheets[0]).toHaveProperty('path')
    })

})
