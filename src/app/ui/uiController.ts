import { Core } from "../core";
import { ColorPicker } from "./colorPalette";
import { Slider } from "./slider";
import { TabsWrapper } from "./tabs/tabsWrapper";
import { IconButton } from "./iconButton";
import { Modal } from "./modal";
import basicBrush from "../../assets/brushes/basic_brush.png";
import eraser from "../../assets/brushes/eraser.png";
import softBrush from "../../assets/brushes/soft_brush.png";
import inkBrush from "../../assets/brushes/ink_brush.png";

export class UIController {
  controlsRoot: HTMLDivElement;
  sizeSlider: Slider;
  opacitySlider: Slider;
  stabilizerSlider: Slider;
  colorPalette: ColorPicker;
  tabs: TabsWrapper;
  eraserBtn: IconButton;
  activeTab: string = "Brushes";
  loadingModal: Modal;
  infoModal: Modal;
  constructor() {
    this.controlsRoot = document.querySelector(".controls")!;
    if (!this.controlsRoot) {
      throw new Error("Cant find control items!");
    }
    this.colorPalette = new ColorPicker((color) => {
      Core.brushController.setBrushColor(color);
    });
    this.sizeSlider = new Slider(
      this.controlsRoot,
      (val) => {
        Core.brushController.setBrushSize(+val);
      },
      {
        default: 16,
        max: 100,
        min: 1,
        postfix: "px",
        title: "Size",
      }
    );
    this.opacitySlider = new Slider(
      this.controlsRoot,
      (val) => {
        Core.brushController.setBrushOpacity(+val);
      },
      {
        default: 0,
        max: 100,
        min: 0,
        postfix: "%",
        title: "Opacity",
      }
    );
    this.stabilizerSlider = new Slider(
      this.controlsRoot,
      (val: string) => {
        Core.inputController.setStabilizationLevel(+val);
      },
      {
        default: 10,
        max: 100,
        min: 0,
        postfix: "%",
        title: "Stabilizer",
      }
    );

    const iconButtons = document.querySelector(".icon_buttons");
    this.eraserBtn = new IconButton(iconButtons, eraser, () => {
      Core.brushController.setMode(
        Core.brushController.mode === "draw" ? "erase" : "draw"
      );
    });
    const sidebar: HTMLDivElement = document.querySelector(".sidebar")!;
    this.tabs = new TabsWrapper(
      sidebar,
      [
        {
          title: "Brushes",
          items: [],
        },
        {
          title: "Layers",
          items: [],
        },
      ],
      this.activeTab
    );
    this.loadingModal = new Modal("Connecting, please wait...");
    this.setLoading(true);
    this.infoModal = new Modal(
      "Info",
      "Mares mares mares mares amres mares marse mares maresmares mares mares mares mares amres mares marse mares mares mares mares!!! ",
      [
        {
          text: "Ok",
          onClick: () => {
            this.infoModal.remove();
          },
        },
      ]
    );

    const infoBtn = document.querySelector(".header");
    if (infoBtn) {
      infoBtn.addEventListener("click", () => {
        this.infoModal.render();
      });
    }
  }

  changeSize(size: number) {
    this.sizeSlider.setValue(size);
  }
  changeOpacity(opacity: number) {
    this.opacitySlider.setValue(opacity);
  }
  setEraser(b: boolean) {
    this.eraserBtn.setActive(b);
  }
  rerenderTabs() {
    this.tabs.el.remove();
    const sidebar: HTMLDivElement = document.querySelector(".sidebar")!;
    const layers = Core.layerController.layers;
    this.tabs = new TabsWrapper(
      sidebar,
      [
        {
          title: "Brushes",
          items: [
            {
              isActive: Core.brushController.brush.type === "BasicBrush",
              title: "Basic Brush",
              image: basicBrush,
              type: "brush",
              onClick: () => {
                Core.brushController.selectBrush("BasicBrush");
              },
            },
            {
              isActive: Core.brushController.brush.type === "SoftBrush",
              title: "Soft Brush",
              image: softBrush,
              type: "brush",
              onClick: () => {
                Core.brushController.selectBrush("SoftBrush");
              },
            },
            {
              isActive: Core.brushController.brush.type === "InkBrush",
              title: "Ink Brush",
              image: inkBrush,
              type: "brush",
              onClick: () => {
                Core.brushController.selectBrush("InkBrush");
              },
            },
          ],
        },
        {
          title: "Layers",
          items: layers.map((item) => ({
            type: "layer",
            isActive: item.id === Core.layerController.activeLayer?.id,
            image: basicBrush,
            title: item.title,
            user: item.userName || item.id,
            onClick: () => {
              Core.layerController.selectLayer(item.id);
              Core.networkController.getRemoteHistory(item.id);
              Core.bufferController.changeMain(item.id);
            },
          })),
        },
      ],
      this.activeTab
    );
  }
  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
  setLoading(b: boolean) {
    if (b) this.loadingModal.render();
    else this.loadingModal.remove();
  }
}
