const path = require('path');
const Jimp = require('../node_modules/jimp');

async function main() {

  const size = 1024;
  // Initialize Jimp with a complete raw RGBA bitmap. This works consistently
  // across the Jimp version bundled with the mini program workspace.
  const image = new Jimp({
    data: Buffer.alloc(size * size * 4),
    width: size,
    height: size,
  });
  for (let index = 0; index < image.bitmap.data.length; index += 4) {
    image.bitmap.data.writeUInt32BE(0x315c4dff, index);
  }
const colors = {
  transparent: Jimp.rgbaToInt(0, 0, 0, 0),
  ivory: Jimp.rgbaToInt(247, 244, 236, 255),
  ring: Jimp.rgbaToInt(231, 239, 234, 42),
  coral: Jimp.rgbaToInt(199, 103, 85, 255),
};
const set = (x, y, color) => {
  if (x >= 0 && x < size && y >= 0 && y < size) image.bitmap.data.writeUInt32BE(color, (y * size + x) * 4);
};
const circleStroke = (cx, cy, radius, thickness, color) => {
  const outer = radius + thickness / 2;
  const inner = radius - thickness / 2;
  for (let y = Math.floor(cy - outer); y <= Math.ceil(cy + outer); y += 1) {
    for (let x = Math.floor(cx - outer); x <= Math.ceil(cx + outer); x += 1) {
      const distance = Math.hypot(x - cx, y - cy);
      if (distance >= inner && distance <= outer) set(x, y, color);
    }
  }
};
const fillCircle = (cx, cy, radius, color) => {
  for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y += 1) {
    for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x += 1) {
      if (Math.hypot(x - cx, y - cy) <= radius) set(x, y, color);
    }
  }
};

// Match the 228px corner radius of the SVG source artwork.
const cornerRadius = 228;
for (let y = 0; y < cornerRadius; y += 1) {
  for (let x = 0; x < cornerRadius; x += 1) {
    const inCorner = Math.hypot(x - cornerRadius, y - cornerRadius) <= cornerRadius;
    const mirrored = [
      [x, y],
      [size - 1 - x, y],
      [x, size - 1 - y],
      [size - 1 - x, size - 1 - y],
    ];
    if (!inCorner) mirrored.forEach(([px, py]) => set(px, py, colors.transparent));
  }
}

const cubic = (p0, p1, p2, p3, steps = 32) => {
  const points = [];
  for (let index = 0; index <= steps; index += 1) {
    const t = index / steps;
    const inverse = 1 - t;
    points.push({
      x: inverse ** 3 * p0.x + 3 * inverse ** 2 * t * p1.x + 3 * inverse * t ** 2 * p2.x + t ** 3 * p3.x,
      y: inverse ** 3 * p0.y + 3 * inverse ** 2 * t * p1.y + 3 * inverse * t ** 2 * p2.y + t ** 3 * p3.y,
    });
  }
  return points;
};

const pointInPolygon = (x, y, polygon) => {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const currentPoint = polygon[index];
    const previousPoint = polygon[previous];
    const intersects = currentPoint.y > y !== previousPoint.y > y
      && x < ((previousPoint.x - currentPoint.x) * (y - currentPoint.y))
        / (previousPoint.y - currentPoint.y) + currentPoint.x;
    if (intersects) inside = !inside;
  }
  return inside;
};

circleStroke(512, 512, 332, 34, colors.ring);
circleStroke(430, 512, 196, 52, colors.ivory);
circleStroke(594, 512, 196, 52, colors.ivory);

// Rasterize the same cubic path used by brand-avatar.svg so both assets match.
const heart = [
  { x: 512, y: 438 },
  ...cubic({ x: 512, y: 438 }, { x: 535, y: 402 }, { x: 585, y: 392 }, { x: 616, y: 422 }),
  ...cubic({ x: 616, y: 422 }, { x: 647, y: 452 }, { x: 642, y: 503 }, { x: 607, y: 538 }),
  { x: 512, y: 634 },
  { x: 417, y: 538 },
  ...cubic({ x: 417, y: 538 }, { x: 382, y: 503 }, { x: 377, y: 452 }, { x: 408, y: 422 }),
  ...cubic({ x: 408, y: 422 }, { x: 439, y: 392 }, { x: 489, y: 402 }, { x: 512, y: 438 }),
];

for (let y = 390; y <= 650; y += 1) {
  for (let x = 380; x <= 644; x += 1) {
    if (pointInPolygon(x + 0.5, y + 0.5, heart)) set(x, y, colors.coral);
  }
}
fillCircle(512, 438, 13, colors.ivory);

  const outputPath = path.join(__dirname, '..', 'assets', 'brand-avatar.png');
  await image.writeAsync(outputPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
