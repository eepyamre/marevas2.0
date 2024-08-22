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
  lastPos: Vector2 | null;
  type = "AutoBrush";

  constructor(settings: BrushSetttings, color: string) {
    this.settings = settings;
    this.color = new Color(color);
    this.actuallSize = this.settings.size;
  }

  createSprayPatter(width: number, height: number, density: number) {
    const offScreenCanvas = new OffscreenCanvas(width, height);
    const offScreenCtx = offScreenCanvas.getContext("2d");
    const mask = new ImageData(width, height);

    for (let i = 0; i < mask.data.length; i += 4) {
      if (Math.random() * 100 < density) {
        mask.data[i + 0] = this.color.color.r;
        mask.data[i + 1] = this.color.color.g;
        mask.data[i + 2] = this.color.color.b;
        mask.data[i + 3] = 255;
      }
    }

    offScreenCtx.putImageData(mask, 0, 0);
    return offScreenCtx.createPattern(offScreenCanvas, "repeat");
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

  updateSettings(settings: BrushSetttings, color: Color) {
    this.settings = settings;
    this.color = color;
  }

  // TODO: UPDATE
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

    ctx.fill(pathAll);
    ctx.closePath();
  }

  draw(ctx: CanvasRenderingContext2D, position: Vector2, pressure: number) {
    if (!this.lastPos) {
      this.lastPos = position;
    }

    const diffX = Math.abs(this.lastPos.x - position.x),
      diffY = Math.abs(this.lastPos.y - position.y),
      dist = Math.sqrt(diffX * diffX + diffY * diffY);
    let i = this.settings.spacing;

    if (dist < this.settings.spacing) {
      return;
    }

    ctx.fillStyle = this.color.toCanvasSrting();
    this.actuallSize = this.settings.size * pressure;

    const halfSize = this.actuallSize / 2;
    let x = position.x;
    let y = position.y;

    const angle = -this.lastPos.calculateAngle(position) - Math.PI / 2;

    while (i < dist) {
      const centerPosition = new Vector2(x - halfSize, y - halfSize);
      if (this.settings.fade !== 1) {
        const gradient = ctx.createRadialGradient(
          x,
          y,
          0,
          x,
          y,
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
      if (this.settings.density === 1 || (i !== 3 && i % 3 !== 0)) {
        if (this.settings.shape === "circle") {
          for (let spike = 0; spike < this.settings.spikes; spike++) {
            let path = new Path2D();
            const bezier = new Path2D();
            path.moveTo(0, halfSize);
            bezier.moveTo(0, halfSize);
            bezier.bezierCurveTo(
              0,
              -halfSize * 0.3,
              halfSize * 2,
              -halfSize * 0.3,
              halfSize * 2,
              halfSize
            );
            if (this.settings.density < 1) {
              for (let i = 0; i < this.actuallSize; i++) {
                for (let j = 0; j < halfSize; j++) {
                  if (
                    ctx.isPointInPath(bezier, i, j) &&
                    Math.random() < this.settings.density
                  ) {
                    path.arc(i, j, 1, 0, 2 * Math.PI);
                    path.closePath();
                  }
                }
              }
            } else {
              path = bezier;
            }

            const matrix = new DOMMatrix(
              getTransformMatrix(
                Math.round(360 / this.settings.spikes) * spike +
                  this.settings.angle,
                this.settings.ratio,
                1,
                this.actuallSize,
                centerPosition.x,
                centerPosition.y
              )
            );
            pathAll.addPath(path, matrix);
          }
        } else if (this.settings.shape === "square") {
          for (let i = 0; i < this.settings.spikes; i++) {
            const path = new Path2D();
            const rect = new Path2D();
            rect.rect(
              -halfSize / 2 + 15,
              -halfSize / 2 + 15,
              halfSize - 15,
              halfSize - 15
            );
            for (let i = 0; i < this.actuallSize; i++) {
              for (let j = 0; j < halfSize; j++) {
                if (
                  ctx.isPointInPath(rect, i, j) &&
                  Math.random() < this.settings.density
                ) {
                  path.arc(i, j, 1, 0, 2 * Math.PI);
                  path.closePath();
                }
              }
            }
            const matrix = new DOMMatrix(
              getTransformMatrix(
                Math.round(360 / this.settings.spikes) * i +
                  this.settings.angle,
                1,
                this.settings.ratio,
                halfSize,
                centerPosition.x + halfSize / 2,
                centerPosition.y + halfSize / 2
              )
            );
            pathAll.addPath(path, matrix);
          }
        }
      }

      ctx.fill(pathAll);
      ctx.closePath();
      i += this.settings.spacing;

      x = x + this.settings.spacing * Math.cos(angle);
      y = y + this.settings.spacing * Math.sin(angle);
    }
    this.lastPos = position;
  }

  endDraw(ctx: CanvasRenderingContext2D) {
    ctx.canvas.style.opacity = "1";
    this.lastPos = null;
  }
}
