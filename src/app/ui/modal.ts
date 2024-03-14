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
  closable: boolean;

  constructor(
    title: string,
    text?: string,
    buttons?: ModalButton[],
    closable: boolean = true
  ) {
    this.title = title;
    this.text = text;
    this.buttons = buttons;
    this.closable = closable;
  }
  render() {
    if (this.el === undefined) {
      this.backdrop = document.createElement("div");
      this.backdrop.classList.add("modalBg");
      this.el = document.createElement("div");
      this.el.classList.add("modal");
      const title = document.createElement("h4");
      title.classList.add("title");
      title.textContent = this.title;
      this.el.append(title);
      if (this.text) {
        const text = document.createElement("p");
        text.innerHTML = this.text;
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
      if (this.closable) {
        this.backdrop.addEventListener("click", this.remove.bind(this));
      }
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
