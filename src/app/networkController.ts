import { Color } from "../helpers/color";
import { Vector2 } from "../helpers/vectors";
import { Core } from "./core";

export type Packet = {
  layerId: string;
  brushSettings: {
    size: number;
    color: Color;
    type: string;
    pressure: number;
  };
  pos: Vector2;
};
interface WsMessageEvent extends Event {
  data: string;
}

export class NetworkController {
  url: string;
  socket: WebSocket;
  layerId: string;
  constructor(url: string) {
    this.url = url;
    this.createSocket();
  }

  private createSocket = () => {
    this.socket = new WebSocket(this.url);
    console.log("Connecting to the socket...");
    this.socket.addEventListener("error", this.socketError);
    this.socket.addEventListener("close", this.socketClose);
    this.socket.addEventListener("open", this.socketOpen);
    this.socket.addEventListener("message", this.socketMessage);
  };

  private socketError = (event: Event) => {
    console.error(event);
    console.log("Connecting error.");
  };

  private socketClose = () => {
    console.log("Connecting Closed. Reconecting in 5 seconds...");
    Core.uiController.setLoading(true);
    this.socket.removeEventListener("error", this.socketError);
    this.socket.removeEventListener("close", this.socketClose);
    this.socket.removeEventListener("open", this.socketOpen);
    this.socket.removeEventListener("message", this.socketMessage);
    setTimeout(() => {
      this.createSocket();
    }, 5000);
  };
  private socketOpen = () => {
    console.log("Connection Established");
    Core.uiController.setLoading(false);
    addEventListener("beforeunload", () => {
      this.socket.close();
    });
  };
  private socketMessage = (event: WsMessageEvent) => {
    const data = event.data;
    const arr = data.split("\n");
    const layerId = arr[0];
    if (arr[1] === "history") {
      if (arr[0] === this.layerId) {
        Core.historyController.pushFromRemoteHistory(
          arr
            .slice(4)
            .filter((_, i) => i % 3 === 0)
            .reverse()
        );
      }
      return;
    }
    if (arr[1] === "init") {
      this.layerId = layerId;
      Core.bufferController.saveMain();
      return;
    }
    if (arr[0] === this.layerId) return;
    if (arr[1] === "start") {
      Core.bufferController.startRemoteDrawing(layerId);
      return;
    }
    if (arr[1] === "stop") {
      Core.bufferController.stopRemoteDrawing(layerId);
      return;
    }
    if (arr[1] === "image") {
      Core.bufferController.remoteImage(
        layerId,
        data.slice(arr[0].length + 1 + arr[1].length + 1)
      );
      return;
    }
    const decoded: Packet = {
      layerId: layerId,
      brushSettings: {
        type: arr[1],
        size: +arr[2],
        pressure: +arr[3],
        color: new Color(arr[4]),
      },
      pos: new Vector2(+arr[5], +arr[6]),
    };
    Core.bufferController.remoteDraw(decoded);
  };
  sendStart() {
    if (!this.socket.readyState) return;
    this.socket.send(this.layerId + "\nstart");
  }
  sendStop() {
    if (!this.socket.readyState) return;
    this.socket.send(this.layerId + "\nstop");
  }
  sendImage(imageData: string) {
    if (!this.socket.readyState) return;
    this.socket.send(this.layerId + "\nimage\n" + imageData);
  }
  // TODO: send an empty data for changing only a remote mouse position
  pushData(packet: Pick<Packet, "brushSettings" | "pos">) {
    if (!this.socket.readyState) return;
    const arr: (number | string)[] = [
      this.layerId,
      packet.brushSettings.type,
      packet.brushSettings.size,
      packet.brushSettings.pressure,
      packet.brushSettings.color.toHex(),
      packet.pos.x,
      packet.pos.y,
    ];

    this.socket.send(arr.join("\n"));
  }
  getRemoteHistory(id: string) {
    if (!id) {
      throw new Error("No ID provided");
    }
    this.layerId = id;
    this.socket.send(this.layerId + "\ngethistory\n" + this.layerId);
  }
}
