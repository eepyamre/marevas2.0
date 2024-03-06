export class IconButton {
  el: HTMLImageElement;
  img: string;
  onClick: () => void;
  active: boolean = false;
  constructor(parent: Element, img: string, onClick: () => void) {
    this.img = img;
    this.onClick = () => {
      this.active = !this.active;
      this.el.classList[this.active ? "add" : "remove"]("active");
      onClick();
    };
    this.el = document.createElement("img");
    this.el.src = this.img;
    this.el.classList.add("icon_button");
    this.el.addEventListener("click", this.onClick);
    parent.append(this.el);
  }

  setActive(b: boolean) {
    this.active = b;
    this.el.classList[this.active ? "add" : "remove"]("active");
  }
  // TODO: tooltip
}
