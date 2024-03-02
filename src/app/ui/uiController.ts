import { Core } from "../core";
import { ColorPicker } from "./colorPalette";
import { Slider } from "./slider";
import { TabsWrapper } from "./tabs/tabsWrapper";
import BasicBrush from "../../assets/brushes/basic_brush.png";

export class UIController {
  controlsRoot: HTMLDivElement;
  sizeSlider: Slider;
  opacitySlider: Slider;
  stabilizerSlider: Slider;
  colorPalette: ColorPicker;
  tabs: TabsWrapper;
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

    const sidebar: HTMLDivElement = document.querySelector(".sidebar")!;
    this.tabs = new TabsWrapper(sidebar, [
      {
        title: "Brushes",
        items: [
          {
            title: "Basic Brush",
            image: BasicBrush,
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
            image: BasicBrush,
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
}
