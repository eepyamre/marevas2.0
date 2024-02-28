import { BrushController } from "./brushes/brushController";
import { InputController } from "./input/inputController";
import { NetworkController } from "./networkController";
import { UIController } from "./uiController";
import { HistoryController } from "./historyController";
import { DoubleBufferController } from "./canvasBuffer/doubleBufferController";

export class Core {
  static appRoot: HTMLDivElement;
  static input: InputController;
  static historyController: HistoryController;
  static networkController: NetworkController;
  static brushController: BrushController;
  static uiController: UIController;
  static bufferController: DoubleBufferController;

  static setup = (appRoot: HTMLDivElement) => {
    this.appRoot = appRoot;
    this.bufferController = new DoubleBufferController();
    this.brushController = new BrushController();
    this.input = new InputController();
    this.uiController = new UIController();
    this.historyController = new HistoryController();
    this.networkController = new NetworkController("http://localhost");
  };
}
