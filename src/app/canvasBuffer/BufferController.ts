import { Vector2 } from "../../helpers/vectors";
import { BasicBrush } from "../brushes/basicBrush";
import { Core } from "../core";
import { Packet } from "../networkController";
import { CanvasBuffer } from "./canvasBuffer";

export class BufferController {
  mainCanvas: CanvasBuffer;
  drawingCanvas: CanvasBuffer;
  remoteCanvas: CanvasBuffer;
  mainCanvasEl: HTMLCanvasElement;
  drawingCanvasEl: HTMLCanvasElement;
  remoteCanvasEl: HTMLCanvasElement;
  prevPos: Vector2 | null;
  remoteDrawings: {
    [key: string]: { canvasBuffer: CanvasBuffer };
  } = {};
  constructor() {
    this.mainCanvas = new CanvasBuffer();
    this.mainCanvasEl = this.mainCanvas.canvas;
    this.mainCanvasEl.style.zIndex = "1";
    this.drawingCanvas = new CanvasBuffer();
    this.drawingCanvasEl = this.drawingCanvas.canvas;
    this.drawingCanvasEl.style.zIndex = "2";
    this.remoteCanvas = new CanvasBuffer();
    this.remoteCanvasEl = this.remoteCanvas.canvas;
    this.prevPos = null;
  }

  startDraw(pos: Vector2) {
    this.drawingCanvas.ctx.globalCompositeOperation = "destination-atop";
    Core.brushController.startDraw(this.drawingCanvas.ctx, pos);
    Core.brushController.draw(this.drawingCanvas.ctx, pos);
    Core.networkController.sendStart();
    this.pushData(pos);
    this.prevPos = pos;
  }
  draw(pos: Vector2) {
    Core.brushController.draw(this.drawingCanvas.ctx, pos);
    this.pushData(pos);
    this.prevPos = pos;
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
    this.prevPos = null;
    Core.networkController.sendStop();
  }

  pushData(pos: Vector2) {
    const packet: Pick<Packet, "brushSettings" | "pos" | "prevPos"> = {
      brushSettings: {
        color: Core.brushController.brush.color,
        size: Core.brushController.brush.size,
        type: "BasicBrush",
      },
      pos: pos,
      prevPos: this.prevPos || pos,
    };

    Core.networkController.pushData(packet);
  }
  startRemoteDrawing(id: string) {
    if (!this.remoteDrawings[id]) {
      const canvasBuffer = new CanvasBuffer();
      this.remoteDrawings[id] = { canvasBuffer: canvasBuffer };
      this.remoteDrawings[id].canvasBuffer.ctx.globalCompositeOperation =
        "destination-atop";
      this.remoteDrawings[id].canvasBuffer.ctx.beginPath();
    }
  }
  stopRemoteDrawing(id: string) {
    if (this.remoteDrawings[id]) {
      this.mainCanvas.ctx.drawImage(
        this.remoteDrawings[id].canvasBuffer.canvas,
        0,
        0
      );
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

      this.remoteDrawings[data.userId].canvasBuffer.ctx.strokeStyle =
        brush.color.toString();
      this.remoteDrawings[data.userId].canvasBuffer.ctx.fillStyle =
        brush.color.toString();
      this.remoteDrawings[data.userId].canvasBuffer.ctx.lineWidth = brush.size;
      this.remoteDrawings[data.userId].canvasBuffer.ctx.lineJoin =
        brush.lineJoin;
      this.remoteDrawings[data.userId].canvasBuffer.ctx.lineCap = brush.lineCap;

      this.remoteDrawings[data.userId].canvasBuffer.ctx.moveTo(
        data.prevPos.x,
        data.prevPos.y
      );
      this.remoteDrawings[data.userId].canvasBuffer.ctx.lineTo(
        data.pos.x,
        data.pos.y
      );
      this.remoteDrawings[data.userId].canvasBuffer.ctx.stroke();
    }
  }

  updateCanvasZoom(scale: number) {
    Core.canvasOptions.zoom *= scale;
    Core.bufferController.drawingCanvas.updateZoom();
    Core.bufferController.mainCanvas.updateZoom();
    Core.bufferController.remoteCanvas.updateZoom();
  }
}
