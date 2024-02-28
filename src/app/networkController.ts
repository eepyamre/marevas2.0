import { Vector2 } from "../helpers/vectors";
import { Core } from "./core";

interface WsMessageEvent extends Event {
  data: string;
}

// For future communication with the server
export class NetworkController {
  url: string;
  socket: WebSocket;
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
  private socketMessage = (event: WsMessageEvent) => {
    const data = event.data;
    const [rgb, alpha, posX, posY] = data
      .split("A")
      .map((item) => item.split(",").map((item) => parseInt(item)));
    const brushSize = Core.brushController.brush.size;
    const decoded = this.decode(rgb, alpha, brushSize * brushSize * 4);
    Core.bufferController.pushRemote(decoded, new Vector2(posX[0], posY[0]));
  };
  // TODO: send an empty data for changing only a remote mouse position
  pushData(data: Uint8ClampedArray, pos: Vector2, brushSize: number) {
    const encoded = this.encode(Array.from(data));
    this.socket.send(encoded.join("A") + `A${pos.x}A${pos.y}`);
  }

  encode(arr: number[]) {
    const rgb: number[] = [];
    const alpha: number[] = [];
    for (let i = 0, j = 0; i < arr.length; i++, j++) {
      if (j === 3) {
        alpha.push(arr[i]);
        j = -1;
        continue;
      }
      rgb.push(arr[i]);
    }
    const rgbRled = this.rle(rgb);
    const alphaRled = this.rle(alpha);
    return [rgbRled, alphaRled];
  }

  decode(rgbEncoded: number[], aplhaEncoded: number[], size: number) {
    const rgb = this.rleDecode(rgbEncoded);
    const alpha = this.rleDecode(aplhaEncoded);

    const res: number[] = [];
    for (let i = 0, j = 0, c = 0, a = 0; i < size; i++, j++) {
      if (j === 3) {
        res.push(alpha[a]);
        a++;
        j = -1;
        continue;
      }
      res.push(rgb[c]);
      c++;
    }

    return res;
  }

  rle(arr: number[]) {
    let prev = arr[0];
    let count = 1;
    const res: number[] = [];
    for (let i = 1; i <= arr.length; i++) {
      if (prev === arr[i]) {
        count++;
      } else {
        res.push(count, prev);
        prev = arr[i];
        count = 1;
      }
    }
    return res;
  }

  rleDecode(arr: number[]) {
    const res: number[] = [];

    for (let i = 0; i <= arr.length; i += 2) {
      for (let j = 0; j < arr[i]; j++) {
        res.push(arr[i + 1]);
      }
    }
    return res;
  }
}
