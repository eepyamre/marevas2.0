import { Vector2 } from "../../helpers/vectors";
import { Core } from "../core";
import { CanvasBuffer } from "./canvasBuffer";

export class DoubleBufferController {
  mainCanvas: CanvasBuffer;
  drawingCanvas: CanvasBuffer;
  mainCanvasEl: HTMLCanvasElement;
  drawingCanvasEl: HTMLCanvasElement;

  constructor() {
    this.mainCanvas = new CanvasBuffer();
    this.mainCanvasEl = this.mainCanvas.canvas;
    this.drawingCanvas = new CanvasBuffer();
    this.drawingCanvasEl = this.drawingCanvas.canvas;
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
}
