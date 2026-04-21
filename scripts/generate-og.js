const sharp = require('sharp');

// Create OG Image (1200x630)
const svgBuffer = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a0f"/>
      <stop offset="50%" style="stop-color:#12121a"/>
      <stop offset="100%" style="stop-color:#1a1a2e"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#3b82f6"/>
      <stop offset="50%" style="stop-color:#8b5cf6"/>
      <stop offset="100%" style="stop-color:#ec4899"/>
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  
  <!-- Decorative elements -->
  <circle cx="100" cy="100" r="200" fill="url(#accent)" opacity="0.1"/>
  <circle cx="1100" cy="530" r="150" fill="url(#accent)" opacity="0.1"/>
  
  <!-- Logo Icon -->
  <g transform="translate(540, 180)">
    <rect x="0" y="0" width="120" height="120" rx="24" fill="url(#accent)"/>
    <text x="60" y="85" font-family="Arial, sans-serif" font-size="70" font-weight="bold" fill="white" text-anchor="middle">✨</text>
  </g>
  
  <!-- Title -->
  <text x="600" y="380" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="white" text-anchor="middle">CleanRefactor AI</text>
  
  <!-- Subtitle -->
  <text x="600" y="450" font-family="Arial, sans-serif" font-size="32" fill="#94a3b8" text-anchor="middle">Transform messy code into clean masterpieces</text>
  
  <!-- Features -->
  <text x="600" y="520" font-family="Arial, sans-serif" font-size="24" fill="#64748b" text-anchor="middle">JavaScript • TypeScript • Execution Order Analysis</text>
</svg>
`;

sharp(Buffer.from(svgBuffer))
  .png()
  .toFile('public/og-image.png')
  .then(() => console.log('✅ OG Image created: public/og-image.png'))
  .catch(err => console.error('❌ Error:', err));
