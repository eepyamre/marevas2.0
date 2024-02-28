import { Color, ColorHex } from "../../helpers/color";
import { Vector2 } from "../../helpers/vectors";

export class BasicBrush {
  color: Color;
  size: number;
  lineCap: CanvasLineCap = "round";
  lineJoin: CanvasLineJoin = "round";
  constructor(color: ColorHex, size: number) {
    this.color = new Color(color);
    this.size = size;
  }

  startDraw(ctx: CanvasRenderingContext2D, pos: Vector2, pressure: number) {
    ctx.strokeStyle = this.color.toCanvasSrting();
    ctx.fillStyle = this.color.toCanvasSrting();
    ctx.canvas.style.opacity = this.color.color.a.toString();
    ctx.lineJoin = this.lineJoin;
    ctx.lineCap = this.lineCap;
  }
  draw(
    ctx: CanvasRenderingContext2D,
    prevPos: Vector2,
    pos: Vector2,
    pressure: number
  ) {
    const size = this.size * pressure;
    ctx.lineWidth = size;
    ctx.beginPath();
    ctx.moveTo(prevPos.x, prevPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.closePath();
  }
  endDraw(ctx: CanvasRenderingContext2D) {
    ctx.canvas.style.opacity = "1";
    ctx.closePath();
  }
}
