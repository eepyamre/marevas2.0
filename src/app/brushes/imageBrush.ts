import { BasicBrush } from "./basicBrush";
import { Vector2 } from "../../helpers/vectors";

export class ImageBrush extends BasicBrush {
  type = "ImageBrush";
  image: HTMLImageElement;
  aspectRatio: number;
  prevPos: Vector2;
  spacing: number;
  constructor(
    color: string,
    size: number,
    image: string,
    aspectRatio: number = 1,
    spacing: number = 2
  ) {
    super(color, size);
    this.image = new Image();
    this.image.src = image;
    this.aspectRatio = aspectRatio;
    this.spacing = spacing;
  }
  startDraw(
    ctx: CanvasRenderingContext2D,
    pos: Vector2,
    pressure: number
  ): void {
    ctx.strokeStyle = this.color.toCanvasSrting();
    ctx.fillStyle = this.color.toCanvasSrting();
    ctx.lineJoin = this.lineJoin;
    ctx.lineCap = this.lineCap;
    this.prevSize = this.size * pressure;
    this.prevPos = pos;
    this.image.width = this.prevSize;
    this.image.height = this.prevSize;
    const posDelta = -this.prevSize / 2;
    ctx.drawImage(
      this.image,
      pos.x + posDelta,
      pos.y + posDelta,
      this.image.width,
      this.image.height
    );
  }
  draw(ctx: CanvasRenderingContext2D, pos: Vector2, pressure: number): void {
    if (!this.prevPos) {
      this.prevPos = pos;
    }
    const targetSize = this.size * pressure;
    let size = targetSize;
    if (Math.abs(targetSize - this.prevSize) > 0.5) {
      size = this.prevSize + (this.prevSize > targetSize ? -0.5 : 0.5);
    }
    this.prevSize = size;
    ctx.lineWidth = size;
    this.image.width = size;
    this.image.height = size;

    const diffX = Math.abs(this.prevPos.x - pos.x),
      diffY = Math.abs(this.prevPos.y - pos.y),
      dist = Math.sqrt(diffX * diffX + diffY * diffY);
    let i = this.spacing;

    if (dist < this.spacing) {
      return;
    }

    const angle = -this.prevPos.calculateAngle(pos) - Math.PI / 2;

    let x = pos.x;
    let y = pos.y;
    const posDelta = -size / 2;
    while (i < dist) {
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.drawImage(
        this.image,
        posDelta,
        posDelta,
        this.image.width,
        this.image.height
      );
      i += this.spacing;

      x = x + this.spacing * Math.cos(angle);
      y = y + this.spacing * Math.sin(angle);
      ctx.resetTransform();
    }
    this.prevPos = pos;

    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = this.color.toCanvasSrting();

    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.globalCompositeOperation = "source-over";
  }

  setSpacing(n: number) {
    this.spacing = n;
  }
}
