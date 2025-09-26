/**
 * The default 'Rabbit' theme definition for light and dark modes.
 */
const defaultTheme = {
    name: 'Rabbit',
    dark: {
        '--primary-color': '#ff7043',
        '--secondary-color': '#ff7043',
        '--bg-color': '#000000',
        '--header-bg-color': '#000000',
        '--item-bg': '#1c1c1c',
        '--item-bg-hover': '#2c2c2c',
        '--border-color': '#2a2a2a',
        '--font-color': '#e0e0e0',
        '--icon-color': '#7a7a7a',
        '--button-font-color': '#FFFFFF'
    },
    light: {
        '--primary-color': '#ff7043',
        '--secondary-color': '#ff7043',
        '--bg-color': '#f9f9f9',
        '--header-bg-color': '#f9f9f9',
        '--item-bg': '#ffffff',
        '--item-bg-hover': '#f0f0f0',
        '--border-color': '#e0e0e0',
        '--font-color': '#1c1c1c',
        '--icon-color': '#5c5c5c',
        '--button-font-color': '#FFFFFF'
    }
};

/**
 * Converts a CSS color name or hex string to an RGB array.
 * @param {string} name The color string (e.g., 'SteelBlue', '#3498db', 'f80').
 * @returns {number[]|null} An array [r, g, b] or null if invalid.
 */
function colorNameToRgb(name) {
    const s = name.trim();
    // 1. Check for HEX format (e.g., #ff8800, #f80, ff8800)
    const hexMatch = s.match(/^#?([a-f\d]{6}|[a-f\d]{3})$/i);
    if (hexMatch) {
        let hex = hexMatch[1];
        if (hex.length === 3) {
            hex = hex.split('').map(char => char + char).join('');
        }
        const bigint = parseInt(hex, 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return [r, g, b];
    }

    // 2. Fallback to CSS color name resolution
    const el = document.createElement('div');
    // Set a known, unique color that is unlikely to be the result of a valid name.
    const magicColor = 'rgb(1, 2, 3)';
    el.style.color = magicColor;
    try {
        document.body.appendChild(el);
        // Now, try to set the user's color.
        el.style.color = s; // Use the trimmed string
        const computedColor = window.getComputedStyle(el).color;
        // If the computed color is still our magic color, the name was invalid.
        if (computedColor === magicColor || computedColor === 'rgba(0, 0, 0, 0)' || computedColor === 'transparent') return null;
        const rgb = computedColor.match(/\d+/g).map(Number);
        return rgb;
    } finally {
        // Ensure the temporary element is always removed from the DOM.
        if (el.parentNode) {
            document.body.removeChild(el);
        }
    }
}

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h, s, l];
}

function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) { r = g = b = l; } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1; if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1 / 3);
    }
    return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}

/**
 * Applies a named modifier to HSL values.
 * @param {number[]} hsl - An array [h, s, l].
 * @param {string} modifier - The name of the modifier (e.g., 'vibrant', 'pastel').
 * @returns {number[]} The modified [h, s, l] array.
 */
function applyModifierToHsl([h, s, l], modifier) {
    const modifiers = {
        // name: [hueDelta, saturationMultiplier, lightnessMultiplier]
        vibrant: [0, 1.25, 1.0], pastel: [0, 0.5, 1.2], muted: [0, 0.3, 1.0],
        neon: [0, 1.75, 1.15], darker: [0, 1.0, 0.65], lighter: [0, 1.0, 1.3],
        rich: [0, 1.2, 0.8], faded: [0, 0.15, 1.25], deep: [0, 1.1, 0.45],
        dusty: [0, 0.4, 1.15], shaded: [0, 0.85, 0.7], bold: [0, 1.4, 1.05],
        warm: [20, 1.0, 1.0], cool: [-20, 1.0, 1.0], earthy: [10, 0.65, 0.9],
    };

    const mod = modifiers[modifier];
    if (!mod) return [h, s, l]; // Return original if modifier is unknown

    let [hDelta, sMult, lMult] = mod;

    // Apply Hue change (and wrap around if it goes beyond 0-360 degrees)
    let newH = (h * 360 + hDelta) / 360;
    newH = (newH % 1 + 1) % 1; // Ensures h is always between 0 and 1

    // Apply Saturation, clamping between 0 and 1
    let newS = Math.max(0, Math.min(1, s * sMult));

    // Apply Lightness, clamping between a safe range (0.05 to 0.95)
    // to prevent pure black or white, which can cause contrast issues.
    let newL = Math.max(0.05, Math.min(0.95, l * lMult));

    // Special override for 'bold' to ensure it's always impactful
    if (modifier === 'bold') {
        newL = Math.max(0.4, Math.min(0.65, newL));
    }

    return [newH, newS, newL];
}

function generatePaletteFromRgb(rgb, mode = 'dark', modifier = null) {
    const [r, g, b] = rgb;
    let [h, s, l] = rgbToHsl(r, g, b);

    if (modifier) {
        [h, s, l] = applyModifierToHsl([h, s, l], modifier);
    }

    const MIN_CONTRAST_RATIO = 4.5;

    if (mode === 'light') {
        let fontRgb = colorNameToRgb(hslToRgb(h, s * 0.6, 0.1));
        let bgHsl = [h, s * 0.2, 0.98]; // Initial light background HSL
        let bgRgb = colorNameToRgb(hslToRgb(...bgHsl));

        // Adjust background color until contrast is acceptable
        while (getContrast(fontRgb, bgRgb) < MIN_CONTRAST_RATIO && bgHsl[2] > 0.8) {
            bgHsl[2] -= 0.02; // Make background slightly darker
            bgRgb = colorNameToRgb(hslToRgb(...bgHsl));
        }

        const primaryColor = hslToRgb(h, s, l);
        const finalLuminance = getLuminance(colorNameToRgb(primaryColor));
        const buttonTextColor = finalLuminance > 0.5 ? '#000000' : '#FFFFFF';
        const secondaryColor = finalLuminance > 0.85 ? hslToRgb(...bgHsl) : primaryColor;

        return { '--primary-color': primaryColor, '--secondary-color': secondaryColor, '--bg-color': hslToRgb(...bgHsl), '--header-bg-color': hslToRgb(...bgHsl), '--item-bg': '#ffffff', '--item-bg-hover': hslToRgb(h, s * 0.1, 0.95), '--border-color': hslToRgb(h, s * 0.1, 0.88), '--font-color': hslToRgb(h, s * 0.6, 0.1), '--icon-color': hslToRgb(h, s * 0.3, 0.45), '--button-font-color': buttonTextColor };
    }

    // Dark Mode
    let fontRgb = [224, 224, 224]; // #e0e0e0
    let bgHsl = [h, s * 0.5, 0.07]; // Initial dark background HSL
    let bgRgb = colorNameToRgb(hslToRgb(...bgHsl));

    // Adjust background color until contrast is acceptable
    while (getContrast(fontRgb, bgRgb) < MIN_CONTRAST_RATIO && bgHsl[2] < 0.2) {
        bgHsl[2] += 0.01; // Make background slightly lighter
        bgRgb = colorNameToRgb(hslToRgb(...bgHsl));
    }

    const primaryColor = hslToRgb(h, s, l);
    const finalLuminance = getLuminance(colorNameToRgb(primaryColor));
    const buttonTextColor = finalLuminance > 0.5 ? '#000000' : '#FFFFFF';
    const secondaryColor = finalLuminance < 0.15 ? `rgb(${fontRgb.join(',')})` : primaryColor;

    return { '--primary-color': primaryColor, '--secondary-color': secondaryColor, '--bg-color': hslToRgb(...bgHsl), '--header-bg-color': hslToRgb(...bgHsl), '--item-bg': hslToRgb(h, s * 0.6, 0.12), '--item-bg-hover': hslToRgb(h, s * 0.6, 0.16), '--border-color': hslToRgb(h, s * 0.6, 0.18), '--font-color': `rgb(${fontRgb.join(',')})`, '--icon-color': hslToRgb(h, s * 0.3, 0.5), '--button-font-color': buttonTextColor };
}

/**
 * Calculates the WCAG relative luminance of an RGB color.
 * @param {number[]} rgb - An array [r, g, b] from 0-255.
 * @returns {number} The relative luminance (0 to 1).
 */
function getLuminance(rgb) {
    const a = rgb.map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * Calculates the contrast ratio between two RGB colors.
 * @param {number[]} rgb1 - The first color.
 * @param {number[]} rgb2 - The second color.
 * @returns {number} The contrast ratio.
 */
function getContrast(rgb1, rgb2) {
    const lum1 = getLuminance(rgb1);
    const lum2 = getLuminance(rgb2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
}
