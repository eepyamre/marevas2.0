import { CanvasBuffer } from "./canvasBuffer/canvasBuffer";
import { Core } from "./core";

export type Layer = {
  id: string;
  title: string;
  userName?: string;
  visibility: boolean;
  buffer: CanvasBuffer;
  opacity: number;
};
export class LayerController {
  activeLayer: Layer;
  layers: Layer[] = [];
  selectLayer(id: string) {
    this.activeLayer = this.layers.find((item) => item.id === id);
    Core.uiController.rerenderTabs();
  }
  addLayer(layer: Layer) {
    this.layers.push(layer);
    if (!this.activeLayer) {
      this.activeLayer = layer;
    }
    layer.buffer.canvas.style.opacity = layer.opacity.toString();
    Core.uiController.rerenderTabs();
  }
  removeLayer() {
    throw new Error("TODO!");
  }
  visibilityChange() {
    throw new Error("TODO!");
  }
  setOpacity(n: number) {
    this.activeLayer.opacity = n;
    this.activeLayer.buffer.canvas.style.opacity =
      this.activeLayer.opacity.toString();
    Core.networkController.setLayerOpacity(this.activeLayer.id, n);
  }
  setOpacityById(id: string, opacity: number) {
    const layer = this.layers.find((item) => item.id === id);
    if (layer) {
      layer.opacity = opacity;
      layer.buffer.canvas.style.opacity = opacity.toString();
    }
  }
}
