

// Explicitly type the configurations for the HSL generator
export interface ColorGeneratorOptions {
    saturation?: number; // 0 to 100
    lightness?: number;  // 0 to 100
}

export function getInfiniteHexColor(index: number, options: ColorGeneratorOptions = {}): string {
    const { saturation = 70, lightness = 55 } = options;

    // 1. Calculate perfectly distributed hue using the Golden Ratio
    const goldenRatioConjugate = 0.618033988749895;
    const hue = ((index * goldenRatioConjugate) % 1) * 360;

    // 2. Convert HSL parameters to fractional scales
    const s = saturation / 100;
    const l = lightness / 100;

    // 3. HSL to RGB conversion algorithm
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
    const m = l - c / 2;

    let r = 0, g = 0, b = 0;

    if (0 <= hue && hue < 60) {
        [r, g, b] = [c, x, 0];
    } else if (60 <= hue && hue < 120) {
        [r, g, b] = [x, c, 0];
    } else if (120 <= hue && hue < 180) {
        [r, g, b] = [0, c, x];
    } else if (180 <= hue && hue < 240) {
        [r, g, b] = [0, x, c];
    } else if (240 <= hue && hue < 300) {
        [r, g, b] = [x, 0, c];
    } else if (300 <= hue && hue < 360) {
        [r, g, b] = [c, 0, x];
    }

    // 4. Convert values to 0-255 range and map to Hex strings
    const toHex = (val: number): string => {
        const channel = Math.round((val + m) * 255);
        return channel.toString(16).padStart(2, '0');
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}