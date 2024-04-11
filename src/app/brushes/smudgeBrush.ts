import { Vector2 } from "../../helpers/vectors";
import { CanvasBuffer } from "../canvasBuffer/canvasBuffer";
import { Core } from "../core";
import { BasicBrush } from "./basicBrush";

export class SmudgeBrush extends BasicBrush {
  type = "SmudgeBrush";
  copy: CanvasBuffer;
  constructor(color: string, size: number) {
    super(color, size);
  }

  startDraw(ctx: CanvasRenderingContext2D, pos: Vector2, pressure: number) {
    const _ = this.getSize(pressure);
    this.copy = new CanvasBuffer(false);
    this.copy.ctx.fillStyle = "#fff";
    this.copy.ctx.fillRect(0, 0, this.copy.width, this.copy.height);
    this.copy.ctx.drawImage(
      Core.layerController.activeLayer.buffer.canvas,
      0,
      0
    );
    this.copy.ctx.globalAlpha = 0.5;
    this.points[0] = pos;
  }
  draw(ctx: CanvasRenderingContext2D, pos: Vector2, pressure: number) {
    const s = this.getSize(pressure);
    ctx.drawImage(
      this.copy.canvas,
      this.points[0].x - s / 2,
      this.points[0].y - s / 2,
      s,
      s,
      pos.x - s / 2,
      pos.y - s / 2,
      s,
      s
    );
    this.copy.ctx.drawImage(ctx.canvas, 0, 0);
    this.points[0] = pos;
  }
}
