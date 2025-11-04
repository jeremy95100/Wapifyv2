/**
 * Script to generate social media banner versions of the Wapify logo
 * Requires: node-canvas (npm install canvas)
 */

const { createCanvas, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

// Wapify brand colors (Terracotta/Coral)
const ACCENT_COLOR = '#CC785C';
const ACCENT_DARK = '#A6654A';
const BG_COLOR = '#F5F3EF'; // Matching app background
const TEXT_COLOR = '#2C1810'; // Matching app text color

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
  const fontSize = height * 0.22;
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  ctx.fillStyle = TEXT_COLOR;
  ctx.textBaseline = 'middle';

  const textX = logoX + logoSize + (height * 0.1);
  const textY = height / 2 - fontSize * 0.3;
  ctx.fillText('Wapify', textX, textY);

  // Draw main slogan - "Build Apps in Minutes, Not Months"
  const sloganFontSize = height * 0.095;
  ctx.font = `600 ${sloganFontSize}px Arial, sans-serif`;

  // Split into two parts for styling
  const part1 = 'Build Apps in ';
  const part2 = 'Minutes';
  const part3 = ', Not Months';

  const sloganY = textY + fontSize * 0.7;

  // Draw "Build Apps in " in regular text color
  ctx.fillStyle = TEXT_COLOR;
  ctx.fillText(part1, textX, sloganY);

  // Measure to position "Minutes" correctly
  const part1Width = ctx.measureText(part1).width;

  // Draw "Minutes" in accent color
  ctx.fillStyle = ACCENT_COLOR;
  ctx.fillText(part2, textX + part1Width, sloganY);

  // Measure to position ", Not Months" correctly
  const part2Width = ctx.measureText(part2).width;

  // Draw ", Not Months" in regular text color
  ctx.fillStyle = TEXT_COLOR;
  ctx.fillText(part3, textX + part1Width + part2Width, sloganY);

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
