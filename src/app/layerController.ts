import { CanvasBuffer } from "./canvasBuffer/canvasBuffer";
import { Core } from "./core";

export type Layer = {
  id: string;
  title: string;
  userName: string;
  visibility: boolean;
  buffer: CanvasBuffer;
  opacity: number;
  position: number;
};
export class LayerController {
  activeLayer: Layer;
  layers: Layer[] = [];
  selectLayer(id: string) {
    this.activeLayer = this.layers.find((item) => item.id === id);
    Core.uiController.rerender();
  }
  addLayer(layer: Layer) {
    this.layers.push(layer);
    if (!this.activeLayer) {
      this.activeLayer = layer;
    }
    layer.buffer.canvas.style.opacity = layer.opacity.toString();
    Core.uiController.rerender();
  }
  removeLayer(layerId: string) {
    const removable = this.layers.find((item) => item.id === layerId);
    if (removable) {
      removable.buffer.remove();
      this.layers = this.layers.filter((item) => item.id !== layerId);
      Core.uiController.rerender();
    }
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
  setLayerOwner(id: string, owner: string) {
    const layer = this.layers.find((item) => item.id === id);
    if (layer) {
      layer.userName = owner;
    }
  }
  removeLayers() {
    this.layers.length = 0;
    this.activeLayer = undefined;
  }
  layersReorder(oldPos: number, newPos: number) {
    const sortedArr = [
      ...Core.layerController.layers.sort((a, b) => a.position - b.position),
    ];
    if (oldPos === newPos) {
      return;
    }
    const item = sortedArr[oldPos];
    sortedArr.splice(oldPos, 1);
    sortedArr.splice(newPos, 0, item);
    sortedArr.forEach((item, idx) => {
      item.position = idx;
    });
  }
}
