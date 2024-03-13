import softBrush from "../../assets/brushes/soft_brush.png";
import { ImageBrush } from "./imageBrush";

export class SoftBrush extends ImageBrush {
  type = "SoftBrush";
  constructor(color: string, size: number) {
    super(color, size, softBrush);
  }
}
