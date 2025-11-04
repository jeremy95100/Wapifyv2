/**
 * Script to generate PNG versions of the Wapify logo
 * Requires: node-canvas (npm install canvas)
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Wapify brand colors (Terracotta/Coral)
const ACCENT_COLOR = '#CC785C'; // wapify-accent
const ACCENT_DARK = '#A6654A'; // wapify-accent-dark

// Logo sizes for different use cases
const sizes = [
  { name: 'icon-small', size: 64, desc: 'Small icon (64x64)' },
  { name: 'icon-medium', size: 128, desc: 'Medium icon (128x128)' },
  { name: 'icon-large', size: 256, desc: 'Large icon (256x256)' },
  { name: 'icon-xlarge', size: 512, desc: 'Extra large icon (512x512)' },
  { name: 'social-square', size: 1200, desc: 'Social media square (1200x1200)' },
];

// Function to draw the lightning bolt path
function drawLightningBolt(ctx, scale = 1) {
  // Path: M13 10V3L4 14h7v7l9-11h-7z
  // Normalized to 0-24 coordinate system, scaled by scale factor
  ctx.beginPath();

  const s = scale;

  // M13 10 (Move to)
  ctx.moveTo(13 * s, 10 * s);

  // V3 (Vertical line to)
  ctx.lineTo(13 * s, 3 * s);

  // L4 14 (Line to)
  ctx.lineTo(4 * s, 14 * s);

  // h7 (Horizontal relative)
  ctx.lineTo(11 * s, 14 * s);

  // v7 (Vertical relative)
  ctx.lineTo(11 * s, 21 * s);

  // l9-11 (Line relative)
  ctx.lineTo(20 * s, 10 * s);

  // h-7 (Horizontal relative)
  ctx.lineTo(13 * s, 10 * s);

  ctx.closePath();
}

// Generate PNG with gradient background
function generateLogoWithBackground(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, ACCENT_COLOR);
  gradient.addColorStop(1, ACCENT_DARK);

  // Draw rounded rectangle background
  const radius = size * 0.2;
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, radius);
  ctx.fill();

  // Draw lightning bolt in white
  const padding = size * 0.25;
  const iconSize = size - (padding * 2);
  const scale = iconSize / 24;

  ctx.save();
  ctx.translate(padding, padding);

  drawLightningBolt(ctx, scale);

  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2.5 * scale;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  ctx.restore();

  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
  console.log(`✓ Generated: ${filename} (${size}x${size})`);
}

// Generate PNG with transparent background
function generateLogoTransparent(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Draw lightning bolt with gradient
  const scale = size / 24;

  drawLightningBolt(ctx, scale);

  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, ACCENT_COLOR);
  gradient.addColorStop(1, ACCENT_DARK);

  ctx.strokeStyle = gradient;
  ctx.lineWidth = 2.5 * scale;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
  console.log(`✓ Generated: ${filename} (${size}x${size}) - transparent`);
}

// Main execution
console.log('🎨 Generating Wapify logo PNG files...\n');

const outputDir = __dirname;

// Generate logos with background
console.log('With gradient background:');
sizes.forEach(({ name, size, desc }) => {
  const filename = path.join(outputDir, `wapify-logo-${name}.png`);
  generateLogoWithBackground(size, filename);
});

console.log('\nWith transparent background:');
sizes.forEach(({ name, size, desc }) => {
  const filename = path.join(outputDir, `wapify-logo-${name}-transparent.png`);
  generateLogoTransparent(size, filename);
});

console.log('\n✅ All PNG files generated successfully!');
console.log('\nFiles created:');
console.log('- With background: wapify-logo-{size}.png');
console.log('- Transparent: wapify-logo-{size}-transparent.png');
