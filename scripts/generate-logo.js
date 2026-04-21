const sharp = require('sharp');

// Create Logo (512x512)
const svgBuffer = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6"/>
      <stop offset="50%" style="stop-color:#8b5cf6"/>
      <stop offset="100%" style="stop-color:#ec4899"/>
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="512" height="512" rx="104" fill="url(#bg)"/>
  
  <!-- Sparkle Icon -->
  <text x="256" y="340" font-family="Arial, sans-serif" font-size="280" text-anchor="middle">✨</text>
</svg>
`;

sharp(Buffer.from(svgBuffer))
  .png()
  .toFile('public/logo.png')
  .then(() => console.log('✅ Logo created: public/logo.png'))
  .catch(err => console.error('❌ Error:', err));
