/**
 * Script to generate social media banner versions of the Wapify logo
 * Requires: node-canvas (npm install canvas)
 */

const { createCanvas, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

// Wapify brand colors (Indigo/Purple)
const ACCENT_COLOR = '#6366f1';
const ACCENT_DARK = '#4f46e5';
const BG_COLOR = '#0f0f1a';
const TEXT_COLOR = '#ffffff';

// Social media banner sizes
const banners = [
  { name: 'twitter-header', width: 1500, height: 500, desc: 'Twitter/X header' },
  { name: 'facebook-cover', width: 820, height: 312, desc: 'Facebook cover' },
  { name: 'linkedin-banner', width: 1584, height: 396, desc: 'LinkedIn banner' },
  { name: 'instagram-post', width: 1080, height: 1080, desc: 'Instagram post' },
  { name: 'discord-banner', width: 960, height: 540, desc: 'Discord server banner' },
];

// Function to draw the lightning bolt path
function drawLightningBolt(ctx, scale = 1) {
  ctx.beginPath();
  const s = scale;
  ctx.moveTo(13 * s, 10 * s);
  ctx.lineTo(13 * s, 3 * s);
  ctx.lineTo(4 * s, 14 * s);
  ctx.lineTo(11 * s, 14 * s);
  ctx.lineTo(11 * s, 21 * s);
  ctx.lineTo(20 * s, 10 * s);
  ctx.lineTo(13 * s, 10 * s);
  ctx.closePath();
}

// Generate social media banner
function generateBanner(width, height, filename) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, width, height);

  // Calculate logo size (proportional to height)
  const logoSize = height * 0.4;
  const scale = logoSize / 24;

  // Position logo and text centered
  const logoX = width * 0.35;
  const logoY = (height - logoSize) / 2;

  // Draw logo with gradient background
  const logoBoxSize = logoSize * 1.2;
  const logoBoxX = logoX - (logoBoxSize - logoSize) / 2;
  const logoBoxY = logoY - (logoBoxSize - logoSize) / 2;

  const gradient = ctx.createLinearGradient(logoBoxX, logoBoxY, logoBoxX + logoBoxSize, logoBoxY + logoBoxSize);
  gradient.addColorStop(0, ACCENT_COLOR);
  gradient.addColorStop(1, ACCENT_DARK);

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(logoBoxX, logoBoxY, logoBoxSize, logoBoxSize, logoSize * 0.15);
  ctx.fill();

  // Draw lightning bolt
  ctx.save();
  ctx.translate(logoX, logoY);
  drawLightningBolt(ctx, scale);
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2.5 * scale;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();

  // Draw "Wapify" text
  const fontSize = height * 0.25;
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  ctx.fillStyle = TEXT_COLOR;
  ctx.textBaseline = 'middle';

  const textX = logoX + logoSize + (height * 0.1);
  const textY = height / 2;
  ctx.fillText('Wapify', textX, textY);

  // Draw tagline
  const taglineFontSize = height * 0.08;
  ctx.font = `${taglineFontSize}px Arial, sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  const tagline = 'Build Apps in Minutes';
  ctx.fillText(tagline, textX, textY + fontSize * 0.6);

  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
  console.log(`✓ Generated: ${filename} (${width}x${height})`);
}

// Main execution
console.log('🎨 Generating Wapify social media banners...\n');

const outputDir = __dirname;

banners.forEach(({ name, width, height, desc }) => {
  const filename = path.join(outputDir, `wapify-${name}.png`);
  console.log(`Creating ${desc}...`);
  generateBanner(width, height, filename);
});

console.log('\n✅ All banner files generated successfully!');
console.log('\nRecommended usage:');
console.log('- Twitter/X: wapify-twitter-header.png');
console.log('- Facebook: wapify-facebook-cover.png');
console.log('- LinkedIn: wapify-linkedin-banner.png');
console.log('- Instagram: wapify-instagram-post.png');
console.log('- Discord: wapify-discord-banner.png');
