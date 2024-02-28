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

  startDraw(ctx: CanvasRenderingContext2D, pos: Vector2) {
    ctx.strokeStyle = this.color.toString();
    ctx.fillStyle = this.color.toString();
    ctx.beginPath();
    ctx.lineWidth = this.size;
    ctx.lineCap = this.lineCap;
    ctx.lineJoin = this.lineJoin;
    ctx.moveTo(pos.x, pos.y);
  }
  draw(ctx: CanvasRenderingContext2D, pos: Vector2) {
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }
  endDraw(ctx: CanvasRenderingContext2D) {
    ctx.closePath();
  }
}
