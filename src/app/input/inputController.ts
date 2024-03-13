import { mapNumRange } from "../../helpers/utils";
import { Vector2 } from "../../helpers/vectors";
import { Core } from "../core";

export class InputController {
  shouldDraw = false;
  moveCanvas = false;
  spacePressed = false;
  stablizationLevel = 3;
  pointerBuffer: Vector2[] = [];
  lastTimestamp = 0;
  prevMovX = 0;
  prevMovY = 0;
  constructor() {
    Core.appRoot.addEventListener("pointerdown", this.pointerdown);
    Core.appRoot.addEventListener("pointermove", this.pointermove);
    Core.appRoot.addEventListener("pointerup", this.pointerup);
    Core.appRoot.addEventListener("pointerout", this.pointerup);
    Core.appRoot.addEventListener("contextmenu", (e) => e.preventDefault());
    Core.appRoot.addEventListener("wheel", this.zoom);
    addEventListener("keydown", this.keyEvents);
    addEventListener("keyup", this.keyUpEvents);
  }
  private keyUpEvents = (e: KeyboardEvent) => {
    if (e.key === " ") {
      e.preventDefault();
      this.moveCanvas = false;
      this.shouldDraw = true;
      this.spacePressed = false;
      return;
    }
  };
  private keyEvents = (e: KeyboardEvent) => {
    if (e.key === "e") {
      e.preventDefault();
      Core.brushController.setMode(
        Core.brushController.mode === "draw" ? "erase" : "draw"
      );
      return;
    }
    if (e.key === " ") {
      e.preventDefault();
      this.spacePressed = true;
      return;
    }
    if (e.ctrlKey) {
      this.lastTimestamp = e.timeStamp;
      if (e.shiftKey && e.key.toLowerCase() === "z") {
        if (e.timeStamp < this.lastTimestamp + 100) return;
        e.preventDefault();
        Core.historyController.redo();
        return;
      }
      switch (e.key.toLowerCase()) {
        case "z":
          if (e.timeStamp < this.lastTimestamp + 100) break;
          e.preventDefault();
          Core.historyController.undo();
          break;
        case "s":
          e.preventDefault();
          Core.bufferController.exportPNG();
          break;
        case "]":
          e.preventDefault();
          Core.brushController.setBrushSize(
            Core.brushController.brush.size + 1
          );
          break;
        case "[":
          e.preventDefault();
          Core.brushController.setBrushSize(
            Core.brushController.brush.size - 1
          );
          break;
        case "-":
          e.preventDefault();
          Core.bufferController.updateCanvasZoom(0.9);
          break;
        case "+":
          e.preventDefault();
          Core.bufferController.updateCanvasZoom(1.1);
          break;
      }
      return;
    }
    switch (e.key.toLowerCase()) {
      case "+":
      case "]":
        e.preventDefault();
        Core.brushController.setBrushSize(Core.brushController.brush.size + 1);
        break;
      case "-":
      case "[":
        e.preventDefault();
        Core.brushController.setBrushSize(Core.brushController.brush.size - 1);
        break;
    }
  };

  private pointerdown = (e: PointerEvent) => {
    e.preventDefault();
    Core.bufferController.drawingCanvasEl.setPointerCapture(e.pointerId);
    if (e.buttons === 4 || this.spacePressed) {
      this.moveCanvas = true;
      this.shouldDraw = false;
      return;
    }
    Core.bufferController.startDraw(e.pointerType === "pen" ? e.pressure : 1);
    this.shouldDraw = true;
  };

  private pointermove = (e: PointerEvent) => {
    e.preventDefault();
    this.pointerBuffer.push(new Vector2(e.offsetX, e.offsetY));
    if (this.pointerBuffer.length > this.stablizationLevel) {
      this.pointerBuffer.shift();
    }

    if (this.moveCanvas) {
      let movX = e.movementX;
      let movY = e.movementY;
      if (e.pointerType === "pen") {
        if (this.prevMovX && this.prevMovY) {
          movX -= this.prevMovX;
          movY -= this.prevMovY;
        }
        this.prevMovX = e.movementX;
        this.prevMovY = e.movementY;
      }
      Core.appRoot.style.transform = Core.getTransformStyle(
        movX / Core.canvasOptions.zoom,
        movY / Core.canvasOptions.zoom
      );
      return;
    }

    const stabilizedPosition = this.calculateStabilizedPosition();
    if (this.shouldDraw && e.buttons) {
      Core.bufferController.draw(
        stabilizedPosition,
        e.pointerType === "pen" ? e.pressure : 1
      );
    }
  };

  private calculateStabilizedPosition() {
    let sumX = 0;
    let sumY = 0;
    for (const point of this.pointerBuffer) {
      sumX += point.x;
      sumY += point.y;
    }
    const avgX = sumX / this.pointerBuffer.length;
    const avgY = sumY / this.pointerBuffer.length;
    return new Vector2(Math.round(avgX), Math.round(avgY));
  }

  private pointerup = (e: PointerEvent) => {
    e.preventDefault();
    Core.bufferController.drawingCanvasEl.releasePointerCapture(e.pointerId);
    if (this.shouldDraw && !this.spacePressed) {
      Core.bufferController.endDraw();
      this.shouldDraw = false;
    }
    this.prevMovX = undefined;
    this.prevMovY = undefined;
    this.pointerBuffer = [];
    this.moveCanvas = false;
  };

  private zoom = (e: WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey) {
      Core.brushController.setBrushSize(
        Core.brushController.brush.size + (e.deltaY < 0 ? 1 : -1)
      );
      return;
    }
    let scale = 0.9;
    if (e.deltaY < 0) {
      scale = 1.1;
      if (Core.canvasOptions.zoom === 0.05) {
        return;
      }
    }
    Core.bufferController.updateCanvasZoom(scale);
  };

  setStabilizationLevel = (n: number) => {
    this.stablizationLevel = mapNumRange(n, 0, 100, 0, 30);
  };
}
