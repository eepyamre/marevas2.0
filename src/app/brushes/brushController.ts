import { ColorRGB } from "../../helpers/color";
import { mapNumRange } from "../../helpers/utils";
import { Vector2 } from "../../helpers/vectors";
import { Core } from "../core";
import { Layer } from "../layerController";
import { BasicBrush } from "./basicBrush";
import { GrainyBrush } from "./grainyBrush";
import { SlicedBrush } from "./slicedBrush";
import { SoftBrush } from "./softBrush";
import { SprayBrush } from "./sprayBrush";

export class BrushController {
  brush: BasicBrush;
  mode: "draw" | "erase" = "draw";
  brushesTypes = {
    BasicBrush: BasicBrush,
    SoftBrush: SoftBrush,
    GrainyBrush: GrainyBrush,
    SlicedBrush: SlicedBrush,
    SprayBrush: SprayBrush,
  };
  saveHistory: boolean;
  constructor(saveHistory: boolean = false) {
    this.saveHistory = saveHistory;
    this.brush = new BasicBrush("0x000000", 16);
    this.setBrushColor({ r: 0, g: 0, b: 0 });
    this.setBrushSize(16);
    this.setBrushOpacity(100);
  }

  startDraw(ctx: CanvasRenderingContext2D, layer: Layer, pressure: number) {
    ctx.canvas.style.opacity = (
      this.brush.color.color.a * layer.opacity
    ).toString();
    this.brush.startDraw(ctx, pressure);
  }

  draw(ctx: CanvasRenderingContext2D, pos: Vector2, pressure: number) {
    this.brush.draw(ctx, pos, pressure);
  }

  endDraw(ctx: CanvasRenderingContext2D) {
    this.brush.endDraw(ctx);
  }

  setMode(mode: "draw" | "erase") {
    const run = () => {
      this.mode = mode;
    };
    Core.uiController.setEraser(mode === "erase");
    run();
  }

  setBrushSize(size: number) {
    const run = () => {
      this.brush.size = size;
      Core.uiController.changeSize(size);
    };
    run();
  }

  setBrushOpacity(opacity: number, updateUI: boolean = true) {
    const run = () => {
      this.brush.color.color.a = mapNumRange(opacity, 0, 100, 0, 1);
      if (updateUI) {
        Core.uiController.changeOpacity(opacity);
      }
    };
    run();
  }

  setBrushColor(color: ColorRGB) {
    this.brush.color.color.r = color.r;
    this.brush.color.color.g = color.g;
    this.brush.color.color.b = color.b;
  }

  selectBrush(type: keyof typeof this.brushesTypes, updateUI?: boolean) {
    const opacity = this.brush.color.color.a;
    const color = this.brush.color.toHex();
    this.brush = new this.brushesTypes[type](color, this.brush.size);
    this.brush.color.color.a = opacity;
    if (updateUI) {
      Core.uiController.rerenderTabs();
    }
  }
}
