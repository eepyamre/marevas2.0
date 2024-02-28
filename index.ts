import { Core } from "./src/app/core"

addEventListener('DOMContentLoaded', () => {
  const canvas = document.querySelector('#app canvas')
  if(!canvas) throw new Error("No canvas found.")
  const app = new Core(canvas as HTMLCanvasElement);
})