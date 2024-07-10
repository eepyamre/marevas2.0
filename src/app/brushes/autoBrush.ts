import { Color } from "../../helpers/color";
import { Vector2 } from "../../helpers/vectors";

const matrixCache = new Map();
const getTransformMatrix = (
  angle: number,
  scaleX: number,
  scaleY: number,
  size: number,
  posX: number,
  posY: number
) => {
  const key = `${angle},${scaleX},${scaleY},${size},${posX},${posY}`;
  if (matrixCache.has(key)) {
    return matrixCache.get(key);
  }

  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const cy = size / 2;
  const cx = cy;

  const matrix = [
    scaleX * cos,
    scaleX * sin,
    -scaleY * sin,
    scaleY * cos,
    posX + (cx * (1 - scaleX * cos) + cy * scaleY * sin),
    posY + (cy * (1 - scaleY * cos) - cx * scaleX * sin),
  ];
  matrixCache.set(key, matrix);
  return matrix;
};

const createNoiseMask = (width: number, height: number, density: number) => {
  const mask = new Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      mask[y * width + x] = Math.random() < density ? 1 : 0;
    }
  }
  return mask;
};

type BrushSetttings = {
  shape: "circle" | "square";
  size: number;
  ratio: number;
  fade: number;
  angle: number;
  spikes: number;
  density: number;
  spacing: number;
};

export class AutoBrush {
  color: Color;
  settings: BrushSetttings;
  actuallSize: number;
  type = "AutoBrush";
  constructor(settings: BrushSetttings, color: string) {
    this.settings = settings;
    this.color = new Color(color);
    this.actuallSize = this.settings.size;
  }
  getSize(pressure: number) {
    const targetSize = this.settings.size * pressure;
    let size = targetSize;
    if (Math.abs(targetSize - this.actuallSize) > 0.5) {
      size = this.actuallSize + (this.actuallSize > targetSize ? -0.5 : 0.5);
    }
    this.actuallSize = size;
    return targetSize;
  }

  updateSettings(settings: BrushSetttings) {
    this.settings = settings;
  }

  renderTipPreview(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, 100, 100);
    ctx.fillStyle = "#000000";
    if (this.settings.fade !== 1) {
      const gradient = ctx.createRadialGradient(50, 50, 0, 50, 50, 50);
      gradient.addColorStop(0, `rgba(0, 0, 0, 1)`);
      gradient.addColorStop(this.settings.fade, `rgba(0, 0, 0, 1)`);
      gradient.addColorStop(1, `rgba(0, 0, 0, 0)`);
      ctx.fillStyle = gradient;
    }
    ctx.beginPath();
    const pathAll = new Path2D();
    if (this.settings.shape === "circle") {
      for (let i = 0; i < this.settings.spikes; i++) {
        const path = new Path2D();
        path.moveTo(0, 50);
        path.bezierCurveTo(0, -15, 100, -15, 100, 50);
        const matrix = new DOMMatrix(
          getTransformMatrix(
            Math.round(360 / this.settings.spikes) * i + this.settings.angle,
            this.settings.ratio,
            1,
            100,
            0,
            0
          )
        );
        pathAll.addPath(path, matrix);
      }
    } else if (this.settings.shape === "square") {
      const size = 35;
      for (let i = 0; i < this.settings.spikes; i++) {
        const path = new Path2D();
        path.rect(-size / 2, -size / 2, size, size);
        const matrix = new DOMMatrix(
          getTransformMatrix(
            Math.round(360 / this.settings.spikes) * i + this.settings.angle,
            1,
            this.settings.ratio,
            size,
            32,
            32
          )
        );
        pathAll.addPath(path, matrix);
      }
    }
    const originalData = ctx.getImageData(50, 50, 100, 100);
    ctx.fill(pathAll);
    ctx.closePath();
    if (this.settings.density !== 100) {
      this.applyMask(
        ctx,
        originalData,
        createNoiseMask(100, 100, this.settings.density / 100)
      );
    }
  }

  draw(ctx: CanvasRenderingContext2D, position: Vector2, pressure: number) {
    ctx.fillStyle = this.color.toCanvasSrting();
    this.actuallSize = this.settings.size * pressure;

    const halfSize = this.actuallSize / 2;
    const halfPosition = new Vector2(
      position.x - halfSize,
      position.y - halfSize
    );
    if (this.settings.fade !== 1) {
      const gradient = ctx.createRadialGradient(
        position.x,
        position.y,
        0,
        position.x,
        position.y,
        this.actuallSize / 2
      );

      gradient.addColorStop(
        0,
        `rgba(${this.color.color.r}, ${this.color.color.g}, ${this.color.color.b}, 1)`
      );
      gradient.addColorStop(
        this.settings.fade,
        `rgba(${this.color.color.r}, ${this.color.color.g}, ${this.color.color.b}, 1)`
      );
      gradient.addColorStop(
        1,
        `rgba(${this.color.color.r}, ${this.color.color.g}, ${this.color.color.b}, 0)`
      );
      ctx.fillStyle = gradient;
    }
    ctx.beginPath();
    const pathAll = new Path2D();
    if (this.settings.shape === "circle") {
      const radius = this.actuallSize / 2;
      for (let i = 0; i < this.settings.spikes; i++) {
        const path = new Path2D();
        path.moveTo(0, radius);
        path.bezierCurveTo(
          0,
          -radius * 0.3,
          radius * 2,
          -radius * 0.3,
          radius * 2,
          radius
        );
        const matrix = new DOMMatrix(
          getTransformMatrix(
            Math.round(360 / this.settings.spikes) * i + this.settings.angle,
            this.settings.ratio,
            1,
            this.actuallSize,
            halfPosition.x,
            halfPosition.y
          )
        );
        pathAll.addPath(path, matrix);
      }
    } else if (this.settings.shape === "square") {
      for (let i = 0; i < this.settings.spikes; i++) {
        const path = new Path2D();
        path.rect(
          -halfSize / 2 + 15,
          -halfSize / 2 + 15,
          halfSize - 15,
          halfSize - 15
        );
        const matrix = new DOMMatrix(
          getTransformMatrix(
            Math.round(360 / this.settings.spikes) * i + this.settings.angle,
            1,
            this.settings.ratio,
            halfSize,
            halfPosition.x + halfSize / 2,
            halfPosition.y + halfSize / 2
          )
        );
        pathAll.addPath(path, matrix);
      }
    }
    const originalData = ctx.getImageData(
      position.x - this.actuallSize / 2,
      position.y - this.actuallSize / 2,
      this.actuallSize,
      this.actuallSize
    );
    ctx.fill(pathAll);
    ctx.closePath();
    if (this.settings.density !== 100) {
      this.applyMask(
        ctx,
        originalData,
        createNoiseMask(
          this.actuallSize,
          this.actuallSize,
          this.settings.density / 100
        ),
        halfPosition,
        this.actuallSize
      );
    }
  }

  endDraw(ctx: CanvasRenderingContext2D) {
    ctx.canvas.style.opacity = "1";
  }

  applyMask(
    ctx: CanvasRenderingContext2D,
    originalData: ImageData,
    noiseMask: number[],
    position: Vector2 = { x: 0, y: 0 } as Vector2,
    size = 100
  ) {
    const newData = ctx.getImageData(position.x, position.y, size, size);

    for (let i = 0; i < newData.data.length; i += 4) {
      // Calculate distance from center for gradient
      const x = (i / 4) % size;
      const y = Math.floor(i / 4 / size);
      const distanceFromCenter = Math.sqrt(
        Math.pow(x - size / 2, 2) + Math.pow(y - size / 2, 2)
      );
      const gradientFactor = Math.max(
        0,
        Math.min(1, 1 - distanceFromCenter / (size / 2))
      );

      // Apply gradient and noise mask
      newData.data[i + 3] *= gradientFactor * noiseMask[i / 4];

      if (newData.data[i + 3] < 255) {
        const alpha = newData.data[i + 3] / 255;
        for (let j = 0; j < 3; j++) {
          newData.data[i + j] = newData.data[i + j];
        }
        newData.data[i + 3] = Math.round(
          newData.data[i + 3] + originalData.data[i + 3] * (1 - alpha)
        );
      }
    }

    ctx.putImageData(newData, position.x, position.y);
  }
}
