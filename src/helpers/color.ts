export type ColorHex = number;
export type ColorRGBA = { r: number; g: number; b: number; a: number };
export type ColorType = ColorRGBA;
export class Color {
  color: ColorType;
  constructor(color: ColorHex) {
    if (color > 16777215) {
      this.color = {
        r: (color >> (8 * 3)) & 0xff,
        g: (color >> (8 * 2)) & 0xff,
        b: (color >> (8 * 1)) & 0xff,
        a: ((color >> (8 * 0)) & 0xff) / 255,
      };
    } else {
      this.color = {
        r: (color >> (8 * 2)) & 0xff,
        g: (color >> (8 * 1)) & 0xff,
        b: (color >> (8 * 0)) & 0xff,
        a: 1,
      };
    }
  }

  toCanvasSrting() {
    return `rgba(${this.color.r}, ${this.color.g}, ${this.color.b})`;
  }

  toHex() {
    return `0x${this.color.r.toString(16)}${this.color.g.toString(
      16
    )}${this.color.b.toString(16)}${(this.color.a * 255).toString(16)}`;
  }
}
