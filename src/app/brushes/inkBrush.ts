import inkBrush from "../../assets/brushes/ink_brush.png";
import { ImageBrush } from "./imageBrush";

export class InkBrush extends ImageBrush {
  type = "InkBrush";
  constructor(color: string, size: number) {
    super(color, size, inkBrush);
  }
}
