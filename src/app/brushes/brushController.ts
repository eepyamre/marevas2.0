import { Vector2 } from "../../helpers/vectors";
import { BasicBrush } from "./basicBrush";

export class BrushController {
  brush: BasicBrush;
  brushesTypes = {
    BasicBrush: BasicBrush,
  };
  constructor() {
    this.brush = new BasicBrush(0xff12ff10, 16);
  }

  startDraw(ctx: CanvasRenderingContext2D, pos: Vector2) {
    this.brush.startDraw(ctx, pos);
  }
  draw(ctx: CanvasRenderingContext2D, pos: Vector2) {
    this.brush.draw(ctx, pos);
  }
  endDraw(ctx: CanvasRenderingContext2D) {
    this.brush.endDraw(ctx);
  }
}
