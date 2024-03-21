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
import { ImageBrush } from "../brushes/imageBrush";

const infoModalHTML = `
<p>Hotkeys:</p>
<div>
  <div class="key">e</div>
  - eraser
</div>
<div>
  <div class="key">[</div>
  or
  <div class="key">+</div>
  - reduce brush size
</div>
<div>
  <div class="key">]</div>
  or
  <div class="key">-</div>
  - increse brush size
</div>
<div>
  <div class="key">mousewheel</div>
  - control zoom
</div>
<div>
  <div class="key">ctrl</div>
  +
  <div class="key">s</div>
  - export as png
</div>
<div>
  <div class="key">ctrl</div>
  +
  <div class="key">z</div>
  - undo
</div>
<div>
  <div class="key">ctrl</div>
  +
  <div class="key">shift</div>
  +
  <div class="key">z</div>
  - redo
</div>
<div>
  <div class="key">ctrl</div>
  +
  <div class="key">+</div>
  - zoom in
</div>
<div>
  <div class="key">ctrl</div>
  +
  <div class="key">-</div>
  - zoom out
</div>
<div>
  <div class="key">ctrl</div>
  +
  <div class="key">mousewheel</div>
  - control brush size
</div>
<p>last upd 19.03.24</p>
`;

const loginModalHTML = `
<label>
  <input class="log" placeholder="name"/>
</label>
<label>
  <input class="pass" type="password" placeholder="password"/>
</label>
`;

export class UIController {
  controlsRoot: HTMLDivElement;
  sizeSlider: Slider;
  opacitySlider: Slider;
  stabilizerSlider: Slider;
  spacingSlider: Slider;
  colorPalette: ColorPicker;
  tabs: TabsWrapper;
  eraserBtn: IconButton;
  activeTab: string = "Brushes";
  loadingModal: Modal;
  infoModal: Modal;
  loginModal: Modal;
  loginErrorModal: Modal;
  loginBtn: HTMLElement;
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
    this.spacingSlider = new Slider(
      this.controlsRoot,
      (val: string) => {
        Core.brushController.setSpacing(+val);
      },
      {
        default: 5,
        max: 100,
        min: 1,
        postfix: "px",
        title: "Spacing",
      }
    );

    const iconButtons = document.querySelector(".icon_buttons");
    this.eraserBtn = new IconButton(
      iconButtons,
      eraser,
      () => {
        Core.brushController.setMode(
          Core.brushController.mode === "draw" ? "erase" : "draw"
        );
      },
      true
    );
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
      { closable: false }
    );
    this.setLoading(true);
    this.infoModal = new Modal(
      "Info",
      infoModalHTML,
      [
        {
          text: "Ok",
          onClick: () => {
            this.infoModal.remove();
          },
        },
      ],
      {
        class: "info",
      }
    );

    this.loginModal = new Modal(
      "Login",
      loginModalHTML,
      [
        {
          text: "Cancel",
          onClick: () => {
            this.loginModal.remove();
          },
        },
        {
          text: "Login",
          onClick: (e) => {
            const login: HTMLInputElement = document.querySelector(
              ".modal.login input.log"
            );
            const pass: HTMLInputElement = document.querySelector(
              ".modal.login input.pass"
            );
            if (login.value && pass.value) {
              Core.networkController.login(login.value, pass.value);
            }
          },
        },
      ],
      {
        class: "login",
      }
    );
    this.loginErrorModal = new Modal(
      "Error",
      `<p>login or password is incorrect</p>`,
      [
        {
          text: "Ok",
          onClick: () => {
            this.loginErrorModal.remove();
          },
        },
      ]
    );
    const infoBtn = document.querySelector(".header");
    this.loginBtn = document.querySelector("#ui .top .login_btn");
    if (infoBtn) {
      infoBtn.addEventListener("click", () => {
        this.infoModal.render();
      });
    }
    if (this.loginBtn) {
      this.loginBtn.addEventListener("click", () => {
        this.loginModal.render();
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
  rerender() {
    this.loginBtn.textContent = Core.networkController.username;
    this.tabs.el.remove();
    const sidebar: HTMLDivElement = document.querySelector(".sidebar")!;
    if (Core.brushController.brush instanceof ImageBrush) {
      this.spacingSlider.show();
    } else {
      this.spacingSlider.hide();
    }
    const layers = Core.layerController.layers.sort(
      (a, b) => a.position - b.position
    );
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
                Core.brushController.selectBrush("BasicBrush", true);
              },
            },
            {
              isActive: Core.brushController.brush.type === "SlicedBrush",
              title: "Sliced Brush",
              image: slicedBrush,
              type: "brush",
              onClick: () => {
                Core.brushController.selectBrush("SlicedBrush", true);
              },
            },
            {
              isActive: Core.brushController.brush.type === "SoftBrush",
              title: "Soft Brush",
              image: softBrush,
              type: "brush",
              onClick: () => {
                this.spacingSlider.setValue(1);
                Core.brushController.selectBrush("SoftBrush", true);
              },
            },
            {
              isActive: Core.brushController.brush.type === "GrainyBrush",
              title: "Grainy Brush",
              image: grainyBrush,
              type: "brush",
              onClick: () => {
                this.spacingSlider.setValue(5);
                Core.brushController.selectBrush("GrainyBrush", true);
              },
            },
            {
              isActive: Core.brushController.brush.type === "SprayBrush",
              title: "Spray",
              image: sprayBrush,
              type: "brush",
              onClick: () => {
                Core.brushController.selectBrush("SprayBrush", true);
              },
            },
          ],
        },
        {
          title: "Layers",
          items: layers.map((item) => ({
            type: "layer",
            layer: item,
            onClick: () => {
              if (item.userName === Core.networkController.username) {
                Core.layerController.selectLayer(item.id);
                Core.networkController.getRemoteHistory(item.id);
                Core.bufferController.changeMain(item.id);
              }
            },
            onDelete:
              item.userName === Core.networkController.username
                ? () => {
                    Core.networkController.deleteLayer(item.id);
                  }
                : undefined,
          })),
        },
      ],
      this.activeTab
    );
    Core.bufferController.rerenderCanvases();
  }
  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
  setLoading(b: boolean) {
    if (b) this.loadingModal.render();
    else this.loadingModal.remove();
  }
  appendUser(username: string, pos: Vector2 = new Vector2(0, 0)) {
    this.userTags[username] = new UserTag(username, pos);
  }
  updateUser(username: string, pos: Vector2) {
    const user = this.userTags[username];
    if (user) {
      user.updatePos(pos);
      return;
    }
    this.appendUser(username, pos);
  }
  removeUser(id: string) {
    this.userTags[id].remove();
    delete this.userTags[id];
  }
}
