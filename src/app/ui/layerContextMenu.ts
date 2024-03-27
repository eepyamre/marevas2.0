import { Vector2 } from "../../helpers/vectors";
import { Core } from "../core";

export class LayerContextMenu {
  el: HTMLElement;
  layerId: string;
  isOpen: 0 | 1 = 0;
  constructor() {
    this.el = document.createElement("div");
    this.el.classList.add("context_menu", "hidden");
    const delBtn = document.createElement("div");
    delBtn.classList.add("context_menu__item");
    delBtn.textContent = "Delete layer";
    const abadonBtn = document.createElement("div");
    abadonBtn.classList.add("context_menu__item");
    abadonBtn.textContent = "Abadon layer";
    this.el.append(delBtn, abadonBtn);
    delBtn.addEventListener("click", this.onDelete.bind(this));
    abadonBtn.addEventListener("click", this.onAbadon.bind(this));
  }
  onDelete() {
    if (!this.layerId) return;
    Core.networkController.deleteLayer(this.layerId);
  }
  onAbadon() {
    if (!this.layerId) return;
    Core.networkController.abadonLayer(this.layerId);
  }
  open(layerId: string, pos: Vector2) {
    this.el.style.top = pos.y + "px";
    this.el.style.left = pos.x + "px";
    this.layerId = layerId;
    this.el.classList.remove("hidden");
    this.isOpen = 1;
  }
  close() {
    this.el.classList.add("hidden");
    this.isOpen = 0;
  }
}
