import { Vector2 } from "../../helpers/vectors";
import { BasicBrush } from "../brushes/basicBrush";
import { BrushController } from "../brushes/brushController";
import { Core } from "../core";
import { HistoryDrawingData } from "../historyController";
import { Packet } from "../networkController";
import { CanvasBuffer } from "./canvasBuffer";

export class BufferController {
  mainCanvas: CanvasBuffer;
  drawingCanvas: CanvasBuffer;
  mainCanvasEl: HTMLCanvasElement;
  drawingCanvasEl: HTMLCanvasElement;
  remoteDrawings: {
    [key: string]: {
      canvasBuffer: CanvasBuffer;
      opacity: string;
      brushController?: BrushController;
      brush?: BasicBrush;
    };
  } = {};
  constructor() {
    this.mainCanvas = new CanvasBuffer();
    this.mainCanvasEl = this.mainCanvas.canvas;
    this.mainCanvasEl.style.zIndex = "1";
    this.drawingCanvas = new CanvasBuffer();
    this.drawingCanvasEl = this.drawingCanvas.canvas;
    this.drawingCanvasEl.style.zIndex = "2";
  }

  startDraw(pressure: number) {
    if (!Core.networkController.socket.readyState) return;
    const historyItem: HistoryDrawingData = {
      mode: Core.brushController.mode,
      color: { ...Core.brushController.brush.color.color },
      run: () => {
        if (historyItem.color)
          Core.brushController.setBrushColor(historyItem.color);

        Core.brushController.startDraw(this.drawingCanvas.ctx, pressure);
        if (historyItem.mode === "erase") {
          this.drawingCanvasEl.style.opacity = "0";
        }
      },
    };
    Core.historyController.pushNewHistory();
    Core.historyController.pushToActiveHistoryItem(historyItem);
    historyItem.run();
    Core.networkController.sendStart();
  }
  draw(pos: Vector2, pressure: number) {
    if (!Core.networkController.socket.readyState) return;
    const historyItem: HistoryDrawingData = {
      mode: Core.brushController.mode,
      run: () => {
        Core.brushController.draw(this.drawingCanvas.ctx, pos, pressure);
        if (historyItem.mode === "erase") {
          this.mainCanvas.ctx.globalCompositeOperation = "destination-out";
          this.mainCanvas.ctx.globalAlpha =
            Core.brushController.brush.color.color.a;
          this.mainCanvas.ctx.drawImage(this.drawingCanvasEl, 0, 0);
          this.mainCanvas.ctx.globalAlpha = 1;
          this.mainCanvas.ctx.globalCompositeOperation = "source-over";
        }
      },
      color: Core.brushController.brush.color.color,
    };
    Core.historyController.pushToActiveHistoryItem(historyItem);
    historyItem.run();
    if (Core.brushController.mode === "draw") {
      this.pushData(pos, pressure);
    }
  }
  endDraw() {
    if (!Core.networkController.socket.readyState) return;
    const historyItem = {
      mode: Core.brushController.mode,
      run: () => {
        Core.brushController.endDraw(this.drawingCanvas.ctx);
        if (historyItem.mode === "erase") {
          this.mainCanvas.ctx.globalCompositeOperation = "destination-out";
        }
        this.mainCanvas.ctx.globalAlpha =
          Core.brushController.brush.color.color.a;
        this.mainCanvas.ctx.drawImage(this.drawingCanvasEl, 0, 0);
        this.mainCanvas.ctx.globalAlpha = 1;
        this.mainCanvas.ctx.globalCompositeOperation = "source-over";
        this.drawingCanvas.ctx.clearRect(
          0,
          0,
          this.drawingCanvas.width,
          this.drawingCanvas.height
        );
        this.drawingCanvas.ctx.globalAlpha = 1;
      },
    };
    Core.historyController.pushToActiveHistoryItem(historyItem);
    historyItem.run();
    Core.networkController.sendStop();
    Core.networkController.sendImage(this.mainCanvas.canvas.toDataURL());
  }

  pushData(pos: Vector2, pressure: number) {
    const packet: Pick<Packet, "brushSettings" | "pos"> = {
      brushSettings: {
        color: Core.brushController.brush.color,
        size: Core.brushController.brush.size,
        pressure,
        type: "BasicBrush",
      },
      pos: pos,
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
        brushController: new BrushController(),
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
      const ctx = this.remoteDrawings[tempId].canvasBuffer.ctx;
      if (!this.remoteDrawings[tempId].brush) {
        this.remoteDrawings[tempId].brushController = new BrushController();
        const brushClass =
          Core.brushController.brushesTypes[data.brushSettings.type];
        if (!brushClass) {
          console.error(`No such brush type ${data.brushSettings.type}`);
          return;
        }
        if (!brushClass) {
          console.error(`No such brush type ${data.brushSettings.type}`);
          return;
        }
        this.remoteDrawings[tempId].brush = new brushClass(
          data.brushSettings.color.toHex(),
          data.brushSettings.size
        );
        this.remoteDrawings[tempId].brushController.setBrush(
          this.remoteDrawings[tempId].brush
        );
        this.remoteDrawings[tempId].brushController.startDraw(
          ctx,
          data.brushSettings.pressure
        );
      }

      const brush = this.remoteDrawings[tempId].brush;

      this.remoteDrawings[tempId].opacity = brush.color.color.a.toString();
      this.remoteDrawings[tempId].canvasBuffer.canvas.style.opacity =
        brush.color.color.a.toString();
      this.remoteDrawings[tempId].brushController.draw(
        ctx,
        data.pos,
        data.brushSettings.pressure
      );
    }
  }

  remoteImage(id: string, dataString: string) {
    const img = new Image();
    img.addEventListener("load", () => {
      if (!this.remoteDrawings[id]) {
        const canvasBuffer = new CanvasBuffer();
        this.remoteDrawings[id] = {
          canvasBuffer: canvasBuffer,
          opacity: "1",
        };
      }
      this.remoteDrawings[id].canvasBuffer.ctx.clearRect(
        0,
        0,
        this.remoteDrawings[id].canvasBuffer.width,
        this.remoteDrawings[id].canvasBuffer.height
      );
      this.remoteDrawings[id].canvasBuffer.ctx.drawImage(img, 0, 0);
    });
    img.setAttribute("src", dataString);
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
