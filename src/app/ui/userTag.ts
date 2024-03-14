import { Vector2 } from "../../helpers/vectors";
import { Core } from "../core";

export class UserTag {
  el: HTMLDivElement;
  pos: Vector2;
  timer: any;
  id: string;
  constructor(id: string, pos: Vector2) {
    this.id = id;
    this.pos = pos;
    this.render();
  }
  updatePos(pos: Vector2) {
    this.pos = pos;
    if (!this.el) {
      this.render();
    }
    this.el.style.left = pos.x + 24 + "px";
    this.el.style.top = pos.y + 24 + "px";
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.remove();
    }, 60000);
  }
  render() {
    this.el = document.createElement("div");
    this.el.classList.add("user");
    this.el.textContent = "Anon";
    this.el.style.left = this.pos.x + 24 + "px";
    this.el.style.top = this.pos.y + 24 + "px";
    const app = document.querySelector("#app");
    app.append(this.el);
    this.timer = setTimeout(() => {
      this.remove();
    }, 60000);
  }
  remove() {
    if (this.el) {
      this.el.remove();
      this.el = undefined;
      Core.uiController.removeUser(this.id);
    }
  }
}
