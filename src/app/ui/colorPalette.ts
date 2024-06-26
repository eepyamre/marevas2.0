import { ColorRGB } from "../../helpers/color";
import { Vector2 } from "../../helpers/vectors";

export class ColorPicker {
  picker: HTMLCanvasElement;
  pickerCursor: HTMLDivElement;
  slider: HTMLCanvasElement;
  sliderCursor: HTMLDivElement;
  ctx: CanvasRenderingContext2D;
  ctx1: CanvasRenderingContext2D;
  gradientColor: string;
  pos = new Vector2(249, 0);
  sliderX = 0;
  onChange: (color: { r: number; g: number; b: number }) => unknown;
  constructor(
    onChange: (color: { r: number; g: number; b: number }) => unknown
  ) {
    this.picker = document.querySelector("#color_picker")!;
    this.slider = document.querySelector("#color_slider")!;
    this.pickerCursor = document.querySelector(
      ".color_picker-wrapper .cursor"
    )!;
    this.sliderCursor = document.querySelector(
      ".color_slider-wrapper .cursor"
    )!;
    if (
      !this.picker ||
      !this.slider ||
      !this.pickerCursor ||
      !this.sliderCursor
    ) {
      throw new Error("No color picker!");
    }
    this.slider.addEventListener("pointerup", this.changeColor);
    this.picker.addEventListener("pointerup", this.setColor);
    this.ctx = this.picker.getContext("2d")!;
    this.ctx1 = this.slider.getContext("2d")!;
    if (!this.ctx || !this.ctx1) {
      throw new Error("Can't get color picker 2d context!");
    }
    this.gradientColor = "#ff0000";
    this.generateColorWheel();
    const gradientSlide = this.ctx1.createLinearGradient(
      0,
      0,
      this.ctx1.canvas.width,
      0
    );
    gradientSlide.addColorStop((1 / 6) * 0, "#ff0000");
    gradientSlide.addColorStop((1 / 6) * 1, "#ffff00");
    gradientSlide.addColorStop((1 / 6) * 2, "#00ff00");
    gradientSlide.addColorStop((1 / 6) * 3, "#00ffff");
    gradientSlide.addColorStop((1 / 6) * 4, "#0000ff");
    gradientSlide.addColorStop((1 / 6) * 5, "#ff00ff");
    gradientSlide.addColorStop((1 / 6) * 6, "#ff0000");
    this.ctx1.fillStyle = gradientSlide;
    this.ctx1.fillRect(0, 0, this.ctx1.canvas.width, this.ctx1.canvas.height);
    this.onChange = onChange;
  }

  private changeColor = (e: PointerEvent) => {
    const x = e.offsetX;
    const pixel = this.ctx1.getImageData(x, 10, 1, 1).data;
    this.sliderX = x;
    this.gradientColor = `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`;
    this.sliderCursor.style.cssText = `left:calc(${x}px);`;

    this.generateColorWheel();
    this.setColor();
  };

  private generateColorWheel = () => {
    let gradientH = this.ctx.createLinearGradient(
      0,
      0,
      this.ctx.canvas.width,
      0
    );
    gradientH.addColorStop(0, "#fff");
    gradientH.addColorStop(1, this.gradientColor);
    this.ctx.fillStyle = gradientH;
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    let gradientV = this.ctx.createLinearGradient(0, 0, 0, 300);
    gradientV.addColorStop(0, "rgba(0,0,0,0)");
    gradientV.addColorStop(1, "#000");
    this.ctx.fillStyle = gradientV;
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  };

  private setColor = (e?: PointerEvent) => {
    const x = e ? e.offsetX : this.pos.x;
    const y = e ? e.offsetY : this.pos.y;
    this.pos = new Vector2(x, y);

    const pixel = this.ctx.getImageData(x, y, 1, 1).data;
    this.pickerCursor.style.cssText = `left:calc(${x}px - 5px);top:calc(${y}px - 5px);`;
    this.onChange &&
      this.onChange({
        r: pixel[0],
        g: pixel[1],
        b: pixel[2],
      });
  };

  private colorDistance = (rgb1: ColorRGB, rgb2: ColorRGB) => {
    const rDiff = rgb1.r - rgb2.r;
    const gDiff = rgb1.g - rgb2.g;
    const bDiff = rgb1.b - rgb2.b;
    return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
  };

  private findClosestAt = (
    ctx: CanvasRenderingContext2D,
    targetColor: ColorRGB
  ) => {
    const imageData = ctx.getImageData(
      0,
      0,
      ctx.canvas.width,
      ctx.canvas.height
    );
    const data = imageData.data;

    let minDistance = Infinity;
    let closestX: number, closestY: number;

    for (let y = 0; y < ctx.canvas.height; y++) {
      for (let x = 0; x < ctx.canvas.width; x++) {
        const index = (y * ctx.canvas.width + x) * 4;
        const pixelColor: ColorRGB = {
          r: data[index],
          g: data[index + 1],
          b: data[index + 2],
        };

        const distance = this.colorDistance(pixelColor, targetColor);
        if (distance < minDistance) {
          minDistance = distance;
          closestX = x;
          closestY = y;
        }
      }
    }
    return [closestX, closestY];
  };

  findClosestColorPosition = (targetColor: ColorRGB) => {
    const [sliderX] = this.findClosestAt(this.ctx1, targetColor);
    this.changeColor({
      offsetX: sliderX,
    } as any);
    const [palleteX, palleteY] = this.findClosestAt(this.ctx, targetColor);
    this.setColor({
      offsetX: palleteX,
      offsetY: palleteY,
    } as any);
  };
}
