'use strict';
// Brand images drawn in code (no binary files): the teal "M" tile used as icon and as the social share card.
const zlib = require('zlib');

const CRC = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
}
function png(w, h, px) { // px: RGB buffer, w*h*3
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) px.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3);
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

const TEAL = [15, 118, 110], WHITE = [255, 255, 255], PAPER = [244, 243, 239];
// Is (x, y) inside an "M" that fits the box (bx, by, bs)? Two stems and a V.
function inM(x, y, bx, by, bs) {
  const u = (x - bx) / bs, v = (y - by) / bs;
  if (u < 0 || u > 1 || v < 0 || v > 1) return false;
  const s = 0.18;
  if (u < s || u > 1 - s) return true;
  const d1 = Math.abs(v - (u - s) / (0.5 - s) * 0.62) , d2 = Math.abs(v - (1 - u - s) / (0.5 - s) * 0.62);
  return (u <= 0.5 ? d1 : d2) < 0.12;
}
// Draws a teal rounded-corner tile with the M at (tx, ty) of size ts onto a canvas filled with bg.
function draw(w, h, bg, tx, ty, ts, radius) {
  const px = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let r = 0, g = 0, b = 0;
    for (let sy = 0; sy < 2; sy++) for (let sx = 0; sx < 2; sx++) {
      const X = x + sx / 2 + 0.25, Y = y + sy / 2 + 0.25;
      let c = bg;
      const ix = X - tx, iy = Y - ty;
      if (ix >= 0 && iy >= 0 && ix <= ts && iy <= ts) {
        const cx = Math.min(ix, ts - ix), cy = Math.min(iy, ts - iy);
        const inside = cx >= radius || cy >= radius || ((radius - cx) ** 2 + (radius - cy) ** 2) <= radius * radius;
        if (inside) c = inM(X, Y, tx + ts * 0.22, ty + ts * 0.24, ts * 0.56) ? WHITE : TEAL;
      }
      r += c[0]; g += c[1]; b += c[2];
    }
    const i = (y * w + x) * 3; px[i] = r >> 2; px[i + 1] = g >> 2; px[i + 2] = b >> 2;
  }
  return png(w, h, px);
}

module.exports = {
  '/icon-512.png': draw(512, 512, TEAL, 0, 0, 512, 0),
  '/apple-touch-icon.png': draw(180, 180, TEAL, 0, 0, 180, 0),
  '/og.png': draw(1200, 630, PAPER, 470, 165, 260, 14)
};
