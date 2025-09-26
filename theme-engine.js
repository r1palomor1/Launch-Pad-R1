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

function colorNameToRgb(name) {
    const s = name.trim();
    const hexMatch = s.match(/^#?([a-f\d]{6}|[a-f\d]{3})$/i);
    if (hexMatch) {
        let hex = hexMatch[1];
        if (hex.length === 3) {
            hex = hex.split('').map(char => char + char).join('');
        }
        const bigint = parseInt(hex, 16);
        return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
    }
    const el = document.createElement('div');
    const magicColor = 'rgb(1, 2, 3)';
    el.style.color = magicColor;
    try {
        document.body.appendChild(el);
        el.style.color = s;
        const computedColor = window.getComputedStyle(el).color;
        if (computedColor === magicColor || computedColor === 'rgba(0, 0, 0, 0)' || computedColor === 'transparent') return null;
        return computedColor.match(/\d+/g).map(Number);
    } finally {
        if (el.parentNode) el.parentNode.removeChild(el);
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

function applyModifierToHsl([h, s, l], modifier) {
    const modifiers = {
        vibrant:    [0,    1.8,  1.0],
        bold:       [0,    2.0,  1.15],
        pastel:     [0,    0.5,  1.35],
        muted:      [0,    0.2,  0.8],
        neon:       [0,    2.5,  1.2],
        glow:       [0,    2.0,  1.3],
        metallic:   [-5,   0.15, 0.7],
        vintage:    [35,   0.4,  1.2],
        invert:     [180,  1.0,  1.0],
        darker:     [0,    1.0,  0.4],
        lighter:    [0,    1.0,  1.6],
        warm:       [30,   1.2,  1.0],
        cool:       [-30,  1.2,  1.0],
        monochrome: [0,    0,    1.0],
    };
    const mod = modifiers[modifier];
    if (!mod) return [h, s, l];
    let [hDelta, sMult, lMult] = mod;
    let newH = (h * 360 + hDelta) / 360;
    newH = (newH % 1 + 1) % 1;
    let newS = Math.max(0, Math.min(1, s * sMult));
    let newL = Math.max(0.05, Math.min(0.95, l * lMult));

    // Special override for bold to ensure it's always high-contrast
    if (modifier === 'bold') {
        newL = Math.max(0.45, Math.min(0.6, newL));
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
    const primaryColor = hslToRgb(h, s, l);
    const primaryRgb = colorNameToRgb(primaryColor);

    if (mode === 'light') {
        let fontHsl = [h, s * 0.8, 0.1]; // Dark, saturated font
        let bgHsl = [h, s * 0.1, 0.98];   // Very light, desaturated background

        // Special overrides for certain modifiers to create a more cohesive feel
        if (modifier === 'glow' || modifier === 'neon') {
            bgHsl = [h, 0, 1]; // Pure white background for max pop
            fontHsl = [h, 1, 0.05];
        } else if (modifier === 'pastel') {
            bgHsl = [h, 0.2, 0.97];
        } else if (modifier === 'metallic') {
            bgHsl = [h, 0.05, 0.95];
            fontHsl = [h, 0.1, 0.2];
        }

        let bgRgb = colorNameToRgb(hslToRgb(...bgHsl));
        let fontRgb = colorNameToRgb(hslToRgb(...fontHsl));
        
        while (getContrast(fontRgb, bgRgb) < MIN_CONTRAST_RATIO && bgHsl[2] > 0.8) {
            bgHsl[2] -= 0.02; // Make background slightly darker if contrast fails
            bgRgb = colorNameToRgb(hslToRgb(...bgHsl));
        }

        const buttonTextColor = getContrast(primaryRgb, [255, 255, 255]) > getContrast(primaryRgb, [0, 0, 0]) ? '#FFFFFF' : '#000000';
        
        return {
            '--primary-color': primaryColor,
            '--secondary-color': primaryColor, // Use primary for strong accent
            '--bg-color': hslToRgb(...bgHsl),
            '--header-bg-color': hslToRgb(...bgHsl),
            '--item-bg': '#ffffff',
            '--item-bg-hover': hslToRgb(h, s * 0.1, 0.95),
            '--border-color': hslToRgb(h, s * 0.1, 0.88),
            '--font-color': hslToRgb(...fontHsl),
            '--icon-color': hslToRgb(h, s * 0.3, 0.45),
            '--button-font-color': buttonTextColor
        };
    }

    // Dark Mode
    let fontHsl = [h, s * 0.15, 0.9]; // Light, slightly colored font
    let bgHsl = [h, s * 0.5, 0.05];   // Very dark, saturated background

    // Special overrides for certain modifiers
    if (modifier === 'glow' || modifier === 'neon') {
        bgHsl = [h, s, 0.02]; // Almost pure black for max pop
        fontHsl = [h, 0.1, 0.95];
    } else if (modifier === 'pastel') {
        bgHsl = [h, 0.2, 0.1];
    } else if (modifier === 'metallic') {
        bgHsl = [h, 0.1, 0.08];
        fontHsl = [h, 0.05, 0.8];
    }

    let bgRgb = colorNameToRgb(hslToRgb(...bgHsl));
    let fontRgb = colorNameToRgb(hslToRgb(...fontHsl));

    while (getContrast(fontRgb, bgRgb) < MIN_CONTRAST_RATIO && bgHsl[2] < 0.25) {
        bgHsl[2] += 0.01; // Make background slightly lighter if contrast fails
        bgRgb = colorNameToRgb(hslToRgb(...bgHsl));
    }

    const buttonTextColor = getContrast(primaryRgb, [255, 255, 255]) > getContrast(primaryRgb, [0, 0, 0]) ? '#FFFFFF' : '#000000';

    return {
        '--primary-color': primaryColor,
        '--secondary-color': primaryColor, // Use primary for strong accent
        '--bg-color': hslToRgb(...bgHsl),
        '--header-bg-color': hslToRgb(...bgHsl),
        '--item-bg': hslToRgb(h, s * 0.6, 0.12),
        '--item-bg-hover': hslToRgb(h, s * 0.6, 0.16),
        '--border-color': hslToRgb(h, s * 0.6, 0.18),
        '--font-color': hslToRgb(...fontHsl),
        '--icon-color': hslToRgb(h, s * 0.3, 0.5),
        '--button-font-color': buttonTextColor
    };
}

function getLuminance(rgb) {
    const a = rgb.map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrast(rgb1, rgb2) {
    if (!rgb1 || !rgb2) return 1; // Failsafe
    const lum1 = getLuminance(rgb1);
    const lum2 = getLuminance(rgb2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
}
