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
    const historyItem = {
      run: () => {
        Core.brushController.startDraw(this.drawingCanvas.ctx, pos, pressure);
        this.prevPos = pos;
      },
    };
    Core.historyController.pushNewHistory();
    Core.historyController.pushToActiveHistoryItem(historyItem);
    historyItem.run();
    Core.networkController.sendStart();
  }
  draw(pos: Vector2, pressure: number) {
    const prev = this.prevPos;
    const historyItem = {
      run: () => {
        Core.brushController.draw(
          this.drawingCanvas.ctx,
          this.prevPos || pos,
          pos,
          pressure
        );
        this.prevPos = pos;
      },
    };
    Core.historyController.pushToActiveHistoryItem(historyItem);
    historyItem.run();
    this.pushData(pos, pressure, prev);
  }
  endDraw() {
    const historyItem = {
      run: () => {
        Core.brushController.endDraw(this.drawingCanvas.ctx);
        this.mainCanvas.ctx.globalAlpha =
          Core.brushController.brush.color.color.a;
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
      },
    };
    Core.historyController.pushToActiveHistoryItem(historyItem);
    historyItem.run();
    Core.networkController.sendStop();
  }

  pushData(pos: Vector2, pressure: number, prevPos: Vector2 | null) {
    const packet: Pick<Packet, "brushSettings" | "pos" | "prevPos"> = {
      brushSettings: {
        color: Core.brushController.brush.color,
        size: Core.brushController.brush.size * pressure,
        type: "BasicBrush",
      },
      pos: pos,
      prevPos: prevPos || pos,
    };

    Core.networkController.pushData(packet);
  }
  startRemoteDrawing(id: string) {
    const tempId = id + "_temp";
    if (!this.remoteDrawings[tempId]) {
      const canvasBuffer = new CanvasBuffer();
      this.remoteDrawings[tempId] = {
        canvasBuffer: canvasBuffer,
        opacity: "1",
      };
    }
  }
  stopRemoteDrawing(id: string) {
    const tempId = id + "_temp";
    if (this.remoteDrawings[tempId]) {
      if (!this.remoteDrawings[id]) {
        const canvasBuffer = new CanvasBuffer();
        this.remoteDrawings[id] = { canvasBuffer: canvasBuffer, opacity: "1" };
      }
      this.remoteDrawings[id].canvasBuffer.ctx.globalAlpha =
        +this.remoteDrawings[tempId].opacity;
      this.remoteDrawings[id].canvasBuffer.ctx.globalAlpha =
        +this.remoteDrawings[tempId].opacity;
      this.remoteDrawings[id].canvasBuffer.ctx.drawImage(
        this.remoteDrawings[tempId].canvasBuffer.canvas,
        0,
        0
      );
      this.remoteDrawings[id].canvasBuffer.ctx.globalAlpha = 1;
      this.remoteDrawings[tempId].canvasBuffer.remove();
      delete this.remoteDrawings[tempId];
    }
  }
  remoteDraw(data: Packet) {
    const tempId = data.userId + "_temp";
    if (this.remoteDrawings[tempId]) {
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
      this.remoteDrawings[tempId].opacity = brush.color.color.a.toString();
      this.remoteDrawings[tempId].canvasBuffer.canvas.style.opacity =
        brush.color.color.a.toString();
      this.remoteDrawings[tempId].canvasBuffer.ctx.strokeStyle =
        brush.color.toCanvasSrting();
      this.remoteDrawings[tempId].canvasBuffer.ctx.fillStyle =
        brush.color.toCanvasSrting();
      this.remoteDrawings[tempId].canvasBuffer.ctx.lineWidth = brush.size;
      this.remoteDrawings[tempId].canvasBuffer.ctx.lineJoin = brush.lineJoin;
      this.remoteDrawings[tempId].canvasBuffer.ctx.lineCap = brush.lineCap;

      this.remoteDrawings[tempId].canvasBuffer.ctx.beginPath();
      this.remoteDrawings[tempId].canvasBuffer.ctx.moveTo(
        data.prevPos.x,
        data.prevPos.y
      );
      this.remoteDrawings[tempId].canvasBuffer.ctx.lineTo(
        data.pos.x,
        data.pos.y
      );
      this.remoteDrawings[tempId].canvasBuffer.ctx.stroke();
      this.remoteDrawings[tempId].canvasBuffer.ctx.closePath();
    }
  }

  updateCanvasZoom(scale: number) {
    Core.canvasOptions.zoom *= scale;
    this.drawingCanvas.updateZoom();
    this.mainCanvas.updateZoom();
  }

  clearMain() {
    this.mainCanvas.ctx.clearRect(
      0,
      0,
      this.mainCanvasEl.width,
      this.mainCanvasEl.height
    );
  }
}
