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
  };
  pos: Vector2;
  prevPos: Vector2;
};
interface WsMessageEvent extends Event {
  data: string;
}

// For future communication with the server
export class NetworkController {
  url: string;
  socket: WebSocket;
  userId: string;
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
    const arr = data.split("A");
    const userId = arr[0];
    if (arr[1] === "init") {
      this.userId = userId;
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
    }
    const decoded: Packet = {
      userId: userId,
      brushSettings: {
        type: arr[1],
        size: +arr[2],
        color: new Color(arr[3]),
      },
      pos: new Vector2(+arr[4], +arr[5]),
      prevPos: new Vector2(+arr[6], +arr[7]),
    };
    Core.bufferController.remoteDraw(decoded);
  };
  sendStart() {
    if (!this.socket.readyState) return;
    this.socket.send(this.userId + "Astart");
  }
  sendStop() {
    if (!this.socket.readyState) return;
    this.socket.send(this.userId + "Astop");
  }
  sendImage(imageData: string) {
    if (!this.socket.readyState) return;
    this.socket.send(this.userId + "AimageA" + imageData);
  }
  // TODO: send an empty data for changing only a remote mouse position
  pushData(packet: Pick<Packet, "brushSettings" | "pos" | "prevPos">) {
    if (!this.socket.readyState) return;
    const arr: (number | string)[] = [
      this.userId,
      packet.brushSettings.type,
      packet.brushSettings.size,
      packet.brushSettings.color.toHex(),
      packet.pos.x,
      packet.pos.y,
      packet.prevPos.x,
      packet.prevPos.y,
    ];

    this.socket.send(arr.join("A"));
  }
}
