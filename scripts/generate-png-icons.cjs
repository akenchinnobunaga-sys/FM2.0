const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'binary');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function createPng(width, height, drawFn) {
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y++) {
    rawData[y * rowSize] = 0;
    for (let x = 0; x < width; x++) {
      const idx = y * rowSize + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[idx] = r;
      rawData[idx + 1] = g;
      rawData[idx + 2] = b;
      rawData[idx + 3] = a;
    }
  }
  const compressed = zlib.deflateSync(rawData);
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function getPixel(x, y, w, h, isMaskable = false) {
  const nx = x / w;
  const ny = y / h;

  // Maskable has edge bleed background, no rounded corner clipping
  if (!isMaskable) {
    // Round corner check (squircle rx = 0.22)
    const cornerR = 0.22;
    let dx = 0;
    let dy = 0;
    if (nx < cornerR) dx = cornerR - nx;
    else if (nx > 1 - cornerR) dx = nx - (1 - cornerR);
    if (ny < cornerR) dy = cornerR - ny;
    else if (ny > 1 - cornerR) dy = ny - (1 - cornerR);
    if (dx * dx + dy * dy > cornerR * cornerR) {
      return [0, 0, 0, 0]; // Transparent outside squircle
    }
  }

  // Base emerald gradient
  const gradT = (nx + ny) * 0.5;
  let r = Math.round(5 + gradT * (16 - 5));
  let g = Math.round(150 + gradT * (185 - 150));
  let b = Math.round(105 + gradT * (129 - 105));

  // Central icon rendering
  const scale = isMaskable ? 0.72 : 0.85;
  const cx = 0.5;
  const cy = 0.5;
  const lx = (nx - cx) / scale + 0.5;
  const ly = (ny - cy) / scale + 0.5;

  // Inner card / wallet shape
  if (lx >= 0.28 && lx <= 0.72 && ly >= 0.26 && ly <= 0.74) {
    const cardCorner = 0.08;
    let cdx = 0;
    let cdy = 0;
    if (lx < 0.28 + cardCorner) cdx = 0.28 + cardCorner - lx;
    else if (lx > 0.72 - cardCorner) cdx = lx - (0.72 - cardCorner);
    if (ly < 0.26 + cardCorner) cdy = 0.26 + cardCorner - ly;
    else if (ly > 0.74 - cardCorner) cdy = ly - (0.74 - cardCorner);

    if (cdx * cdx + cdy * cdy <= cardCorner * cardCorner) {
      // Inside card: white background
      r = 255;
      g = 255;
      b = 255;

      // Card header bar
      if (ly >= 0.35 && ly <= 0.39 && lx >= 0.34 && lx <= 0.66) {
        r = 16;
        g = 185;
        b = 129;
      }

      // Upward trend line segment
      // segment 1: (0.35, 0.64) to (0.44, 0.55)
      // segment 2: (0.44, 0.55) to (0.52, 0.60)
      // segment 3: (0.52, 0.60) to (0.65, 0.46)
      const distToSeg = (px, py, x1, y1, x2, y2) => {
        const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
        if (l2 === 0) return Math.hypot(px - x1, py - y1);
        let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
      };

      const d1 = distToSeg(lx, ly, 0.35, 0.64, 0.44, 0.54);
      const d2 = distToSeg(lx, ly, 0.44, 0.54, 0.52, 0.59);
      const d3 = distToSeg(lx, ly, 0.52, 0.59, 0.65, 0.46);
      const lineDist = Math.min(d1, d2, d3);

      if (lineDist < 0.024) {
        r = 16;
        g = 185;
        b = 129;
      }
    }
  }

  // Golden Coin Badge top right
  const coinDist = Math.hypot(lx - 0.70, ly - 0.36);
  if (coinDist < 0.12) {
    // Gold coin
    if (coinDist < 0.10) {
      r = 245;
      g = 158;
      b = 11;
      // Simple inner highlight for dollar symbol
      if (Math.abs(lx - 0.70) < 0.015 && ly >= 0.30 && ly <= 0.42) {
        r = 120;
        g = 53;
        b = 15;
      }
      if (Math.abs(ly - 0.36) < 0.015 && lx >= 0.66 && lx <= 0.74) {
        r = 120;
        g = 53;
        b = 15;
      }
    } else {
      // White coin border
      r = 255;
      g = 255;
      b = 255;
    }
  }

  return [r, g, b, 255];
}

const outDir = path.join(__dirname, '../public/icons');
fs.mkdirSync(outDir, { recursive: true });

console.log('Generating 192x192 PNG...');
const png192 = createPng(192, 192, (x, y, w, h) => getPixel(x, y, w, h, false));
fs.writeFileSync(path.join(outDir, 'icon-192.png'), png192);

console.log('Generating 512x512 PNG...');
const png512 = createPng(512, 512, (x, y, w, h) => getPixel(x, y, w, h, false));
fs.writeFileSync(path.join(outDir, 'icon-512.png'), png512);

console.log('Generating 512x512 Maskable PNG...');
const pngMaskable = createPng(512, 512, (x, y, w, h) => getPixel(x, y, w, h, true));
fs.writeFileSync(path.join(outDir, 'icon-maskable-512.png'), pngMaskable);

console.log('Generating 180x180 Apple Touch Icon PNG...');
const pngApple = createPng(180, 180, (x, y, w, h) => getPixel(x, y, w, h, false));
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), pngApple);
fs.writeFileSync(path.join(__dirname, '../public/apple-touch-icon.png'), pngApple);

// Generate favicon (32x32 PNG)
const favicon = createPng(32, 32, (x, y, w, h) => getPixel(x, y, w, h, false));
fs.writeFileSync(path.join(__dirname, '../public/favicon.ico'), favicon);

console.log('All icons successfully created in /public/icons!');
