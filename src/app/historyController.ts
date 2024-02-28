import { Core } from "./core";

type HistoryData = {
  run: () => void;
};
type HistoryList = {
  data: HistoryData[];
  next: HistoryList | null;
  prev: HistoryList | null;
};
export class HistoryController {
  history: HistoryList | null;
  historyStart: HistoryList | null;
  constructor() {
    this.clearHistory();
  }
  private clearHistory() {
    this.historyStart = this.history = {
      data: [{ run: () => {} }],
      next: null,
      prev: null,
    };
  }
  pushToActiveHistoryItem(data: HistoryData) {
    if (this.history) {
      this.history.data.push(data);
    } else {
      this.historyStart = this.history = {
        data: [data],
        next: null,
        prev: null,
      };
    }
  }

  pushNewHistory() {
    if (this.history) {
      this.history = this.history.next = {
        data: [],
        next: null,
        prev: this.history,
      };
    } else {
      this.clearHistory();
      this.history = this.history!.next = {
        data: [],
        next: null,
        prev: this.history,
      };
    }
  }

  undo() {
    if (this.history && this.history.prev) {
      this.history = this.history.prev;
      let c = this.historyStart;
      Core.bufferController.clearMain();
      while (c && c !== this.history.next) {
        c.data.forEach((item) => item.run());
        c = c.next;
      }
    } else {
      Core.bufferController.clearMain();
    }
    Core.networkController.sendImage(
      Core.bufferController.mainCanvasEl.toDataURL()
    );
  }

  redo() {
    if (this.history && this.history.next) {
      this.history = this.history.next;
      let c = this.historyStart;
      Core.bufferController.clearMain();
      while (c && c !== this.history.next) {
        c.data.forEach((item) => item.run());
        c = c.next;
      }
    }
    Core.networkController.sendImage(
      Core.bufferController.mainCanvasEl.toDataURL()
    );
  }
}
