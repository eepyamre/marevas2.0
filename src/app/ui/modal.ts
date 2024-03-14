type ModalButton = {
  text: string;
  onClick: () => void;
};
export class Modal {
  backdrop: HTMLDivElement;
  el: HTMLDivElement;
  title: string;
  text: string;
  buttons: ModalButton[];

  constructor(title: string, text?: string, buttons?: ModalButton[]) {
    this.title = title;
    this.text = text;
    this.buttons = buttons;
  }
  render() {
    if (this.el === undefined) {
      this.backdrop = document.createElement("div");
      this.backdrop.classList.add("modalBg");
      this.el = document.createElement("div");
      this.el.classList.add("modal");
      const title = document.createElement("h4");
      title.textContent = this.title;
      this.el.append(title);
      if (this.text) {
        const text = document.createElement("p");
        text.textContent = this.text;
        this.el.append(text);
      }
      if (this.buttons && this.buttons.length) {
        const wrapper = document.createElement("div");
        wrapper.classList.add("btns");
        for (const btn of this.buttons) {
          const btnEl = document.createElement("button");
          btnEl.textContent = btn.text;
          btnEl.addEventListener("click", btn.onClick);
          wrapper.append(btnEl);
        }
        this.el.append(wrapper);
      }
      this.backdrop.addEventListener("click", this.remove.bind(this));
      document.body.append(this.el);
      document.body.append(this.backdrop);
    }
  }
  remove() {
    this.el.remove();
    this.backdrop.remove();
    this.el = undefined;
    this.backdrop = undefined;
  }
}
