import { mapNumRange } from "../../helpers/utils";
import { Vector2 } from "../../helpers/vectors";
import { Core } from "../core";

export class InputController {
  shouldDraw = false;
  moveCanvas = false;
  stablizationLevel = 3;
  pointerBuffer: Vector2[] = [];
  constructor() {
    Core.appRoot.addEventListener("pointerdown", this.pointerdown);
    Core.appRoot.addEventListener("pointermove", this.pointermove);
    Core.appRoot.addEventListener("pointerup", this.pointerup);
    Core.appRoot.addEventListener("pointerout", this.pointerup);
    Core.appRoot.addEventListener("contextmenu", (e) => e.preventDefault());
    Core.appRoot.addEventListener("wheel", this.zoom);
    addEventListener("keydown", this.keyEvents);
  }
  private keyEvents(e: KeyboardEvent) {
    if (e.key === "e") {
      e.preventDefault();
      Core.brushController.setMode(
        Core.brushController.mode === "draw" ? "erase" : "draw"
      );
    }
    if (e.ctrlKey) {
      if (e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        Core.historyController.redo();
        return;
      }
      if (e.key.toLowerCase() === "z") {
        e.preventDefault();
        Core.historyController.undo();
        return;
      }
    }
  }

  private pointerdown = (e: PointerEvent) => {
    e.preventDefault();
    Core.bufferController.drawingCanvasEl.setPointerCapture(e.pointerId);
    if (e.buttons === 4) {
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

    const stabilizedPosition = this.calculateStabilizedPosition();

    if (this.shouldDraw && e.buttons)
      Core.bufferController.draw(
        stabilizedPosition,
        e.pointerType === "pen" ? e.pressure : 1
      );
    if (this.moveCanvas) {
      Core.appRoot.style.transform = Core.getTransformStyle(
        e.movementX / Core.canvasOptions.zoom,
        e.movementY / Core.canvasOptions.zoom
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
    if (this.shouldDraw) {
      Core.bufferController.endDraw();
      this.shouldDraw = false;
    }
    this.pointerBuffer = [];
    this.moveCanvas = false;
  };

  private zoom = (e: WheelEvent) => {
    e.preventDefault();
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
