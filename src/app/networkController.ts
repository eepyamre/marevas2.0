import { Color } from "../helpers/color";
import { Vector2 } from "../helpers/vectors";
import { Core } from "./core";

/*
Data format
uning 'A' as divider
<brush>A<posX>A<posY>A<prevPosX>A<prevPosY>A
*/
export type Packet = {
  userId: string;
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

// For future communication with the server
export class NetworkController {
  url: string;
  socket: WebSocket;
  userId: string;
  // set id by selected layer
  userHistory: string;
  constructor(url: string) {
    this.url = url;
    this.createSocket();
  }

  private createSocket = () => {
    this.socket = new WebSocket(this.url);
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
    addEventListener("beforeunload", () => {
      this.socket.close();
    });
  };
  private socketMessage = (event: WsMessageEvent) => {
    const data = event.data;
    const arr = data.split("\n");
    const userId = arr[0];
    if (arr[1] === "history") {
      if (arr[0] === this.userHistory) {
        Core.historyController.pushFromRemoteHistory(
          arr
            .slice(4)
            .filter((_, i) => i % 3 === 0)
            .reverse()
        );
        console.log(
          arr
            .slice(4)
            .filter((_, i) => i % 3 === 0)
            .reverse()
        );
      }
      return;
    }
    if (arr[1] === "init") {
      this.userId = userId;
      Core.bufferController.saveMain();
      return;
    }
    if (arr[0] === this.userId) return;
    if (arr[1] === "start") {
      Core.bufferController.startRemoteDrawing(userId);
      return;
    }
    if (arr[1] === "stop") {
      Core.bufferController.stopRemoteDrawing(userId);
      return;
    }
    if (arr[1] === "image") {
      Core.bufferController.remoteImage(
        userId,
        data.slice(arr[0].length + 1 + arr[1].length + 1)
      );
      return;
    }
    const decoded: Packet = {
      userId: userId,
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
    this.socket.send(this.userId + "\nstart");
  }
  sendStop() {
    if (!this.socket.readyState) return;
    this.socket.send(this.userId + "\nstop");
  }
  sendImage(imageData: string) {
    if (!this.socket.readyState) return;
    this.socket.send(this.userId + "\nimage\n" + imageData);
  }
  // TODO: send an empty data for changing only a remote mouse position
  pushData(packet: Pick<Packet, "brushSettings" | "pos">) {
    if (!this.socket.readyState) return;
    const arr: (number | string)[] = [
      this.userId,
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
    this.userHistory = id;
    this.socket.send(this.userId + "\ngethistory\n" + this.userHistory);
  }
}
