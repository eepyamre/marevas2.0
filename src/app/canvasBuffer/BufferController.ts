import { Color } from "../../helpers/color";
import { colorsAreClose, mapNumRange } from "../../helpers/utils";
import { Vector2 } from "../../helpers/vectors";
import { BrushController } from "../brushes/brushController";
import { ImageBrush } from "../brushes/imageBrush";
import { NoiseBrush } from "../brushes/noiseBrush";
import { Core } from "../core";
import { Layer } from "../layerController";
import { Packet } from "../networkController";
import { CanvasBuffer } from "./canvasBuffer";
type Rect = {
  startPos: Vector2;
  width: number;
  height: number;
};
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
  startPos: Vector2;
  selectedRect: Rect;
  filledPixels = new Set<number>();
  needToFill: Vector2[] = [];
  constructor() {
    this.drawingCanvas = new CanvasBuffer();
    this.drawingCanvasEl = this.drawingCanvas.canvas;
    this.drawingCanvasEl.style.zIndex = "2";
  }

  fill(pos: Vector2, data: Uint8ClampedArray, oldColor: Uint8ClampedArray) {
    if (pos.y === 0) pos.y = 1;
    if (pos.x === 0) pos.x = 1;
    const posColorIdx = (pos.y * this.mainCanvas.width + pos.x) * 4;
    if (this.filledPixels.has(posColorIdx)) return;
    this.filledPixels.add(posColorIdx);
    const a = mapNumRange(
      Core.brushController.brush.color.color.a,
      0,
      1,
      0,
      255
    );
    data[posColorIdx] = Core.brushController.brush.color.color.r;
    data[posColorIdx + 1] = Core.brushController.brush.color.color.g;
    data[posColorIdx + 2] = Core.brushController.brush.color.color.b;
    data[posColorIdx + 3] = a;
    for (let i = pos.y - 1; i <= pos.y + 1; i++) {
      for (let j = pos.x - 1; j <= pos.x + 1; j++) {
        if (i === pos.y && j === pos.x) continue;
        const colorStartIdx = (i * this.mainCanvas.width + j) * 4;
        const color = [
          data[colorStartIdx],
          data[colorStartIdx + 1],
          data[colorStartIdx + 2],
          data[colorStartIdx + 3],
        ];
        if (
          colorsAreClose(
            { r: color[0], g: color[1], b: color[2], a: color[3] },
            { r: oldColor[0], g: oldColor[1], b: oldColor[2], a: oldColor[3] }
          )
        ) {
          this.needToFill.push(new Vector2(j, i));
        }
      }
    }
  }

  startDraw(pos: Vector2, pressure: number) {
    if (!Core.networkController.socket.readyState) return;
    this.startPos = pos;
    this.clearDrawing();
    if (Core.brushController.mode === "fill" && this.needToFill.length === 0) {
      const imagedata = this.mainCanvas.ctx.getImageData(
        0,
        0,
        this.mainCanvas.width,
        this.mainCanvas.height
      );
      const data = imagedata.data;
      const oldColor = this.mainCanvas.ctx.getImageData(
        pos.x,
        pos.y,
        1,
        1
      ).data; // target color

      this.fill(pos, data, oldColor);
      while (this.needToFill.length) {
        this.fill(this.needToFill.shift(), data, oldColor);
        if (this.needToFill.length > 1000)
          this.needToFill = this.needToFill.slice(0, 500);
      }
      this.needToFill = [];
      this.filledPixels.clear();
      this.mainCanvas.ctx.putImageData(imagedata, 0, 0);

      const dataurl = this.mainCanvasEl.toDataURL();
      Core.historyController.pushNewHistory({
        layer: Core.layerController.activeLayer,
        image: dataurl,
      });
      Core.networkController.sendImage(
        Core.layerController.activeLayer.id,
        dataurl
      );
      Core.networkController.saveImage(
        Core.layerController.activeLayer.id,
        dataurl
      );
      return;
    }
    if (Core.brushController.mode === "move") {
      delete this.mainCopy;
      this.mainCopy = new CanvasBuffer(false);
      this.mainCopy.ctx.drawImage(this.mainCanvasEl, 0, 0);
      return;
    }
    this.selectedRect = null;
    if (Core.brushController.mode === "select") return;
    Core.brushController.startDraw(
      this.drawingCanvas.ctx,
      Core.layerController.activeLayer,
      pos,
      pressure
    );
    if (Core.brushController.mode === "erase") {
      delete this.mainCopy;
      this.mainCopy = new CanvasBuffer(false);
      this.mainCopy.ctx.drawImage(this.mainCanvasEl, 0, 0);
      this.drawingCanvasEl.style.opacity = "0";
    }
    Core.networkController.sendStart(Core.layerController.activeLayer.id);
  }
  draw(pos: Vector2, pressure: number) {
    if (!Core.networkController.socket.readyState) return;
    if (Core.brushController.mode === "fill") return;
    if (Core.brushController.mode === "move") {
      this.clearMain(this.selectedRect);
      this.clearDrawing();
      const newPos = pos.subVec(this.startPos);
      if (this.selectedRect) {
        newPos.x += this.selectedRect.startPos.x;
        newPos.y += this.selectedRect.startPos.y;
      }
      if (!this.selectedRect) {
        this.drawingCanvas.ctx.drawImage(
          this.mainCopy.canvas,
          newPos.x,
          newPos.y
        );
      } else {
        this.drawingCanvas.ctx.drawImage(
          this.mainCopy.canvas,
          this.selectedRect.startPos.x,
          this.selectedRect.startPos.y,
          this.selectedRect.width,
          this.selectedRect.height,
          newPos.x,
          newPos.y,
          this.selectedRect.width,
          this.selectedRect.height
        );
      }
      return;
    }
    if (Core.brushController.mode === "select") {
      this.clearDrawing();
      this.drawingCanvas.ctx.strokeStyle = "#000";
      this.drawingCanvas.ctx.setLineDash([6]);
      this.drawingCanvas.ctx.lineWidth = 1;
      const w = pos.x - this.startPos.x;
      const h = pos.y - this.startPos.y;
      this.drawingCanvas.ctx.strokeRect(this.startPos.x, this.startPos.y, w, h);
      this.selectedRect = {
        startPos: this.startPos,
        width: w,
        height: h,
      };
      return;
    }
    Core.brushController.draw(this.drawingCanvas.ctx, pos, pressure);
    if (Core.brushController.mode === "erase") {
      this.clearMain();
      this.mainCanvas.ctx.drawImage(this.mainCopy.canvas, 0, 0);
      this.mainCanvas.ctx.globalCompositeOperation = "destination-out";
      this.mainCanvas.ctx.globalAlpha =
        Core.brushController.brush.color.color.a;
      this.mainCanvas.ctx.drawImage(this.drawingCanvasEl, 0, 0);
      this.mainCanvas.ctx.globalAlpha = 1;
      this.mainCanvas.ctx.globalCompositeOperation = "source-over";
    }
    if (Core.brushController.mode === "draw") {
      this.pushData(pos, pressure);
    }
  }
  endDraw() {
    if (!Core.networkController.socket.readyState) return;
    if (Core.brushController.mode === "fill") return;
    if (Core.brushController.mode === "move") {
      this.mainCanvas.ctx.drawImage(this.drawingCanvas.canvas, 0, 0);
      const dataurl = this.mainCanvasEl.toDataURL();
      Core.historyController.pushNewHistory({
        layer: Core.layerController.activeLayer,
        image: dataurl,
      });
      Core.networkController.sendImage(
        Core.layerController.activeLayer.id,
        dataurl
      );
      this.selectedRect = null;
      this.clearDrawing();

      return;
    }
    if (Core.brushController.mode === "select") {
      return;
    }
    Core.brushController.endDraw(this.drawingCanvas.ctx);
    if (Core.brushController.mode === "erase") {
      this.clearMain();
      this.mainCanvas.ctx.drawImage(this.mainCopy.canvas, 0, 0);
      delete this.mainCopy;
      this.mainCanvas.ctx.globalCompositeOperation = "destination-out";
    }
    this.mainCanvas.ctx.globalAlpha = Core.brushController.brush.color.color.a;
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
    const dataurl = this.mainCanvasEl.toDataURL();
    Core.networkController.sendStop(Core.layerController.activeLayer.id);
    Core.historyController.pushNewHistory({
      layer: Core.layerController.activeLayer,
      image: dataurl,
    });
    Core.networkController.saveImage(
      Core.layerController.activeLayer.id,
      dataurl
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
          data.pos,
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

  clearMain(rect?: Rect, saveAndSend: boolean = false) {
    if (!rect) {
      this.mainCanvas.ctx.clearRect(
        0,
        0,
        this.mainCanvasEl.width,
        this.mainCanvasEl.height
      );
    } else {
      this.mainCanvas.ctx.clearRect(
        rect.startPos.x,
        rect.startPos.y,
        rect.width,
        rect.height
      );
    }
    if (saveAndSend) {
      const dataurl = this.mainCanvasEl.toDataURL();
      Core.historyController.pushNewHistory({
        layer: Core.layerController.activeLayer,
        image: dataurl,
      });
      Core.networkController.sendImage(
        Core.layerController.activeLayer.id,
        dataurl
      );
      Core.networkController.saveImage(
        Core.layerController.activeLayer.id,
        dataurl
      );
    }
  }
  clearDrawing() {
    this.drawingCanvas.ctx.clearRect(
      0,
      0,
      this.drawingCanvasEl.width,
      this.drawingCanvasEl.height
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
      position: Core.layerController.layers.length,
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

  rerenderCanvases() {
    const arr = Core.layerController.layers.sort(
      (a, b) => b.position - a.position
    );
    arr.forEach((item) => {
      this.drawingCanvasEl.before(item.buffer.canvas);
    });
  }

  getColorAtPos(pos: Vector2) {
    const canvas = new CanvasBuffer(false);
    const canvases = document.querySelectorAll("#app canvas");
    Array.from(canvases).forEach((item: HTMLCanvasElement) => {
      canvas.ctx.drawImage(item, 0, 0);
    });
    const [r, g, b] = canvas.ctx.getImageData(pos.x, pos.y, 1, 1).data;

    return new Color(
      `0x${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b
        .toString(16)
        .padStart(2, "0")}ff`
    );
  }

  drawImage(data: string) {
    const image = new Image();
    image.onload = () => {
      this.mainCanvas.ctx.drawImage(image, 0, 0);
    };
    image.src = data;
  }
}
