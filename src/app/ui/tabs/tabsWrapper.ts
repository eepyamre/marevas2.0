import { mapNumRange } from "../../../helpers/utils";
import { Core } from "../../core";
import { IconButton } from "../iconButton";
import { Slider } from "../slider";
import { TabsBrush } from "./tabsBrush";
import { TabsButton } from "./tabsButton";
import { TabsLayer } from "./tabsLayer";
import newLayer from "../../../assets/icons/newlayer.png";
import { Layer } from "../../layerController";

type ITabsLayer = {
  layer: Layer;
  onClick: () => void;
  onDelete: () => void;
  type: "layer";
};
type ITabsBrush = {
  isActive: boolean;
  title: string;
  image: string;
  onClick: () => void;
  type: "brush";
};
export type TabsItem = ITabsBrush | ITabsLayer;
export class TabsWrapper {
  el: HTMLDivElement;
  layerOpacity: Slider;
  newLayerBtn: IconButton;
  dragElement: TabsLayer;
  constructor(
    root: HTMLDivElement,
    tabs: {
      title: string;
      items: TabsItem[];
    }[],
    activeTab: string
  ) {
    this.el = document.createElement("div");
    this.el.classList.add("tabs");
    const btns = document.createElement("div");
    btns.classList.add("tabs__buttons");
    const lists: HTMLDivElement[] = [];
    tabs.forEach((tab) => {
      const btn = new TabsButton(tab.title);
      btns.append(btn.el);
      const list = document.createElement("div");
      list.classList.add("tabs__content_list", tab.title);
      lists.push(list);
      if (tab.title === activeTab) {
        list.classList.add("active");
        btn.el.classList.add("active");
      }

      if (tab.title === "Layers" && Core.layerController) {
        const btns = document.createElement("div");
        btns.classList.add("btns");
        list.append(btns);
        this.newLayerBtn = new IconButton(btns, newLayer, () => {
          Core.networkController.createLayer();
        });
        this.layerOpacity = new Slider(
          list,
          (val: string) => {
            const n = mapNumRange(+val, 0, 100, 0, 1);
            Core.layerController.setOpacity(n);
          },
          {
            default: Math.round(
              (Core.layerController.activeLayer.opacity || 1) * 100
            ),
            max: 100,
            min: 0,
            postfix: "%",
            title: "Opacity",
          }
        );

        list.addEventListener("dragover", this.layersDragover.bind(this));
      }
      tab.items.forEach((item, i) => {
        if (item.type === "brush") {
          const el = new TabsBrush(
            item.title,
            item.image,
            item.isActive,
            item.onClick
          ).el;
          list.append(el);
        } else if (item.type === "layer") {
          const el = new TabsLayer(
            item.layer,
            item.onClick,
            item.onDelete,
            (el) => {
              this.dragElement = el;
            }
          ).el;
          list.append(el);
        }
      });
    });

    this.el.append(btns, ...lists);
    root.append(this.el);
  }
  layersDragover = (e: DragEvent) => {
    if (!this.dragElement) return;
    let target = e.target as HTMLElement;
    if (!target.classList.contains("layer")) {
      target = target.closest("layer");
    }
    if (target && target !== this.dragElement.el && target.dataset.id) {
      const targetLayer = Core.layerController.layers.find(
        (item) => target.dataset.id === item.id
      );
      if (targetLayer) {
        if (targetLayer.position === Core.layerController.layers.length - 1) {
          target.after(this.dragElement.el);
        } else {
          target.before(this.dragElement.el);
        }

        targetLayer.buffer.canvas.before(this.dragElement.layer.buffer.canvas);
        const oldPos = this.dragElement.layer.position;
        const newPos = targetLayer.position;

        Core.layerController.layersReorder(oldPos, newPos);
      }
    }
  };
}
