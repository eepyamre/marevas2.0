import { Color } from "../helpers/color";
import { Vector2 } from "../helpers/vectors";
import { Core } from "./core";
import { v4 as uuid } from "uuid";

export type Packet = {
  layerId: string;
  brushSettings: {
    size: number;
    color: Color;
    type: string;
    pressure: number;
  };
  pos: Vector2;
  user: string;
};
interface WsMessageEvent extends Event {
  data: string;
}

export class NetworkController {
  url: string;
  socket: WebSocket;
  username: string;
  userKey: string;
  constructor(url: string) {
    this.url = url;
    this.createSocket();
  }

  private createSocket = () => {
    // TODO: CLEAR ALL
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
    this.getUsername();
    addEventListener("beforeunload", () => {
      this.socket.close();
    });
  };
  private socketMessage = (event: WsMessageEvent) => {
    const data = event.data;
    const arr = data.split("\n");

    if (arr[0] === "history") {
      if (arr[1] === Core.layerController.activeLayer.id) {
        const actualData = arr.slice(5);
        if (actualData.length) {
          Core.historyController.pushFromRemoteHistory(
            actualData.filter((_, i) => i % 4 === 0).reverse()
          );
        }
      }
      return;
    }
    if (arr[0] === "generateusername") {
      this.username = arr[1];
      localStorage.setItem(
        "user",
        JSON.stringify({
          key: this.userKey,
          name: this.username,
        })
      );
      this.createLayer();
      Core.uiController.setLoading(false);
      return;
    }
    if (arr[0] === "checkusernameerror") {
      this.userKey = this.username = undefined;
      localStorage.removeItem("user");
      this.getUsername();
      return;
    }
    if (arr[0] === "checkusernamesuccess") {
      this.createLayer();
      Core.uiController.setLoading(false);
      return;
    }
    if (arr[0] === "createlayer") {
      Core.bufferController.newLayer(arr[3], arr[2], arr[1], arr[5] || "1");
      if (arr[1] === this.username) {
        Core.layerController.selectLayer(arr[3]);
        Core.bufferController.changeMain(arr[3]);
      }
      if (arr[4] && arr[4] !== "(null)") {
        Core.bufferController.remoteImage(arr[3], arr[4]);
      }
      return;
    }
    if (arr[1] === this.username) return;
    if (arr[0] === "setlayeropacity") {
      const layerId = arr[2];
      const opacity = arr[3];
      Core.layerController.setOpacityById(layerId, +opacity);
      return;
    }
    if (arr[0] === "position") {
      Core.uiController.updateUser(arr[1], new Vector2(+arr[2], +arr[3]));
      return;
    }
    if (arr[0] === "start") {
      Core.bufferController.startRemoteDrawing(arr[2]);
      return;
    }
    if (arr[0] === "stop") {
      Core.bufferController.stopRemoteDrawing(arr[2]);
      return;
    }
    if (arr[0] === "image") {
      Core.bufferController.remoteImage(arr[2], arr[3]);
      return;
    }

    const decoded: Packet = {
      layerId: arr[0],
      user: arr[1],
      brushSettings: {
        type: arr[2],
        size: +arr[3],
        pressure: +arr[4],
        color: new Color(arr[5]),
      },
      pos: new Vector2(+arr[6], +arr[7]),
    };
    Core.uiController.updateUser(decoded.user, decoded.pos);
    Core.bufferController.remoteDraw(decoded);
  };
  sendStart(layerId: string) {
    if (!this.socket.readyState) return;
    this.socket.send("start\n" + this.username + "\n" + layerId);
  }
  sendStop(layerId: string) {
    if (!this.socket.readyState) return;
    this.socket.send("stop\n" + this.username + "\n" + layerId);
  }
  sendImage(layerId: string, imageData: string) {
    if (!this.socket.readyState) return;
    this.socket.send(
      "image\n" + this.username + "\n" + layerId + "\n" + imageData
    );
  }
  pushPosition(pos: Vector2) {
    if (!this.socket.readyState) return;
    const arr: (number | string)[] = ["position", this.username, pos.x, pos.y];

    this.socket.send(arr.join("\n"));
  }
  pushData(packet: Pick<Packet, "brushSettings" | "pos" | "layerId">) {
    if (!this.socket.readyState) return;
    const arr: (number | string)[] = [
      packet.layerId,
      this.username,
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
    this.socket.send("gethistory\n" + id);
  }
  getUsername() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.key || !user.name) {
      this.userKey = uuid();
      this.socket.send("generateusername\n" + this.userKey);
      localStorage.setItem("user", JSON.stringify({ key: this.userKey }));
    } else {
      this.userKey = user.key;
      this.username = user.name;
      this.socket.send("checkusername\n" + user.name + "\n" + user.key);
    }
  }
  createLayer() {
    this.socket.send("createlayer\n" + this.username);
  }
  setLayerOpacity(layerId: string, opacity: number) {
    this.socket.send(
      "setlayeropacity\n" + this.username + "\n" + layerId + "\n" + opacity
    );
  }
}
