import { Vector2 } from "../../helpers/vectors";
import { Core } from "../core";

export class InputController {
  shouldDraw = false;
  moveCanvas = false;
  constructor() {
    Core.appRoot.addEventListener("pointerdown", this.pointerdown);
    Core.appRoot.addEventListener("pointermove", this.pointermove);
    Core.appRoot.addEventListener("pointerup", this.pointerup);
    Core.appRoot.addEventListener("pointerout", this.pointerup);
    Core.appRoot.addEventListener("contextmenu", (e) => e.preventDefault());
    Core.appRoot.addEventListener("wheel", this.zoom);
  }
  private pointerdown = (e: PointerEvent) => {
    e.preventDefault();
    if (e.buttons === 4) {
      this.moveCanvas = true;
      this.shouldDraw = false;
      return;
    }
    Core.bufferController.startDraw(new Vector2(e.layerX, e.layerY));
    this.shouldDraw = true;
  };
  private pointermove = (e: PointerEvent) => {
    e.preventDefault();
    if (this.shouldDraw)
      Core.bufferController.draw(new Vector2(e.layerX, e.layerY));
    if (this.moveCanvas) {
      Core.appRoot.style.transform = Core.getTransformStyle(
        e.movementX,
        e.movementY
      );
    }
  };
  private pointerup = (e: PointerEvent) => {
    e.preventDefault();
    if (this.shouldDraw) {
      Core.bufferController.endDraw();
      this.shouldDraw = false;
    }
    this.moveCanvas = false;
  };
  private zoom = (e: WheelEvent) => {
    let scale = 0.9;
    if (e.deltaY < 0) {
      scale = 1.1;
      if (Core.canvasOptions.zoom === 0.05) {
        return;
      }
    }
    Core.bufferController.updateCanvasZoom(scale);
  };
}
