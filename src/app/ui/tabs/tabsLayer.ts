import eyeIcon from "../../../assets/icons/eye.png";
import deleteIcon from "../../../assets/icons/delete.png";
import { Core } from "../../core";
import { Layer } from "../../layerController";

export class TabsLayer {
  el: HTMLDivElement;
  layer: Layer;
  constructor(
    layer: Layer,
    onClick: () => void,
    onDelete: () => void,
    setDragEl: (el?: TabsLayer) => void
  ) {
    this.el = document.createElement("div");
    this.el.dataset.id = layer.id;
    this.layer = layer;
    const initPos = layer.position;
    const title = document.createElement("span");
    title.classList.add("title");
    const userEl = document.createElement("span");
    userEl.classList.add("user");
    const img = document.createElement("canvas");
    img.width = layer.buffer.canvas.width;
    img.height = layer.buffer.canvas.height;
    img.getContext("2d").drawImage(layer.buffer.canvas, 0, 0);
    this.el.classList.add("tabs__content_list__item", "layer");
    this.el.draggable = true;
    this.el.addEventListener("dragstart", () => {
      if (this.layer.userName !== Core.networkController.username) return;
      setDragEl(this);
      this.el.classList.add("dragactive");
    });
    this.el.addEventListener("dragend", () => {
      setDragEl(undefined);
      if (this.layer.userName !== Core.networkController.username) return;
      this.el.classList.remove("dragactive");
      Core.networkController.updateCanvasPos(layer.id, initPos, layer.position);
      Core.uiController.rerender();
    });
    const textEl = document.createElement("div");
    textEl.classList.add("text");
    title.textContent = layer.title;
    userEl.textContent = layer.userName;
    textEl.append(title, userEl);
    const icon = document.createElement("img");
    icon.src = eyeIcon;
    const delicon = document.createElement("img");
    if (onDelete) {
      delicon.classList.add("delete");
      delicon.src = deleteIcon;
      const fn = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        onDelete();
      };
      delicon.addEventListener("click", fn);
    }
    if (layer.id === Core.layerController.activeLayer.id) {
      this.el.classList.add("active");
      setTimeout(() => {
        this.el.scrollIntoView();
      }, 0);
    }
    this.el.addEventListener("click", onClick);
    this.el.append(icon, img, textEl);
    if (onDelete) {
      this.el.append(delicon);
    }
  }
}
