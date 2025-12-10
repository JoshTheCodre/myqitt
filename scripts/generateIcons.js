#!/usr/bin/env node

/**
 * Icon Generator Script
 * Converts qitt-logo-symbol-final.png to PWA icons
 * Uses sharp library for reliable PNG resizing
 * Usage: npm run generate-icons
 */

const sharp = require('sharp');
const path = require('path');

const SYMBOL_PATH = path.join(__dirname, '../public/qitt-logo-symbol.png');
const OUTPUT_DIR = path.join(__dirname, '../public');

const SIZES = [
  { width: 192, height: 192, name: 'icon-192x192.png' },
  { width: 512, height: 512, name: 'icon-512x512.png' },
];

async function generateIcons() {
  try {
    console.log('📦 Generating PWA icons from symbol icon...\n');

    for (const { width, height, name } of SIZES) {
      const outputPath = path.join(OUTPUT_DIR, name);
      
      console.log(`Creating ${name} (${width}×${height})...`);

      // Create icon with more padding to prevent zoom appearance
      const symbolSize = Math.floor(width * 0.6); // Use 60% of the icon size for more padding
      
      await sharp(SYMBOL_PATH)
        .resize(symbolSize, symbolSize, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }, // Transparent background for symbol
        })
        .extend({
          top: Math.floor((height - symbolSize) / 2),
          bottom: Math.floor((height - symbolSize) / 2),
          left: Math.floor((width - symbolSize) / 2),
          right: Math.floor((width - symbolSize) / 2),
          background: { r: 255, g: 255, b: 255, alpha: 1 } // White background for final icon
        })
        .png()
        .toFile(outputPath);

      console.log(`✅ Created ${name}`);
    }

    console.log('\n✨ All icons generated successfully!\n');
    console.log('Generated files:');
    SIZES.forEach(({ name }) => {
      console.log(`  - public/${name}`);
    });
    console.log('\nManifest.json is already configured with these icon paths.');

  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    console.error('\nMake sure you have sharp installed:');
    console.error('  npm install sharp --save-dev');
    process.exit(1);
  }
}

generateIcons();
