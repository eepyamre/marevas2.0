import { ColorRGBA } from "../helpers/color";
import { Core } from "./core";
import { v4 as uuid } from "uuid";
import { Layer } from "./layerController";

interface HistoryData {
  image: string;
  layer: Layer;
}
type HistoryList = {
  id: string;
  data: HistoryData | null;
  next: HistoryList | null;
  prev: HistoryList | null;
};
export class HistoryController {
  history: HistoryList | null;
  historyStart: HistoryList | null;
  sendTimer: number;
  isFinish = true;
  currentProccessing: string;
  constructor() {
    this.clearHistory();
  }
  clearHistory() {
    this.historyStart = this.history = {
      id: uuid(),
      data: null,
      next: null,
      prev: null,
    };
  }
  pushNewHistory(data: HistoryData) {
    if (this.history) {
      this.history = this.history.next = {
        id: uuid(),
        data: data,
        next: null,
        prev: this.history,
      };
    } else {
      this.clearHistory();
      this.history = this.history!.next = {
        id: uuid(),
        data: data,
        next: null,
        prev: this.history,
      };
    }
  }

  undo() {
    if (this.history && this.history.prev) {
      this.isFinish = false;
      this.history = this.history.prev;
      this.currentProccessing = this.history.id;
      let c = this.history;
      Core.bufferController.clearMain();
      if (this.history.data) {
        Core.layerController.selectLayer(c.data.layer.id);
        Core.bufferController.drawImage(c.data.image);
      }
      clearTimeout(this.sendTimer);
      this.sendTimer = setTimeout(this.sendData, 1000);
    }
  }

  redo() {
    if (this.history && this.history.next && this.history.next.data) {
      this.isFinish = false;
      this.history = this.history.next;
      this.currentProccessing = this.history.id;
      let c = this.history;
      Core.layerController.selectLayer(c.data.layer.id);
      Core.bufferController.clearMain();
      Core.bufferController.drawImage(c.data.image);
      clearTimeout(this.sendTimer);
      this.sendTimer = setTimeout(this.sendData, 1000);
    }
  }

  pushFromRemoteHistory(images: string[]) {
    this.clearHistory();
    for (let i = 0; i < images.length; i++) {
      this.pushNewHistory({
        layer: Core.layerController.activeLayer,
        image: images[i],
      });
    }
  }

  private sendData() {
    Core.networkController.sendImage(
      Core.layerController.activeLayer.id,
      Core.bufferController.mainCanvasEl.toDataURL()
    );
  }
}
