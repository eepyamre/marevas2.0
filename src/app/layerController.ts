import { CanvasBuffer } from "./canvasBuffer/canvasBuffer";
import { Core } from "./core";

export type Layer = {
  id: string;
  title: string;
  userId: string;
  userName?: string;
  visibility: boolean;
  buffer: CanvasBuffer;
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
  }
  removeLayer() {
    throw new Error("TODO!");
  }
  visibilityChange() {
    throw new Error("TODO!");
  }
}
