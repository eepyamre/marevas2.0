import { Vector2 } from "../../helpers/vectors";
import { Core } from "../core";

export class InputController {
  shouldDraw = false;
  constructor() {
    Core.appRoot.addEventListener("pointerdown", this.pointerdown);
    Core.appRoot.addEventListener("pointermove", this.pointermove);
    Core.appRoot.addEventListener("pointerup", this.pointerup);
    Core.appRoot.addEventListener("contextmenu", (e) => e.preventDefault());
  }
  private pointerdown = (e: PointerEvent) => {
    Core.bufferController.startDraw(new Vector2(e.clientX, e.clientY));
    this.shouldDraw = true;
  };
  private pointermove = (e: PointerEvent) => {
    if (this.shouldDraw)
      Core.bufferController.draw(new Vector2(e.clientX, e.clientY));
  };
  private pointerup = (e: PointerEvent) => {
    if (this.shouldDraw) {
      Core.bufferController.endDraw();
      this.shouldDraw = false;
    }
  };
}
