import { Vecotor2 } from "../../helpers/vectors";
import { Core } from "../core";

export class Controls {
  app:Core
  shouldDraw = false
  constructor(core: Core) {
    core.ctx.canvas.addEventListener("pointerdown", this.pointerdown);
    core.ctx.canvas.addEventListener("pointermove", this.pointermove);
    core.ctx.canvas.addEventListener("pointerup", this.pointerup);
    core.ctx.canvas.addEventListener('contextmenu', e=>e.preventDefault())
    this.app = core
  }
  private pointerdown = (e: PointerEvent) => {
    this.app.startDraw(new Vecotor2(e.clientX, e.clientY))
    this.shouldDraw = true
  };
  private pointermove = (e: PointerEvent) => {
    if(this.shouldDraw) this.app.draw(new Vecotor2(e.clientX, e.clientY))
  };
  private pointerup = (e: PointerEvent) => {
    if(this.shouldDraw) {
      this.app.endDraw()
      this.shouldDraw = false
    }
  };
}
