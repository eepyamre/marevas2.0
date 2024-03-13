import { Color, ColorHex } from "../../helpers/color";
import { Vector2 } from "../../helpers/vectors";

export class BasicBrush {
  color: Color;
  size: number;
  lineCap: CanvasLineCap = "round";
  lineJoin: CanvasLineJoin = "round";
  points: Vector2 | null[] = [null, null, null];
  prevSize: number;
  type = "BasicBrush";
  constructor(color: string, size: number) {
    this.color = new Color(color);
    this.size = size;
    this.prevSize = size;
  }

  startDraw(ctx: CanvasRenderingContext2D, pressure: number) {
    ctx.strokeStyle = this.color.toCanvasSrting();
    ctx.fillStyle = this.color.toCanvasSrting();
    ctx.canvas.style.opacity = this.color.color.a.toString();
    ctx.lineJoin = this.lineJoin;
    ctx.lineCap = this.lineCap;
    this.prevSize = this.size * pressure;
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
    ctx.lineWidth = size;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(p1.x, p1.y, x1, y1);
    ctx.stroke();
    ctx.closePath();
  }
  endDraw(ctx: CanvasRenderingContext2D) {
    ctx.canvas.style.opacity = "1";
    ctx.closePath();
    this.points = [null, null, null];
  }
}
