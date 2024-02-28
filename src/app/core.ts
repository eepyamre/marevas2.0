import { BrushController } from "./brushes/brushController";
import { InputController } from "./input/inputController";
import { NetworkController } from "./networkController";
import { UIController } from "./uiController";
import { HistoryController } from "./historyController";
import { BufferController } from "./canvasBuffer/BufferController";

export class Core {
  static appRoot: HTMLDivElement;
  static input: InputController;
  static historyController: HistoryController;
  static networkController: NetworkController;
  static brushController: BrushController;
  static uiController: UIController;
  static bufferController: BufferController;

  static setup = (appRoot: HTMLDivElement, socketUrl: string) => {
    this.appRoot = appRoot;
    this.bufferController = new BufferController();
    this.brushController = new BrushController();
    this.input = new InputController();
    this.uiController = new UIController();
    this.historyController = new HistoryController();
    this.networkController = new NetworkController(socketUrl);
  };
}
