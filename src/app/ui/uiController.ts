import { Core } from "../core";
import { ColorPicker } from "./colorPalette";
import { Slider } from "./slider";
import { TabsWrapper } from "./tabs/tabsWrapper";
import { IconButton } from "./iconButton";
import basicBrush from "../../assets/brushes/basic_brush.png";
import eraser from "../../assets/brushes/eraser.png";

export class UIController {
  controlsRoot: HTMLDivElement;
  sizeSlider: Slider;
  opacitySlider: Slider;
  stabilizerSlider: Slider;
  colorPalette: ColorPicker;
  tabs: TabsWrapper;
  eraserBtn: IconButton;
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
    this.tabs = new TabsWrapper(sidebar, [
      {
        title: "Brushes",
        items: [
          {
            title: "Basic Brush",
            image: basicBrush,
            type: "brush",
            onClick: () => {},
          },
          // {
          //   title: "Basic Brush",
          //   image: BasicBrush,
          //   type: "brush",
          // },
          // {
          //   title: "Basic Brush",
          //   image: BasicBrush,
          //   type: "brush",
          // },
        ],
      },
      {
        title: "Layers",
        items: [
          {
            title: "Layer 1",
            user: "Test User",
            image: basicBrush,
            type: "layer",
            onClick: () => {},
          },
          // {
          //   title: "Layer 1",
          //   user: "Test User",
          //   image: BasicBrush,
          //   type: "layer",
          // },
        ],
      },
    ]);
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
}
