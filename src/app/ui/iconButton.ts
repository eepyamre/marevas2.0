export class IconButton {
  el: HTMLImageElement;
  img: string;
  onClick: () => void;
  active: boolean = false;
  saveActiveState: boolean;
  constructor(
    parent: Element,
    img: string,
    onClick: () => void,
    saveActiveState?: boolean
  ) {
    this.img = img;
    this.saveActiveState = saveActiveState;
    this.onClick = () => {
      if (saveActiveState) {
        this.setActive(!this.active);
      }
      onClick();
    };
    this.el = document.createElement("img");
    this.el.src = this.img;
    this.el.classList.add("icon_button");
    this.el.addEventListener("click", this.onClick);
    parent.append(this.el);
  }

  setActive(b: boolean) {
    if (this.saveActiveState) {
      this.active = b;
      this.el.classList[this.active ? "add" : "remove"]("active");
    }
  }
  // TODO: tooltip
}
