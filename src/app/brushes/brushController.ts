import { mapNumRange } from "../../helpers/utils";
import { Vector2 } from "../../helpers/vectors";
import { BasicBrush } from "./basicBrush";

export class BrushController {
  brush: BasicBrush;
  mode: "draw" | "erase" = "draw";
  brushesTypes = {
    BasicBrush: BasicBrush,
  };
  constructor() {
    this.brush = new BasicBrush("0xff12ffff", 16);
  }

  startDraw(ctx: CanvasRenderingContext2D) {
    this.brush.startDraw(ctx);
  }

  draw(
    ctx: CanvasRenderingContext2D,
    prevPos: Vector2,
    pos: Vector2,
    pressure: number
  ) {
    this.brush.draw(ctx, prevPos, pos, pressure);
  }

  endDraw(ctx: CanvasRenderingContext2D) {
    this.brush.endDraw(ctx);
  }

  setMode(mode: "draw" | "erase") {
    this.mode = mode;
  }

  setBrushSize(size: number) {
    this.brush.size = size;
  }

  setBrushOpacity(opacity: number) {
    this.brush.color.color.a = mapNumRange(opacity, 100, 0, 0, 1);
  }

  setBrushColor(color: { r: number; g: number; b: number }) {
    this.brush.color.color.r = color.r;
    this.brush.color.color.g = color.g;
    this.brush.color.color.b = color.b;
  }
}
