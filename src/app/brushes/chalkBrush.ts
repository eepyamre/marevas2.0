import chalkBrush from "../../assets/brushes/chalk_brush.png";
import { ImageBrush } from "./imageBrush";

export class ChalkBrush extends ImageBrush {
  type = "ChalkBrush";
  constructor(color: string, size: number) {
    super(color, size, chalkBrush);
  }
}
