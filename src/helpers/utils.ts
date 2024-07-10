import { ColorRGBA } from "./color";
import { Vector2 } from "./vectors";

export const mapNumRange = (
  num: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
) => ((num - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;

export const getRandomFloat = (min: number, max: number) => {
  return Math.random() * (max - min) + min;
};

export const perlinNoiseGen = () => {
  let grid: Vector2[][] = [];
  const nodes = 4;
  const random_unit_vector = () => {
    let theta = Math.random() * 2 * Math.PI;
    return new Vector2(Math.cos(theta), Math.sin(theta));
  };
  for (let i = 0; i < nodes; i++) {
    let row: Vector2[] = [];
    for (let j = 0; j < nodes; j++) {
      row.push(random_unit_vector());
    }
    grid.push(row);
  }
  return grid;
};

export const colorsAreClose = (
  c1: ColorRGBA,
  c2: ColorRGBA,
  threshold = 50
) => {
  const r = c1.r - c2.r,
    g = c1.g - c2.g,
    b = c1.b - c2.b,
    a = c1.a - c2.a;
  return r * r + g * g + b * b + a * a <= Math.pow(threshold, 2.6);
};

export const lerp = (a: number, b: number, alpha: number) => {
  return a + alpha * (b - a);
};
