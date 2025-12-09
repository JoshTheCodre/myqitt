#!/usr/bin/env node

/**
 * Favicon Generator Script
 * Creates favicon.png from qitt-logo-symbol-final.png
 * Uses sharp to resize to 32x32
 */

const sharp = require('sharp');
const path = require('path');

const SYMBOL_PATH = path.join(__dirname, '../public/qitt-logo-symbol.png');
const OUTPUT_PATH = path.join(__dirname, '../public/favicon.ico');

async function generateFavicon() {
  try {
    console.log('📦 Generating favicon.png from symbol icon...');

    // Create a 32x32 favicon from symbol
    await sharp(SYMBOL_PATH)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .toFormat('png')
      .toFile(OUTPUT_PATH.replace('.ico', '.png'));

    console.log('✅ Created favicon.png (32x32)\n');
    console.log('Note: For a true .ico file, you may want to:');
    console.log('1. Use an online converter like favicon.io');
    console.log('2. Or use the favicon.png as favicon via <link rel="icon" href="/favicon.png" />');

  } catch (error) {
    console.error('❌ Error generating favicon:', error.message);
    process.exit(1);
  }
}

generateFavicon();
