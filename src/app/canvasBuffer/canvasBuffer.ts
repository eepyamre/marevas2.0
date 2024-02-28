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
    let prevData: ImageData | undefined;
    if (this.width && this.height) {
      prevData = this.ctx.getImageData(0, 0, this.width, this.height);
    }
    this.width = this.canvas.width = Core.canvasOptions.width * dpr;
    this.height = this.canvas.height = Core.canvasOptions.height * dpr;
    Core.appRoot.style.width = this.canvas.style.width = this.width + "px";
    Core.appRoot.style.height = this.canvas.style.height = this.height + "px";
    if (prevData) {
      this.ctx.putImageData(prevData, 0, 0);
    }
  }
  updateZoom() {
    Core.appRoot.style.transform = Core.getTransformStyle();
  }
  remove() {
    this.canvas.remove();
  }
}
