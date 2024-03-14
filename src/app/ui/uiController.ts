import { Core } from "../core";
import { ColorPicker } from "./colorPalette";
import { Slider } from "./slider";
import { TabsWrapper } from "./tabs/tabsWrapper";
import { IconButton } from "./iconButton";
import { Modal } from "./modal";
import { UserTag } from "./userTag";
import basicBrush from "../../assets/brushes/basic_brush.png";
import eraser from "../../assets/brushes/eraser.png";
import softBrush from "../../assets/brushes/soft_brush.png";
import grainyBrush from "../../assets/brushes/grainy_brush.png";
import slicedBrush from "../../assets/brushes/sliced_brush.png";
import sprayBrush from "../../assets/brushes/spay_brush.png";
import { Vector2 } from "../../helpers/vectors";

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
  userTags: {
    [key: string]: UserTag;
  } = {};
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
        min: 5,
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
    this.loadingModal = new Modal(
      "Connecting, please wait...",
      undefined,
      undefined,
      false
    );
    this.setLoading(true);
    this.infoModal = new Modal(
      "Info",
      `
      <p>Hotkeys:</p>
      <p>
      <div class='key'>e</div> - eraser </p>
      <p>
      <div class='key'>[</div> or <div class='key'>+</div> - reduce brush size </p>
      <p>
      <div class='key'>]</div> or <div class='key'>-</div> - increse brush size </p>
      <p>
      <div class='key'>mousewheel</div> - control zoom </p>
      <p>
      <div class='key'>ctrl</div> + <div class='key'>s</div> - export as png </p>
      <p>
      <div class='key'>ctrl</div> + <div class='key'>z</div> - undo </p>
      <p>
      <div class='key'>ctrl</div> + <div class='key'>shift</div> + <div class='key'>z</div> - redo </p>
      <p>
      <div class='key'>ctrl</div> + <div class='key'>+</div> - zoom in </p>
      <p>
      <p>
      <div class='key'>ctrl</div> + <div class='key'>-</div> - zoom out </p>
      <p>
      <div class='key'>ctrl</div> + <div class='key'>mousewheel</div> - control brush size </p>
      <p>alpha 0.0001 version.</p>
      `,
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
              isActive: Core.brushController.brush.type === "SlicedBrush",
              title: "Sliced Brush",
              image: slicedBrush,
              type: "brush",
              onClick: () => {
                Core.brushController.selectBrush("SlicedBrush");
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
              isActive: Core.brushController.brush.type === "GrainyBrush",
              title: "Grainy Brush",
              image: grainyBrush,
              type: "brush",
              onClick: () => {
                Core.brushController.selectBrush("GrainyBrush");
              },
            },
            {
              isActive: Core.brushController.brush.type === "SprayBrush",
              title: "Spray",
              image: sprayBrush,
              type: "brush",
              onClick: () => {
                Core.brushController.selectBrush("SprayBrush");
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
  appendUser(id: string, pos: Vector2 = new Vector2(0, 0)) {
    this.userTags[id] = new UserTag(id, pos);
  }
  updateUser(id: string, pos: Vector2) {
    const user = this.userTags[id];
    if (user) {
      user.updatePos(pos);
      return;
    }
    this.appendUser(id, pos);
  }
  removeUser(id: string) {
    this.userTags[id].remove();
    delete this.userTags[id];
  }
}
