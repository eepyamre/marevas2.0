import { perlinNoiseGen } from "../../helpers/utils";
import { Vector2 } from "../../helpers/vectors";
import { BasicBrush } from "./basicBrush";

export class NoiseBrush extends BasicBrush {
  type = "NoiseBrush";
  spacing: number;
  constructor(color: string, size: number) {
    super(color, size);
    this.spacing = 0;
  }
  startDraw(ctx: CanvasRenderingContext2D, pos: Vector2, pressure: number) {
    ctx.strokeStyle = this.color.toCanvasSrting();
    ctx.lineJoin = this.lineJoin;
    ctx.lineCap = this.lineCap;
    this.prevSize = this.size * pressure;
    this.points[0] = pos;
  }
  draw(ctx: CanvasRenderingContext2D, pos: Vector2, pressure: number) {
    this.points[0] = this.points[1];
    this.points[1] = this.points[2];
    this.points[2] = pos;

    if (this.points[0] == null) return;

    const p0 = this.points[0];
    const p1 = this.points[1];
    const p2 = this.points[2];

    const x0 = (p0.x + p1.x) / 2;
    const y0 = (p0.y + p1.y) / 2;

    const x1 = (p1.x + p2.x) / 2;
    const y1 = (p1.y + p2.y) / 2;

    const targetSize = this.size * pressure;
    let size = targetSize;
    if (Math.abs(targetSize - this.prevSize) > 0.5) {
      size = this.prevSize + (this.prevSize > targetSize ? -0.5 : 0.5);
    }
    this.prevSize = size;
    const noiceGrid = perlinNoiseGen();
    const step = size / noiceGrid.length;
    ctx.lineWidth = step;
    for (let i = 0; i < noiceGrid.length; i++) {
      for (let j = 0; j < noiceGrid[i].length; j++) {
        ctx.beginPath();
        const color = { ...this.color.color };
        color.r += (noiceGrid[i][j].x + noiceGrid[i][j].y) * 10;
        color.g += (noiceGrid[i][j].x + noiceGrid[i][j].y) * 10;
        color.b += (noiceGrid[i][j].x + noiceGrid[i][j].y) * 10;
        ctx.strokeStyle = `rgb(${color.r},${color.g},${color.b})`;

        const dx = step + i * noiceGrid[i][j].x * (size + this.spacing);
        const dy = step + j * noiceGrid[i][j].y * (size + this.spacing);
        ctx.moveTo(x0 + dx, y0 + dy);
        ctx.quadraticCurveTo(p1.x + dx, p1.y + dy, x1 + dx, y1 + dy);
        ctx.stroke();
        ctx.closePath();
      }
    }
    ctx.quadraticCurveTo(p1.x, p1.y, x1, y1);
  }

  setSpacing(n: number) {
    this.spacing = n;
  }
}
