import { BrushController } from "./brushes/brushController";
import { InputController } from "./input/inputController";
import { NetworkController } from "./networkController";
import { UIController } from "./ui/uiController";
import { HistoryController } from "./historyController";
import { BufferController } from "./canvasBuffer/BufferController";

type CanvasOptions = {
  width: number;
  height: number;
  zoom: number;
  offsetX: number;
  offsetY: number;
};

export class Core {
  static appRoot: HTMLDivElement;
  static inputController: InputController;
  static historyController: HistoryController;
  static networkController: NetworkController;
  static brushController: BrushController;
  static uiController: UIController;
  static bufferController: BufferController;
  static canvasOptions: CanvasOptions;
  static setup = (
    appRoot: HTMLDivElement,
    socketUrl: string,
    canvasOptions: CanvasOptions
  ) => {
    this.appRoot = appRoot;
    this.canvasOptions = canvasOptions;
    this.bufferController = new BufferController();
    this.brushController = new BrushController();
    this.inputController = new InputController();
    this.uiController = new UIController(".controls");
    this.historyController = new HistoryController();
    this.networkController = new NetworkController(socketUrl);
  };
  static getTransformStyle(movX = 0, movY = 0) {
    return `scale(${Core.canvasOptions.zoom}) 
    translate(${(Core.canvasOptions.offsetX +=
      movX)}px,${(Core.canvasOptions.offsetY += movY)}px)`;
  }
}
