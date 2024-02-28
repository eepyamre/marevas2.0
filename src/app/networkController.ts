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
    console.log("Connecting error. Reconecting in 5 seconds...");
    setTimeout(() => {
      this.createSocket();
    }, 5000);
  };

  private socketClose = () => {
    console.log("Connection Closed");
  };
  private socketOpen = () => {
    console.log("Connection Established");
  };
  // TODO: DO NOT DRAW ON YOURSELF
  private socketMessage = (event: WsMessageEvent) => {
    const data = event.data;
    const arr = data.split("A");
    if (arr[0] === "init") {
      this.userId = arr[1];
      return;
    }
    if (arr[0] === "start") {
      Core.bufferController.startRemoteDrawing(arr[1]);
      return;
    }
    if (arr[0] === "stop") {
      Core.bufferController.stopRemoteDrawing(arr[1]);
      return;
    }
    if (arr[0] === this.userId) return;
    const decoded: Packet = {
      userId: arr[0],
      brushSettings: {
        type: arr[1],
        size: +arr[2],
        color: new Color(+arr[3]),
      },
      pos: new Vector2(+arr[4], +arr[5]),
      prevPos: new Vector2(+arr[6], +arr[7]),
    };
    Core.bufferController.remoteDraw(decoded);
  };
  sendStart() {
    // startA<id>
    this.socket.send("startA" + this.userId);
  }
  sendStop() {
    // stopA<id>
    this.socket.send("stopA" + this.userId);
  }
  // TODO: send an empty data for changing only a remote mouse position
  pushData(packet: Pick<Packet, "brushSettings" | "pos" | "prevPos">) {
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
