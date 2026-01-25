#!/usr/bin/env node

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const INPUT_FILE = path.join(__dirname, '../public/icons/pin.png');
const OUTPUT_FILE = path.join(__dirname, '../public/icons/pin_yellow.png');

// Color conversion: Red (#EE5A47) to Yellow (#FFD700)
// We'll use HSL color space for hue rotation to preserve saturation and lightness

async function convertPinToYellow() {
  try {
    // Verify input file exists
    if (!fs.existsSync(INPUT_FILE)) {
      console.error(`Error: Input file not found: ${INPUT_FILE}`);
      process.exit(1);
    }

    console.log(`Converting pin color from red to yellow...`);
    console.log(`Input:  ${INPUT_FILE}`);
    console.log(`Output: ${OUTPUT_FILE}`);

    const image = sharp(INPUT_FILE);
    const metadata = await image.metadata();

    console.log(`Image size: ${metadata.width}x${metadata.height}px`);

    // Read raw pixel data
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

    // Process pixels: convert red hues to yellow
    // Red range: H ~0° (hue), yellow range: H ~60°
    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = info.channels === 4 ? data[i + 3] : 255;

      // Skip transparent pixels
      if (a === 0) continue;

      // Skip gray/black pixels (used for the needle)
      // Gray pixels have R ~= G ~= B
      if (Math.abs(r - g) < 20 && Math.abs(g - b) < 20) continue;

      // Skip white highlights (keep them white)
      if (r > 240 && g > 240 && b > 240) continue;

      // Convert RGB to HSL
      const [h, s, l] = rgbToHsl(r, g, b);

      // If pixel is in red hue range (0-15° or 345-360°), shift to yellow (60°)
      if (h <= 15 || h >= 345) {
        // Rotate hue to yellow (60°)
        const newHue = 60;
        const [newR, newG, newB] = hslToRgb(newHue, s, l);

        data[i] = Math.round(newR);
        data[i + 1] = Math.round(newG);
        data[i + 2] = Math.round(newB);
      }
    }

    // Convert back to PNG and save
    await sharp(data, {
      raw: {
        width: info.width,
        height: info.height,
        channels: info.channels
      }
    })
      .toFile(OUTPUT_FILE);

    console.log(`✓ Successfully converted pin to yellow and saved to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('Error converting pin:', error);
    process.exit(1);
  }
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
      default:
        h = 0;
    }
  }

  return [h * 360, s * 100, l * 100];
}

function hslToRgb(h, s, l) {
  h /= 360;
  s /= 100;
  l /= 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [r * 255, g * 255, b * 255];
}

convertPinToYellow();
