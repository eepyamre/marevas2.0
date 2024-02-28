import { Core } from "../core";

export class CanvasBuffer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  constructor() {
    this.initCanvas();
  }
  private initCanvas() {
    this.canvas = document.createElement("canvas");
    Core.appRoot.append(this.canvas);
    const ctx = this.canvas.getContext("2d");
    if (!ctx) {
      throw new Error("No canvas context available!");
    }
    this.ctx = ctx;
    ctx.globalCompositeOperation = "source-over";
    this.adjustCanvasSize();
    window.addEventListener("resize", this.adjustCanvasSize.bind(this));
  }
  private adjustCanvasSize() {
    const dpr = window.devicePixelRatio || 1;
    // const dpr = 1
    const rect = this.canvas.getBoundingClientRect();
    this.width = this.canvas.width = rect.width * dpr;
    this.height = this.canvas.height = rect.height * dpr;
  }
}
