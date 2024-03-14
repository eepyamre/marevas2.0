import inkBrush from "../../assets/brushes/grainy_brush.png";
import { ImageBrush } from "./imageBrush";

export class GrainyBrush extends ImageBrush {
  type = "GrainyBrush";
  constructor(color: string, size: number) {
    super(color, size, inkBrush, 1);
  }
}
