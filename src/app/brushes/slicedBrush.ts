import { Vector2 } from "../../helpers/vectors";
import { BasicBrush } from "./basicBrush";

export class SlicedBrush extends BasicBrush {
  type = "SlicedBrush";
  constructor(color: string, size: number) {
    super(color, size);
  }

  startDraw(ctx: CanvasRenderingContext2D, pos: Vector2, pressure: number) {
    ctx.strokeStyle = this.color.toCanvasSrting();
    ctx.fillStyle = this.color.toCanvasSrting();
    ctx.canvas.style.opacity = this.color.color.a.toString();
    ctx.lineJoin = this.lineJoin;
    ctx.lineCap = this.lineCap;
    this.prevSize = (this.size * pressure) / 2;

    ctx.beginPath();
    const size75 = this.prevSize * 0.4;
    const size66 = this.prevSize * 0.2;
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    ctx.moveTo(pos.x - size75, pos.y - size75);
    ctx.lineTo(pos.x - size75, pos.y - size75);
    ctx.stroke();

    ctx.moveTo(pos.x - size66, pos.y - size66);
    ctx.lineTo(pos.x - size66, pos.y - size66);
    ctx.stroke();

    ctx.moveTo(pos.x + size66, pos.y + size66);
    ctx.lineTo(pos.x + size66, pos.y + size66);
    ctx.stroke();

    ctx.moveTo(pos.x + size75, pos.y + size75);
    ctx.lineTo(pos.x + size75, pos.y + size75);
    ctx.stroke();
  }

  draw(ctx: CanvasRenderingContext2D, pos: Vector2, pressure: number) {
    this.points[0] = this.points[1];
    this.points[1] = this.points[2];
    this.points[2] = pos;

    if (this.points[0] == null) return;

    const p1 = this.points[1];
    const p2 = this.points[2];

    const targetSize = (this.size * pressure) / 2;
    let size = targetSize;
    if (Math.abs(targetSize - this.prevSize) > 0.5) {
      size = this.prevSize + (this.prevSize > targetSize ? -0.5 : 0.5);
    }
    this.prevSize = size;
    ctx.lineWidth = size;

    ctx.beginPath();
    const size75 = size * 0.4;
    const size66 = size * 0.2;
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    ctx.moveTo(p1.x - size75, p1.y - size75);
    ctx.lineTo(p2.x - size75, p2.y - size75);
    ctx.stroke();

    ctx.moveTo(p1.x - size66, p1.y - size66);
    ctx.lineTo(p2.x - size66, p2.y - size66);
    ctx.stroke();

    ctx.moveTo(p1.x + size66, p1.y + size66);
    ctx.lineTo(p2.x + size66, p2.y + size66);
    ctx.stroke();

    ctx.moveTo(p1.x + size75, p1.y + size75);
    ctx.lineTo(p2.x + size75, p2.y + size75);
    ctx.stroke();
  }
}
