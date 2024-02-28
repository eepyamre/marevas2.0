import { Core } from "./src/app/core";

addEventListener("DOMContentLoaded", () => {
  const appRoot = document.querySelector<HTMLDivElement>("#app");
  if (!appRoot) throw new Error("No #app found.");
  const app = Core.setup(appRoot);
});
