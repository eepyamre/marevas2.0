import { BasicBrush } from "./basicBrush";
import { Vector2 } from "../../helpers/vectors";

export class ImageBrush extends BasicBrush {
  type = "ImageBrush";
  image: HTMLImageElement;
  constructor(color: string, size: number, image: string) {
    super(color, size);
    this.image = new Image();
    this.image.src = image;
  }
  draw(ctx: CanvasRenderingContext2D, pos: Vector2, pressure: number): void {
    this.points[0] = this.points[1];
    this.points[1] = this.points[2];
    this.points[2] = pos;

    if (this.points[0] == null) return;

    const p0 = this.points[0];
    const p1 = this.points[1];
    const p2 = this.points[2];

    const x0 = (p0.x + p1.x) / 2;
    const y0 = (p0.y + p1.y) / 2;

    const x1 = (p1.x + p2.x) / 2;
    const y1 = (p1.y + p2.y) / 2;

    const targetSize = this.size * pressure;
    let size = targetSize;
    if (Math.abs(targetSize - this.prevSize) > 0.5) {
      size = this.prevSize + (this.prevSize > targetSize ? -0.5 : 0.5);
    }
    this.prevSize = size;
    ctx.lineWidth = size;
    let diffX = Math.abs(x0 - x1),
      diffY = Math.abs(y0 - y1),
      dist = Math.sqrt(diffX * diffX + diffY * diffY),
      step = size / (dist ? dist : 1),
      i = 0,
      t = 0,
      b: number,
      x: number,
      y: number;

    this.image.width = size;
    this.image.height = size;
    while (i <= dist) {
      t = Math.max(0, Math.min(1, i / dist));
      x = x1 + (x0 - x1) * t;
      y = y1 + (y0 - y1) * t;
      b = (Math.random() * 3) | 0;

      ctx.drawImage(
        this.image,
        x - size * 0.5,
        y - size * 0.5,
        this.image.width,
        this.image.height
      );
      i += step;
    }
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = this.color.toCanvasSrting();
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.globalCompositeOperation = "source-over";
  }
}
