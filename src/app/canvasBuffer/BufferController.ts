import { Vector2 } from "../../helpers/vectors";
import { Core } from "../core";
import { CanvasBuffer } from "./canvasBuffer";

export class BufferController {
  mainCanvas: CanvasBuffer;
  drawingCanvas: CanvasBuffer;
  remoteCanvas: CanvasBuffer;
  mainCanvasEl: HTMLCanvasElement;
  drawingCanvasEl: HTMLCanvasElement;
  remoteCanvasEl: HTMLCanvasElement;

  constructor() {
    this.mainCanvas = new CanvasBuffer();
    this.mainCanvasEl = this.mainCanvas.canvas;
    this.drawingCanvas = new CanvasBuffer();
    this.drawingCanvasEl = this.drawingCanvas.canvas;
    this.remoteCanvas = new CanvasBuffer();
    this.remoteCanvasEl = this.remoteCanvas.canvas;
  }

  startDraw(pos: Vector2) {
    this.drawingCanvas.ctx.globalCompositeOperation = "destination-atop";
    Core.brushController.startDraw(this.drawingCanvas.ctx, pos);
    Core.brushController.draw(this.drawingCanvas.ctx, pos);
    this.pushData(pos);
  }
  draw(pos: Vector2) {
    Core.brushController.draw(this.drawingCanvas.ctx, pos);
    this.pushData(pos);
  }
  endDraw() {
    Core.brushController.endDraw(this.drawingCanvas.ctx);
    this.mainCanvas.ctx.drawImage(this.drawingCanvasEl, 0, 0);
    this.drawingCanvas.ctx.clearRect(
      0,
      0,
      this.drawingCanvas.width,
      this.drawingCanvas.height
    );
    this.drawingCanvas.ctx.globalCompositeOperation = "source-over";
  }
  pushData(pos: Vector2) {
    const brushSize = Core.brushController.brush.size;
    const data = this.drawingCanvas.ctx.getImageData(
      pos.x - brushSize / 2,
      pos.y - brushSize / 2,
      brushSize,
      brushSize
    );
    Core.networkController.pushData(data.data, pos, brushSize);
  }
  pushRemote(data: number[], pos: Vector2) {
    const size = Math.sqrt(data.length / 4);
    const canvas = document.createElement("canvas");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Cant create canvas context");
    }
    const arr = new Uint8ClampedArray(data);

    const imageData = new ImageData(arr, size);
    ctx.putImageData(imageData, pos.x, pos.y);
    const halfSize = size / 2;
    this.mainCanvas.ctx.drawImage(canvas, -halfSize, -halfSize);
  }
}
