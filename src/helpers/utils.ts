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
