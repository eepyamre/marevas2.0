import { Vector2 } from "../../helpers/vectors";
import { BasicBrush } from "../brushes/basicBrush";
import { BrushController } from "../brushes/brushController";
import { ImageBrush } from "../brushes/imageBrush";
import { Core } from "../core";
import { HistoryDrawingData } from "../historyController";
import { Layer } from "../layerController";
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
      layer: Layer;
      brush?: keyof typeof Core.brushController.brushesTypes;
    };
  } = {};
  mainCopy: CanvasBuffer;
  constructor() {
    this.drawingCanvas = new CanvasBuffer();
    this.drawingCanvasEl = this.drawingCanvas.canvas;
    this.drawingCanvasEl.style.zIndex = "2";
  }

  startDraw(pressure: number) {
    if (!Core.networkController.socket.readyState) return;

    const historyItem: HistoryDrawingData = {
      type: "draw",
      mode: Core.brushController.mode,
      color: { ...Core.brushController.brush.color.color },
      size: Core.brushController.brush.size,
      brush: Core.brushController.brush
        .type as keyof typeof Core.brushController.brushesTypes,
      spacing:
        Core.brushController.brush instanceof ImageBrush &&
        Core.brushController.brush.spacing,
      run: () => {
        Core.brushController.selectBrush(historyItem.brush, false);
        Core.brushController.setBrushSize(historyItem.size);
        if (historyItem.color)
          Core.brushController.setBrushColor(historyItem.color);
        if (historyItem.spacing)
          Core.brushController.setSpacing(historyItem.spacing);
        Core.brushController.startDraw(
          this.drawingCanvas.ctx,
          Core.layerController.activeLayer,
          pressure
        );
        if (historyItem.mode === "erase") {
          delete this.mainCopy;
          this.mainCopy = new CanvasBuffer(false);
          this.mainCopy.ctx.drawImage(this.mainCanvasEl, 0, 0);
          this.drawingCanvasEl.style.opacity = "0";
        }
      },
    };
    Core.historyController.pushNewHistory();
    Core.historyController.pushToActiveHistoryItem(historyItem);
    historyItem.run();
    Core.networkController.sendStart(Core.layerController.activeLayer.id);
  }
  draw(pos: Vector2, pressure: number) {
    if (!Core.networkController.socket.readyState) return;
    const historyItem: HistoryDrawingData = {
      type: "draw",
      mode: Core.brushController.mode,
      color: Core.brushController.brush.color.color,
      brush: Core.brushController.brush
        .type as keyof typeof Core.brushController.brushesTypes,
      run: () => {
        Core.brushController.draw(this.drawingCanvas.ctx, pos, pressure);
        if (historyItem.mode === "erase") {
          this.mainCanvas.ctx.clearRect(
            0,
            0,
            this.mainCanvas.width,
            this.mainCanvas.height
          );
          this.mainCanvas.ctx.drawImage(this.mainCopy.canvas, 0, 0);
          this.mainCanvas.ctx.globalCompositeOperation = "destination-out";
          this.mainCanvas.ctx.globalAlpha = historyItem.color.a;
          this.mainCanvas.ctx.drawImage(this.drawingCanvasEl, 0, 0);
          this.mainCanvas.ctx.globalAlpha = 1;
          this.mainCanvas.ctx.globalCompositeOperation = "source-over";
        }
      },
    };
    Core.historyController.pushToActiveHistoryItem(historyItem);
    historyItem.run();
    if (Core.brushController.mode === "draw") {
      this.pushData(pos, pressure);
    }
  }
  endDraw() {
    if (!Core.networkController.socket.readyState) return;
    const historyItem: HistoryDrawingData = {
      type: "draw",
      mode: Core.brushController.mode,
      brush: Core.brushController.brush
        .type as keyof typeof Core.brushController.brushesTypes,
      run: () => {
        Core.brushController.endDraw(this.drawingCanvas.ctx);
        if (historyItem.mode === "erase") {
          this.mainCanvas.ctx.clearRect(
            0,
            0,
            this.mainCanvas.width,
            this.mainCanvas.height
          );
          this.mainCanvas.ctx.drawImage(this.mainCopy.canvas, 0, 0);
          delete this.mainCopy;
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
    Core.networkController.sendStop(Core.layerController.activeLayer.id);
    Core.networkController.sendImage(
      Core.layerController.activeLayer.id,
      this.mainCanvas.canvas.toDataURL()
    );
  }

  pushData(pos: Vector2, pressure: number) {
    const packet: Pick<Packet, "brushSettings" | "pos" | "layerId"> = {
      layerId: Core.layerController.activeLayer.id,
      brushSettings: {
        color: Core.brushController.brush.color,
        size: Core.brushController.brush.size,
        pressure,
        type: Core.brushController.brush.type,
        spacing:
          Core.brushController.brush instanceof ImageBrush
            ? Core.brushController.brush.spacing
            : 1,
      },
      pos: pos,
    };

    Core.networkController.pushData(packet);
  }
  startRemoteDrawing(id: string) {
    const tempId = id + "_temp";
    if (!this.remoteDrawings[tempId]) {
      const canvasBuffer = new CanvasBuffer();
      const layer = Core.layerController.layers.find((item) => item.id === id);
      this.remoteDrawings[tempId] = {
        canvasBuffer: canvasBuffer,
        opacity: "1",
        brushController: new BrushController(),
        layer,
      };
    }
  }
  remoteDraw(data: Packet) {
    const tempId = data.layerId + "_temp";
    if (!this.remoteDrawings[data.layerId]) return;
    if (this.remoteDrawings[tempId]) {
      const ctx = this.remoteDrawings[tempId].canvasBuffer.ctx;
      if (!this.remoteDrawings[tempId].brush) {
        const brushClass =
          Core.brushController.brushesTypes[data.brushSettings.type];
        if (!brushClass) {
          console.error(`No such brush type ${data.brushSettings.type}`);
          return;
        }
        this.remoteDrawings[tempId].brush = brushClass;
        this.remoteDrawings[tempId].brushController.selectBrush(
          data.brushSettings
            .type as keyof typeof Core.brushController.brushesTypes,
          false
        );
        this.remoteDrawings[tempId].brushController.setBrushSize(
          data.brushSettings.size
        );

        this.remoteDrawings[tempId].brushController.brush.color.color.a =
          data.brushSettings.color.color.a;
        this.remoteDrawings[tempId].brushController.setBrushColor(
          data.brushSettings.color.color
        );
        this.remoteDrawings[tempId].brushController.setSpacing(
          data.brushSettings.spacing
        );
        this.remoteDrawings[tempId].brushController.startDraw(
          ctx,
          this.remoteDrawings[data.layerId].layer,
          data.brushSettings.pressure
        );
        this.remoteDrawings[tempId].canvasBuffer.canvas.style.opacity = (
          +this.remoteDrawings[tempId].brushController.brush.color.color.a *
          +this.remoteDrawings[data.layerId].layer.opacity
        ).toString();
      }

      const brush = this.remoteDrawings[tempId].brushController.brush;
      this.remoteDrawings[tempId].opacity = brush.color.color.a.toString();

      this.remoteDrawings[tempId].brushController.draw(
        ctx,
        data.pos,
        data.brushSettings.pressure
      );
    }
  }
  stopRemoteDrawing(id: string) {
    const tempId = id + "_temp";
    if (this.remoteDrawings[tempId]) {
      if (!this.remoteDrawings[id]) {
        const layer = Core.layerController.layers.find(
          (item) => item.id === id
        );
        this.remoteDrawings[id] = {
          canvasBuffer: layer.buffer,
          opacity: "1",
          layer,
        };
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
  remoteImage(layerId: string, dataString: string) {
    const img = new Image();
    const onload = () => {
      if (!this.remoteDrawings[layerId]) {
        const layer = Core.layerController.layers.find(
          (item) => item.id === layerId
        );
        this.remoteDrawings[layerId] = {
          canvasBuffer: layer.buffer,
          opacity: "1",
          layer,
        };
      }
      this.remoteDrawings[layerId].canvasBuffer.ctx.clearRect(
        0,
        0,
        this.remoteDrawings[layerId].canvasBuffer.width,
        this.remoteDrawings[layerId].canvasBuffer.height
      );
      this.remoteDrawings[layerId].canvasBuffer.ctx.drawImage(img, 0, 0);
      img.removeEventListener("load", onload);
    };
    img.addEventListener("load", onload);
    img.setAttribute("src", dataString);
  }

  remoteHistoryImage(dataString: string) {
    if (!dataString) return;

    const img = new Image();
    const onload = () => {
      this.mainCanvas.ctx.drawImage(img, 0, 0);
      img.removeEventListener("load", onload);
    };
    img.addEventListener("load", onload);
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

  changeMain(id: string) {
    this.mainCanvas = this.remoteDrawings[id].canvasBuffer;
    this.mainCanvasEl = this.remoteDrawings[id].canvasBuffer.canvas;
  }

  newLayer(id: string, title: string, userName: string, opacity: string) {
    const canvasBuffer = new CanvasBuffer();

    Core.layerController.addLayer({
      id,
      buffer: canvasBuffer,
      title,
      visibility: true,
      userName,
      opacity: +opacity,
    });
    this.remoteDrawings[id] = {
      canvasBuffer: canvasBuffer,
      opacity: "1",
      layer: Core.layerController.layers.find((item) => item.id === id),
    };
  }

  exportPNG() {
    const exportCanvas = new CanvasBuffer();
    Object.keys(this.remoteDrawings).forEach((key) => {
      exportCanvas.ctx.drawImage(
        this.remoteDrawings[key].canvasBuffer.canvas,
        0,
        0
      );
    });
    window.open(exportCanvas.canvas.toDataURL("image/png", 1), "_blank");
    exportCanvas.remove();
  }
}
