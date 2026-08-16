const path = require('path');
const Jimp = require('../node_modules/jimp');

const size = 1024;
const color = (hex) => Jimp.cssColorToHex(hex);
const colors = {
  peach: color('#F29A7E'),
  palePeach: color('#F7C7A8'),
  cream: color('#FFF8EF'),
  warmCream: color('#FFF4E8'),
  coral: color('#D96D5B'),
  amber: color('#E3A84F'),
  gold: color('#E9A044'),
  transparent: Jimp.rgbaToInt(0, 0, 0, 0),
};

const makeImage = (background, radius = 220) => {
  const image = new Jimp({ data: Buffer.alloc(size * size * 4), width: size, height: size });
  for (let index = 0; index < image.bitmap.data.length; index += 4) image.bitmap.data.writeUInt32BE(background, index);
  const set = (x, y, value) => {
    if (x >= 0 && x < size && y >= 0 && y < size) image.bitmap.data.writeUInt32BE(value, (y * size + x) * 4);
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

const fillCircle = (set, cx, cy, radius, value) => {
  for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y += 1) {
    for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x += 1) {
      if (Math.hypot(x - cx, y - cy) <= radius) set(x, y, value);
    }
  }
};

const fillRoundedRect = (set, left, top, width, height, radius, value) => {
  for (let y = top; y < top + height; y += 1) {
    for (let x = left; x < left + width; x += 1) {
      const cx = Math.max(left + radius, Math.min(x, left + width - radius));
      const cy = Math.max(top + radius, Math.min(y, top + height - radius));
      if (Math.hypot(x - cx, y - cy) <= radius) set(x, y, value);
    }
  }
};

const line = (set, x1, y1, x2, y2, width, value) => {
  const radius = width / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;
  for (let y = Math.floor(Math.min(y1, y2) - radius); y <= Math.ceil(Math.max(y1, y2) + radius); y += 1) {
    for (let x = Math.floor(Math.min(x1, x2) - radius); x <= Math.ceil(Math.max(x1, x2) + radius); x += 1) {
      const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lengthSquared));
      if (Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy)) <= radius) set(x, y, value);
    }
  }
};

const cubicPoints = (p0, p1, p2, p3, steps = 28) => Array.from({ length: steps + 1 }, (_, index) => {
  const t = index / steps;
  const u = 1 - t;
  return {
    x: u ** 3 * p0.x + 3 * u ** 2 * t * p1.x + 3 * u * t ** 2 * p2.x + t ** 3 * p3.x,
    y: u ** 3 * p0.y + 3 * u ** 2 * t * p1.y + 3 * u * t ** 2 * p2.y + t ** 3 * p3.y,
  };
});

const strokeCurve = (set, points, width, value) => {
  for (let index = 1; index < points.length; index += 1) {
    line(set, points[index - 1].x, points[index - 1].y, points[index].x, points[index].y, width, value);
  }
};

const warmConnect = () => {
  const { image, set } = makeImage(colors.peach);
  strokeCurve(set, cubicPoints({ x: 344, y: 340 }, { x: 344, y: 440 }, { x: 408, y: 496 }, { x: 512, y: 554 }), 72, colors.cream);
  strokeCurve(set, cubicPoints({ x: 512, y: 554 }, { x: 616, y: 496 }, { x: 680, y: 440 }, { x: 680, y: 340 }), 72, colors.cream);
  line(set, 512, 554, 512, 716, 72, colors.cream);
  fillCircle(set, 344, 340, 58, colors.cream);
  fillCircle(set, 680, 340, 58, colors.cream);
  fillCircle(set, 512, 554, 50, colors.amber);
  fillCircle(set, 512, 554, 15, colors.cream);
  return image;
};

const warmPeople = () => {
  const { image, set } = makeImage(colors.warmCream);
  fillCircle(set, 396, 382, 86, colors.coral);
  fillRoundedRect(set, 276, 496, 240, 230, 108, colors.coral);
  fillCircle(set, 628, 382, 86, colors.amber);
  fillRoundedRect(set, 508, 496, 240, 230, 108, colors.amber);
  line(set, 438, 538, 586, 538, 28, colors.warmCream);
  fillCircle(set, 512, 538, 34, colors.peach);
  return image;
};

const warmTime = () => {
  const { image, set } = makeImage(colors.palePeach);
  fillRoundedRect(set, 248, 268, 528, 500, 106, colors.cream);
  fillRoundedRect(set, 336, 226, 42, 126, 21, colors.coral);
  fillRoundedRect(set, 646, 226, 42, 126, 21, colors.coral);
  line(set, 340, 548, 684, 548, 28, colors.gold);
  fillCircle(set, 340, 548, 46, colors.coral);
  fillCircle(set, 512, 548, 58, colors.peach);
  fillCircle(set, 684, 548, 46, colors.gold);
  line(set, 512, 606, 512, 674, 28, colors.peach);
  return image;
};

(async () => {
  const variants = { connect: warmConnect, people: warmPeople, time: warmTime };
  for (const [name, draw] of Object.entries(variants)) {
    await draw().writeAsync(path.join(__dirname, '..', 'assets', `brand-avatar-warm-${name}.png`));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
