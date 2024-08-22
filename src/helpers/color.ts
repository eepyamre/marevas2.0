import { mapNumRange } from "./utils";

export type ColorHex = string;
export interface ColorRGB {
  r: number;
  g: number;
  b: number;
}
export interface ColorRGBA extends ColorRGB {
  a: number;
}
export type ColorType = ColorRGBA;
export class Color {
  color: ColorType;
  constructor(color: ColorHex) {
    const rgb = +color.slice(0, 8);
    const a = "0x" + color.slice(8);
    this.color = {
      r: (rgb >> (8 * 2)) & 0xff,
      g: (rgb >> (8 * 1)) & 0xff,
      b: (rgb >> (8 * 0)) & 0xff,
      a: 1,
    };
    if (a) {
      this.color.a = mapNumRange(+a, 0, 255, 0, 1);
    }
  }

  static fromRGB({ r, g, b }: ColorRGB) {
    return new Color(Color.fromRGBAToHex({ r, g, b, a: 1 }));
  }

  static fromRGBAToHex({ r, g, b, a }: ColorRGBA) {
    return `0x${r.toString(16).padStart(2, "0")}${g
      .toString(16)
      .padStart(2, "0")}${b.toString(16).padStart(2, "0")}${Math.round(a * 255)
      .toString(16)
      .padStart(2, "0")}`;
  }

  toCanvasSrting() {
    return `rgb(${this.color.r}, ${this.color.g}, ${this.color.b})`;
  }

  toHex() {
    return `0x${this.color.r.toString(16).padStart(2, "0")}${this.color.g
      .toString(16)
      .padStart(2, "0")}${this.color.b
      .toString(16)
      .padStart(2, "0")}${Math.round(this.color.a * 255)
      .toString(16)
      .padStart(2, "0")}`;
  }
}
