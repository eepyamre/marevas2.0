import * as md5 from "md5";
import { Color } from "../helpers/color";
import { Vector2 } from "../helpers/vectors";
import { Core } from "./core";
import { v4 as uuid } from "uuid";

const ACTION_TYPES = {
  GET_HISTORY: "1",
  CREATE_LAYER: "2",
  SET_LAYER_OPACITY: "3",
  DELETE_LAYER: "4",
  SET_LAYER_OWNER: "5",
  GENERATE_USER_NAME: "6",
  LOGIN: "7",
  CHECK_USERNAME: "8",
  SAVE_IMAGE: "9",
  HISTORY: "10",
  LAYER_OWNER_CHAGNGE: "11",
  LOGIN_SUCCESS: "12",
  LOGIN_ERROR: "13",
  CHECK_USERNAME_ERROR: "14",
  CHECK_USERNAME_SUCCESS: "15",
  POSITION: "16",
  START: "17",
  STOP: "18",
  IMAGE: "19",
  UPDATE_CANVAS_POS: "20",
  ABADON_LAYER: "21",
  OWN_LAYER: "22",
} as const;

export type Packet = {
  layerId: string;
  brushSettings: {
    size: number;
    color: Color;
    type: string;
    pressure: number;
    spacing: number;
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
  timer: any;
  constructor(url: string) {
    this.url = url;
    this.createSocket();
  }

  private keepAlive = () => {
    clearTimeout(this.timer);
    this.socket.send("ping");
    this.timer = setTimeout(this.keepAlive, 30000);
  };

  private clearAll = () => {
    Core.historyController.clearHistory();
    try {
      Core.uiController.rerender();
    } catch (e) {}
    Core.layerController.removeLayers();
  };

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
    this.clearAll();
    this.getUsername();
    this.keepAlive();
    addEventListener("beforeunload", () => {
      this.socket.onclose = undefined;
      this.socket.close();
    });
  };
  private socketMessage = (event: WsMessageEvent) => {
    const data = event.data;
    const arr = data.split("\n");
    if (arr[0] === "ping") {
      return;
    }
    if (arr[0] === ACTION_TYPES.ABADON_LAYER) {
      Core.layerController.setLayerOwner(arr[2], null);
      Core.uiController.rerender();
      return;
    }
    if (arr[0] === ACTION_TYPES.OWN_LAYER) {
      Core.layerController.setLayerOwner(arr[2], arr[1]);
      Core.uiController.rerender();
      return;
    }
    if (arr[0] === ACTION_TYPES.LAYER_OWNER_CHAGNGE) {
      Core.layerController.setLayerOwner(arr[2], arr[1]);
      Core.uiController.rerender();
      return;
    }
    if (arr[0] === ACTION_TYPES.LOGIN_SUCCESS) {
      this.username = arr[1];
      this.userKey = arr[2];
      localStorage.setItem(
        "user",
        JSON.stringify({ key: this.userKey, name: this.username })
      );
      Core.uiController.rerender();
      Core.uiController.loginModal.remove();
      return;
    }
    if (arr[0] === ACTION_TYPES.LOGIN_ERROR) {
      Core.uiController.loginErrorModal.render();
      return;
    }
    if (arr[0] === ACTION_TYPES.HISTORY) {
      if (arr[1] === Core.layerController.activeLayer.id) {
        const historyData = data.split("\n").slice(2).reverse();
        Core.historyController.pushFromRemoteHistory(historyData);
      }
      return;
    }
    if (arr[0] === ACTION_TYPES.GENERATE_USER_NAME) {
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
    if (arr[0] === ACTION_TYPES.CHECK_USERNAME_ERROR) {
      this.userKey = this.username = undefined;
      localStorage.removeItem("user");
      this.getUsername();
      return;
    }
    if (arr[0] === ACTION_TYPES.CHECK_USERNAME_SUCCESS) {
      const userLayer = Core.layerController.layers.find(
        (item) => item.userName === this.username
      );
      if (!userLayer) {
        this.createLayer();
      } else {
        Core.layerController.selectLayer(userLayer.id);
        this.getRemoteHistory(userLayer.id);
      }
      Core.uiController.setLoading(false);
      return;
    }
    if (arr[0] === ACTION_TYPES.CREATE_LAYER) {
      Core.bufferController.newLayer(
        arr[3],
        arr[2],
        arr[1] === "(null)" ? null : arr[1],
        arr[5] || "1"
      );
      if (arr[1] === this.username) {
        Core.layerController.selectLayer(arr[3]);
        Core.bufferController.changeMain(arr[3]);
      }
      if (arr[4] && arr[4] !== "(null)") {
        Core.bufferController.remoteImage(arr[3], arr[4]);
      }
      return;
    }
    if (arr[0] === ACTION_TYPES.DELETE_LAYER) {
      Core.layerController.removeLayer(arr[2]);
      return;
    }
    if (arr[1] === this.username) return;
    if (arr[0] === ACTION_TYPES.SET_LAYER_OPACITY) {
      const layerId = arr[2];
      const opacity = arr[3];
      Core.layerController.setOpacityById(layerId, +opacity);
      return;
    }
    if (arr[0] === ACTION_TYPES.POSITION) {
      Core.uiController.updateUser(arr[1], new Vector2(+arr[2], +arr[3]));
      return;
    }
    if (arr[0] === ACTION_TYPES.START) {
      Core.bufferController.startRemoteDrawing(arr[2]);
      return;
    }
    if (arr[0] === ACTION_TYPES.STOP) {
      Core.bufferController.stopRemoteDrawing(arr[2]);
      return;
    }
    if (arr[0] === ACTION_TYPES.IMAGE) {
      Core.bufferController.remoteImage(arr[2], arr[3]);
      return;
    }
    if (arr[0] === ACTION_TYPES.UPDATE_CANVAS_POS) {
      Core.layerController.layersReorder(+arr[2], +arr[3]);
      Core.uiController.rerender();
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
        spacing: +arr[6],
      },
      pos: new Vector2(+arr[7], +arr[8]),
    };
    Core.uiController.updateUser(decoded.user, decoded.pos);
    Core.bufferController.remoteDraw(decoded);
  };
  sendStart(layerId: string) {
    if (!this.socket.readyState) return;
    this.socket.send(
      ACTION_TYPES.START + "\n" + this.username + "\n" + layerId
    );
  }
  sendStop(layerId: string) {
    if (!this.socket.readyState) return;
    this.socket.send(ACTION_TYPES.STOP + "\n" + this.username + "\n" + layerId);
  }
  saveImage(layerId: string, imageData: string) {
    if (!this.socket.readyState) return;
    this.socket.send(
      ACTION_TYPES.SAVE_IMAGE +
        "\n" +
        this.username +
        "\n" +
        layerId +
        "\n" +
        imageData
    );
  }
  sendImage(layerId: string, imageData: string) {
    if (!this.socket.readyState) return;
    this.socket.send(
      ACTION_TYPES.IMAGE +
        "\n" +
        this.username +
        "\n" +
        layerId +
        "\n" +
        imageData
    );
  }
  pushPosition(pos: Vector2) {
    if (!this.socket.readyState) return;
    const arr: (number | string)[] = [
      ACTION_TYPES.POSITION,
      this.username,
      pos.x,
      pos.y,
    ];

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
      packet.brushSettings.spacing,
      packet.pos.x,
      packet.pos.y,
    ];
    this.socket.send(arr.join("\n"));
  }
  getRemoteHistory(id: string) {
    if (!id) {
      throw new Error("No ID provided");
    }
    this.socket.send(ACTION_TYPES.GET_HISTORY + "\n" + id);
  }
  getUsername() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.key || !user.name) {
      this.userKey = uuid();
      this.socket.send(ACTION_TYPES.GENERATE_USER_NAME + "\n" + this.userKey);
      localStorage.setItem("user", JSON.stringify({ key: this.userKey }));
    } else {
      this.userKey = user.key;
      this.username = user.name;
      this.socket.send(
        ACTION_TYPES.CHECK_USERNAME + "\n" + user.name + "\n" + user.key
      );
    }
  }
  createLayer() {
    this.socket.send(ACTION_TYPES.CREATE_LAYER + "\n" + this.username);
  }
  setLayerOpacity(layerId: string, opacity: number) {
    this.socket.send(
      ACTION_TYPES.SET_LAYER_OPACITY +
        "\n" +
        this.username +
        "\n" +
        layerId +
        "\n" +
        opacity
    );
  }
  deleteLayer(layerId: string) {
    this.socket.send(
      ACTION_TYPES.DELETE_LAYER + "\n" + this.username + "\n" + layerId
    );
  }
  login(name: string, pass: string) {
    this.socket.send(
      ACTION_TYPES.LOGIN +
        "\n" +
        name +
        "\n" +
        md5(pass) +
        "\n" +
        uuid() +
        "\n" +
        this.username
    );
  }
  updateCanvasPos(layerId: string, oldPos: number, newPos: number) {
    this.socket.send(
      ACTION_TYPES.UPDATE_CANVAS_POS +
        "\n" +
        this.username +
        "\n" +
        layerId +
        "\n" +
        oldPos +
        "\n" +
        newPos
    );
  }
  abadonLayer(layerId: string) {
    this.socket.send(
      ACTION_TYPES.ABADON_LAYER + "\n" + this.username + "\n" + layerId
    );
  }
  ownLayer(layerId: string) {
    this.socket.send(
      ACTION_TYPES.OWN_LAYER + "\n" + this.username + "\n" + layerId
    );
  }
}
