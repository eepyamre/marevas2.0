import { Vecotor2 } from "../helpers/vectors";
import { BasicBrush } from "./brushes/basicBrush";
import { Controls } from "./controls/controls";
import { RemoteConnection } from "./remoteConnection";
import { UI } from "./ui";

export class Core {
  ctx: CanvasRenderingContext2D;
  controls: Controls;
  history: History;
  remote: RemoteConnection;
  ui: UI;
  brush: BasicBrush;
  constructor(canvas: HTMLCanvasElement) {
    let ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("No canvas context available!");
    }
    this.ctx = ctx;
    this.initCanvas(this.ctx);
    ctx.globalCompositeOperation = 'source-over'
    this.brush = new BasicBrush(0x12121232, 16)
    this.controls = new Controls(this);
  }

  startDraw(pos: Vecotor2) {
    this.brush.startDraw(this.ctx, pos);
  }
  draw(pos: Vecotor2) {
    this.brush.draw(this.ctx, pos);
  }
  endDraw() {
    this.brush.endDraw(this.ctx);
  }

  private initCanvas(ctx: CanvasRenderingContext2D) {
    // const dpr = window.devicePixelRatio || 1;
    const dpr = 1
    const rect = ctx.canvas.getBoundingClientRect();
    ctx.canvas.width = rect.width * dpr;
    ctx.canvas.height = rect.height * dpr;
  }
}
