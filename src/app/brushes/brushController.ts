import { ColorRGB } from "../../helpers/color";
import { mapNumRange } from "../../helpers/utils";
import { Vector2 } from "../../helpers/vectors";
import { Core } from "../core";
import { Layer } from "../layerController";
import { BasicBrush } from "./basicBrush";
import { GrainyBrush } from "./grainyBrush";
import { ImageBrush } from "./imageBrush";
import { NoiseBrush } from "./noiseBrush";
import { SlicedBrush } from "./slicedBrush";
import { SmudgeBrush } from "./smudgeBrush";
import { SoftBrush } from "./softBrush";
import { SprayBrush } from "./sprayBrush";

export type BrushModes = "draw" | "erase" | "move" | "select" | "fill";

export class BrushController {
  brush: BasicBrush | ImageBrush | SlicedBrush;
  mode: BrushModes = "draw";
  brushesTypes = {
    BasicBrush: BasicBrush,
    SoftBrush: SoftBrush,
    GrainyBrush: GrainyBrush,
    SlicedBrush: SlicedBrush,
    SprayBrush: SprayBrush,
    NoiseBrush: NoiseBrush,
    SmudgeBrush: SmudgeBrush,
  };
  saveHistory: boolean;
  constructor(saveHistory: boolean = false) {
    this.saveHistory = saveHistory;
    this.brush = new BasicBrush("0x000000", 16);
    this.setBrushColor({ r: 0, g: 0, b: 0 });
    this.setBrushSize(16);
    this.setBrushOpacity(100);
  }

  startDraw(
    ctx: CanvasRenderingContext2D,
    layer: Layer,
    pos: Vector2,
    pressure: number
  ) {
    if (this.mode !== "draw" && this.mode !== "erase") return;
    ctx.canvas.style.opacity = (
      this.brush.color.color.a * layer.opacity
    ).toString();
    ctx.setLineDash([0]);
    this.brush.startDraw(ctx, pos, pressure);
  }

  draw(ctx: CanvasRenderingContext2D, pos: Vector2, pressure: number) {
    if (this.mode !== "draw" && this.mode !== "erase") return;
    this.brush.draw(ctx, pos, pressure);
  }

  endDraw(ctx: CanvasRenderingContext2D) {
    if (this.mode !== "draw" && this.mode !== "erase") return;
    this.brush.endDraw(ctx);
  }

  setMode(mode: BrushModes) {
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
      Core.uiController.rerender();
    }
  }

  setSpacing(n: number) {
    if (this.brush instanceof ImageBrush || this.brush instanceof NoiseBrush) {
      this.brush.setSpacing.bind(this.brush)(n);
    }
  }
}
