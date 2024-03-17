import { ColorRGBA } from "../helpers/color";
import { Core } from "./core";
import { v4 as uuid } from "uuid";

interface HistoryData {
  type: "draw" | "image" | "settings";
  run: () => unknown;
}
export interface HistoryDrawingData extends HistoryData {
  mode?: "draw" | "erase";
  color?: ColorRGBA;
  brush?: keyof typeof Core.brushController.brushesTypes;
  size?: number;
}
type HistoryList = {
  id: string;
  data: HistoryData[];
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
  private clearHistory() {
    this.historyStart = this.history = {
      id: uuid(),
      data: [{ type: "draw", run: () => {} }],
      next: null,
      prev: null,
    };
  }
  pushToActiveHistoryItem(data: HistoryData) {
    if (this.history) {
      this.history.data.push(data);
    } else {
      this.historyStart = this.history = {
        id: uuid(),
        data: [data],
        next: null,
        prev: null,
      };
    }
  }

  pushNewHistory() {
    if (this.history) {
      this.history = this.history.next = {
        id: uuid(),
        data: [],
        next: null,
        prev: this.history,
      };
    } else {
      this.clearHistory();
      this.history = this.history!.next = {
        id: uuid(),
        data: [],
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
      while (c && c.prev) {
        if (c.data[0].type === "image") {
          break;
        }
        c = c.prev;
      }
      while (c && c !== this.history.next) {
        if (this.currentProccessing !== this.history.id) {
          return;
        }
        c.data.forEach((item) => item.run());
        c = c.next;
      }
    } else if (!this.isFinish) {
      this.isFinish = true;
      Core.bufferController.clearMain();
      this.sendData();
    }
    clearTimeout(this.sendTimer);
    this.sendTimer = setTimeout(this.sendData, 1000);
  }

  redo() {
    if (this.history && this.history.next) {
      this.isFinish = false;
      this.history = this.history.next;
      this.currentProccessing = this.history.id;
      let c = this.history;
      Core.bufferController.clearMain();
      while (c && c.prev) {
        if (c.data[0].type === "image") {
          break;
        }
        c = c.prev;
      }
      while (c && c !== this.history.next) {
        if (this.currentProccessing !== this.history.id) return;
        c.data.forEach((item) => item.run());
        c = c.next;
      }
    } else if (!this.isFinish) {
      this.isFinish = true;
      this.sendData();
    }
    clearTimeout(this.sendTimer);
    this.sendTimer = setTimeout(this.sendData, 1000);
  }

  pushFromRemoteHistory(images: string[]) {
    this.clearHistory();
    for (let i = 0; i < images.length; i++) {
      this.pushNewHistory();
      this.pushToActiveHistoryItem({
        type: "image",
        run: () => {
          Core.bufferController.remoteHistoryImage(images[i]);
        },
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
