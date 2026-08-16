const path = require('path');
const Jimp = require('../node_modules/jimp');

const size = 1024;
const colors = {
  green: Jimp.rgbaToInt(23, 107, 91, 255),
  deepGreen: Jimp.rgbaToInt(14, 63, 54, 255),
  ivory: Jimp.rgbaToInt(247, 244, 236, 255),
  mint: Jimp.rgbaToInt(189, 230, 213, 255),
  coral: Jimp.rgbaToInt(231, 122, 100, 255),
  amber: Jimp.rgbaToInt(217, 164, 65, 255),
  transparent: Jimp.rgbaToInt(0, 0, 0, 0),
};

const makeImage = (background, radius = 220) => {
  const image = new Jimp({ data: Buffer.alloc(size * size * 4), width: size, height: size });
  for (let index = 0; index < image.bitmap.data.length; index += 4) image.bitmap.data.writeUInt32BE(background, index);
  const set = (x, y, color) => {
    if (x >= 0 && x < size && y >= 0 && y < size) image.bitmap.data.writeUInt32BE(color, (y * size + x) * 4);
  };
  for (let y = 0; y < radius; y += 1) {
    for (let x = 0; x < radius; x += 1) {
      if (Math.hypot(x - radius, y - radius) > radius) {
        [[x, y], [size - 1 - x, y], [x, size - 1 - y], [size - 1 - x, size - 1 - y]]
          .forEach(([px, py]) => set(px, py, colors.transparent));
      }
    }
  }
  return { image, set };
};

const fillCircle = (set, cx, cy, radius, color) => {
  for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y += 1) {
    for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x += 1) {
      if (Math.hypot(x - cx, y - cy) <= radius) set(x, y, color);
    }
  }
};

const fillRoundedRect = (set, left, top, width, height, radius, color) => {
  for (let y = top; y < top + height; y += 1) {
    for (let x = left; x < left + width; x += 1) {
      const cx = Math.max(left + radius, Math.min(x, left + width - radius));
      const cy = Math.max(top + radius, Math.min(y, top + height - radius));
      if (Math.hypot(x - cx, y - cy) <= radius) set(x, y, color);
    }
  }
};

const line = (set, x1, y1, x2, y2, width, color) => {
  const padding = width / 2;
  const minX = Math.floor(Math.min(x1, x2) - padding);
  const maxX = Math.ceil(Math.max(x1, x2) + padding);
  const minY = Math.floor(Math.min(y1, y2) - padding);
  const maxY = Math.ceil(Math.max(y1, y2) + padding);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const projection = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lengthSquared));
      const distance = Math.hypot(x - (x1 + projection * dx), y - (y1 + projection * dy));
      if (distance <= padding) set(x, y, color);
    }
  }
};

const professional = () => {
  const { image, set } = makeImage(colors.green);
  line(set, 330, 610, 512, 398, 30, colors.ivory);
  line(set, 512, 398, 694, 610, 30, colors.ivory);
  line(set, 330, 610, 694, 610, 30, colors.ivory);
  fillCircle(set, 330, 610, 68, colors.ivory);
  fillCircle(set, 694, 610, 68, colors.ivory);
  fillCircle(set, 512, 398, 88, colors.coral);
  fillCircle(set, 512, 398, 18, colors.ivory);
  return image;
};

const human = () => {
  const { image, set } = makeImage(colors.ivory);
  fillCircle(set, 390, 388, 92, colors.green);
  fillRoundedRect(set, 264, 500, 252, 232, 112, colors.green);
  fillCircle(set, 634, 388, 92, colors.coral);
  fillRoundedRect(set, 508, 500, 252, 232, 112, colors.coral);
  line(set, 430, 530, 594, 530, 26, colors.ivory);
  fillCircle(set, 512, 530, 28, colors.amber);
  return image;
};

const tech = () => {
  const { image, set } = makeImage(colors.deepGreen);
  line(set, 306, 544, 512, 304, 24, colors.mint);
  line(set, 512, 304, 718, 544, 24, colors.mint);
  line(set, 306, 544, 718, 544, 24, colors.mint);
  fillCircle(set, 306, 544, 54, colors.mint);
  fillCircle(set, 718, 544, 54, colors.mint);
  fillCircle(set, 512, 304, 54, colors.mint);
  const diamond = [{ x: 512, y: 420 }, { x: 636, y: 544 }, { x: 512, y: 668 }, { x: 388, y: 544 }];
  for (let y = 380; y <= 708; y += 1) {
    for (let x = 348; x <= 676; x += 1) {
      if (Math.abs(x - 512) + Math.abs(y - 544) <= 124) set(x, y, colors.coral);
    }
  }
  fillCircle(set, 512, 544, 18, colors.ivory);
  const spark = [{ x: 758, y: 270 }, { x: 770, y: 294 }, { x: 794, y: 306 }, { x: 770, y: 318 }, { x: 758, y: 342 }, { x: 746, y: 318 }, { x: 722, y: 306 }, { x: 746, y: 294 }];
  for (let y = 260; y <= 350; y += 1) {
    for (let x = 712; x <= 804; x += 1) {
      let inside = false;
      for (let index = 0, previous = spark.length - 1; index < spark.length; previous = index++) {
        const a = spark[index]; const b = spark[previous];
        if ((a.y > y) !== (b.y > y) && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
      }
      if (inside) set(x, y, colors.ivory);
    }
  }
  return image;
};

const variants = { professional, human, tech };
(async () => {
  for (const [name, draw] of Object.entries(variants)) {
    await draw().writeAsync(path.join(__dirname, '..', 'assets', `brand-avatar-${name}.png`));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
