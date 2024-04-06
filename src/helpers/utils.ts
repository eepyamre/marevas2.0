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
