import { getRandomFloat } from "../../helpers/utils";
import { Vector2 } from "../../helpers/vectors";
import { BasicBrush } from "./basicBrush";

export class SprayBrush extends BasicBrush {
  type = "SprayBrush";
  timer: any;
  density = 50;
  constructor(color: string, size: number) {
    super(color, size);
  }
  draw(ctx: CanvasRenderingContext2D, pos: Vector2, pressure: number) {
    for (let i = Math.round(this.density * pressure); i--; ) {
      const angle = getRandomFloat(0, Math.PI * 2);
      const radius = getRandomFloat(0, this.size);
      ctx.fillRect(
        pos.x + radius * Math.cos(angle),
        pos.y + radius * Math.sin(angle),
        1,
        1
      );
    }
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.timer = setInterval(this.draw.bind(this, ctx, pos, pressure), 50);
  }
  endDraw(ctx: CanvasRenderingContext2D): void {
    ctx.canvas.style.opacity = "1";
    clearInterval(this.timer);
  }
}
