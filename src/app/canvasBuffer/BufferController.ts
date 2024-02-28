import { Vector2 } from "../../helpers/vectors";
import { BasicBrush } from "../brushes/basicBrush";
import { Core } from "../core";
import { Packet } from "../networkController";
import { CanvasBuffer } from "./canvasBuffer";

export class BufferController {
  mainCanvas: CanvasBuffer;
  drawingCanvas: CanvasBuffer;
  mainCanvasEl: HTMLCanvasElement;
  drawingCanvasEl: HTMLCanvasElement;
  prevPos: Vector2 | null;
  remoteDrawings: {
    [key: string]: { canvasBuffer: CanvasBuffer; opacity: string };
  } = {};
  constructor() {
    this.mainCanvas = new CanvasBuffer();
    this.mainCanvasEl = this.mainCanvas.canvas;
    this.mainCanvasEl.style.zIndex = "1";
    this.drawingCanvas = new CanvasBuffer();
    this.drawingCanvasEl = this.drawingCanvas.canvas;
    this.drawingCanvasEl.style.zIndex = "2";
    this.prevPos = null;
  }

  startDraw(pos: Vector2, pressure: number) {
    Core.brushController.startDraw(this.drawingCanvas.ctx, pos, pressure);
    Core.networkController.sendStart();
    this.prevPos = pos;
  }
  draw(pos: Vector2, pressure: number) {
    Core.brushController.draw(
      this.drawingCanvas.ctx,
      this.prevPos || pos,
      pos,
      pressure
    );
    this.pushData(pos, pressure);
    this.prevPos = pos;
  }
  endDraw() {
    Core.brushController.endDraw(this.drawingCanvas.ctx);
    this.mainCanvas.ctx.globalAlpha = Core.brushController.brush.color.color.a;
    this.mainCanvas.ctx.drawImage(this.drawingCanvasEl, 0, 0);
    this.mainCanvas.ctx.globalAlpha = 1;
    this.drawingCanvas.ctx.clearRect(
      0,
      0,
      this.drawingCanvas.width,
      this.drawingCanvas.height
    );
    this.drawingCanvas.ctx.globalCompositeOperation = "source-over";
    this.drawingCanvas.ctx.globalAlpha = 1;
    this.prevPos = null;
    Core.networkController.sendStop();
  }

  pushData(pos: Vector2, pressure: number) {
    const packet: Pick<Packet, "brushSettings" | "pos" | "prevPos"> = {
      brushSettings: {
        color: Core.brushController.brush.color,
        size: Core.brushController.brush.size * pressure,
        type: "BasicBrush",
      },
      pos: pos,
      prevPos: this.prevPos || pos,
    };

    Core.networkController.pushData(packet);
  }
  // TODO: opacity + pressure over network
  startRemoteDrawing(id: string) {
    if (!this.remoteDrawings[id]) {
      const canvasBuffer = new CanvasBuffer();
      this.remoteDrawings[id] = { canvasBuffer: canvasBuffer, opacity: "1" };
    }
  }
  stopRemoteDrawing(id: string) {
    if (this.remoteDrawings[id]) {
      this.mainCanvas.ctx.globalAlpha = +this.remoteDrawings[id].opacity;
      this.mainCanvas.ctx.drawImage(
        this.remoteDrawings[id].canvasBuffer.canvas,
        0,
        0
      );
      this.mainCanvas.ctx.globalAlpha = 1;
      this.remoteDrawings[id].canvasBuffer.remove();
      delete this.remoteDrawings[id];
    }
  }
  remoteDraw(data: Packet) {
    if (this.remoteDrawings[data.userId]) {
      const brushClass =
        Core.brushController.brushesTypes[data.brushSettings.type];
      if (!brushClass) {
        console.error(`No such brush type ${data.brushSettings.type}`);
        return;
      }
      const brush: BasicBrush = new brushClass(
        data.brushSettings.color.toHex(),
        data.brushSettings.size
      );
      this.remoteDrawings[data.userId].opacity = brush.color.color.a.toString();
      this.remoteDrawings[data.userId].canvasBuffer.canvas.style.opacity =
        brush.color.color.a.toString();
      this.remoteDrawings[data.userId].canvasBuffer.ctx.strokeStyle =
        brush.color.toCanvasSrting();
      this.remoteDrawings[data.userId].canvasBuffer.ctx.fillStyle =
        brush.color.toCanvasSrting();
      this.remoteDrawings[data.userId].canvasBuffer.ctx.lineWidth = brush.size;
      this.remoteDrawings[data.userId].canvasBuffer.ctx.lineJoin =
        brush.lineJoin;
      this.remoteDrawings[data.userId].canvasBuffer.ctx.lineCap = brush.lineCap;

      this.remoteDrawings[data.userId].canvasBuffer.ctx.beginPath();
      this.remoteDrawings[data.userId].canvasBuffer.ctx.moveTo(
        data.prevPos.x,
        data.prevPos.y
      );
      this.remoteDrawings[data.userId].canvasBuffer.ctx.lineTo(
        data.pos.x,
        data.pos.y
      );
      this.remoteDrawings[data.userId].canvasBuffer.ctx.stroke();
      this.remoteDrawings[data.userId].canvasBuffer.ctx.closePath();
    }
  }

  updateCanvasZoom(scale: number) {
    Core.canvasOptions.zoom *= scale;
    Core.bufferController.drawingCanvas.updateZoom();
    Core.bufferController.mainCanvas.updateZoom();
  }
}
