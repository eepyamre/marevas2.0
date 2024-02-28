import { Core } from "./src/app/core";

const WIDTH = 2400;
const HEIGHT = 1440;

addEventListener("DOMContentLoaded", () => {
  const appRoot = document.querySelector<HTMLDivElement>("#app");
  if (!appRoot) throw new Error("No #app found.");
  Core.setup(appRoot, "ws://127.0.0.1:6969", {
    width: WIDTH,
    height: HEIGHT,
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
  });
});
