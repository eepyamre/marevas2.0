import inkBrush from "../../assets/brushes/grainy_brush.png";
import { ImageBrush } from "./imageBrush";

export class GrainyBrush extends ImageBrush {
  type = "GrainyBrush";
  constructor(color: string, size: number, spacing: number = 5) {
    super(color, size, inkBrush, 1, spacing);
  }
}
