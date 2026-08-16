const path = require('path');
const Jimp = require('../node_modules/jimp');

const size = 1024;
const colors = {
  background: Jimp.cssColorToHex('#F7C7A8'),
  coral: Jimp.cssColorToHex('#D96D5B'),
  amber: Jimp.cssColorToHex('#E3A84F'),
  cream: Jimp.cssColorToHex('#FFF8EF'),
  transparent: Jimp.rgbaToInt(0, 0, 0, 0),
};

const image = new Jimp({ data: Buffer.alloc(size * size * 4), width: size, height: size });
for (let index = 0; index < image.bitmap.data.length; index += 4) {
  image.bitmap.data.writeUInt32BE(colors.background, index);
}

const set = (x, y, value) => {
  if (x >= 0 && x < size && y >= 0 && y < size) {
    image.bitmap.data.writeUInt32BE(value, (y * size + x) * 4);
  }
};

const cornerRadius = 220;
for (let y = 0; y < cornerRadius; y += 1) {
  for (let x = 0; x < cornerRadius; x += 1) {
    if (Math.hypot(x - cornerRadius, y - cornerRadius) > cornerRadius) {
      [[x, y], [size - 1 - x, y], [x, size - 1 - y], [size - 1 - x, size - 1 - y]]
        .forEach(([px, py]) => set(px, py, colors.transparent));
    }
  }
}

const circleStroke = (cx, cy, radius, width, value) => {
  const outer = radius + width / 2;
  const inner = radius - width / 2;
  for (let y = Math.floor(cy - outer); y <= Math.ceil(cy + outer); y += 1) {
    for (let x = Math.floor(cx - outer); x <= Math.ceil(cx + outer); x += 1) {
      const distance = Math.hypot(x - cx, y - cy);
      if (distance >= inner && distance <= outer) set(x, y, value);
    }
  }
};

const fillCircle = (cx, cy, radius, value) => {
  for (let y = cy - radius; y <= cy + radius; y += 1) {
    for (let x = cx - radius; x <= cx + radius; x += 1) {
      if (Math.hypot(x - cx, y - cy) <= radius) set(x, y, value);
    }
  }
};

const fillPolygon = (points, value) => {
  const minX = Math.floor(Math.min(...points.map((point) => point.x)));
  const maxX = Math.ceil(Math.max(...points.map((point) => point.x)));
  const minY = Math.floor(Math.min(...points.map((point) => point.y)));
  const maxY = Math.ceil(Math.max(...points.map((point) => point.y)));
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      let inside = false;
      for (let index = 0, previous = points.length - 1; index < points.length; previous = index++) {
        const current = points[index];
        const prior = points[previous];
        if ((current.y > y) !== (prior.y > y)
          && x < ((prior.x - current.x) * (y - current.y)) / (prior.y - current.y) + current.x) inside = !inside;
      }
      if (inside) set(x, y, value);
    }
  }
};

circleStroke(416, 512, 190, 64, colors.coral);
circleStroke(608, 512, 190, 64, colors.amber);
fillPolygon([
  { x: 748, y: 286 }, { x: 761, y: 312 }, { x: 787, y: 325 }, { x: 761, y: 338 },
  { x: 748, y: 364 }, { x: 735, y: 338 }, { x: 709, y: 325 }, { x: 735, y: 312 },
], colors.cream);

const workspaceRoot = path.join(__dirname, '..', '..');
const output = path.join(workspaceRoot, 'assets', '87c811c8-6e37-42cb-9ad7-fd0e691bcaca-miniapp-avatar.png');
image.writeAsync(output).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
