type ModalButton = {
  text: string;
  onClick: (e: MouseEvent) => void;
};
export class Modal {
  backdrop: HTMLDivElement;
  el: HTMLDivElement;
  title: string;
  html: string;
  buttons: ModalButton[];
  closable: boolean;
  class: string;

  constructor(
    title: string,
    html?: string,
    buttons?: ModalButton[],
    options: {
      closable?: boolean;
      class?: string;
    } = {
      closable: true,
    }
  ) {
    this.title = title;
    this.html = html;
    this.buttons = buttons;
    this.closable = options.closable !== undefined ? options.closable : true;
    this.class = options.class;
  }
  render() {
    if (this.el === undefined) {
      this.backdrop = document.createElement("div");
      this.backdrop.classList.add("modalBg");
      this.el = document.createElement("div");
      this.el.classList.add("modal");
      if (this.class) {
        this.el.classList.add(this.class);
      }
      const title = document.createElement("h4");
      title.classList.add("title");
      title.textContent = this.title;
      this.el.append(title);
      if (this.html) {
        const html = document.createElement("div");
        html.innerHTML = this.html;
        this.el.append(html);
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
    if (this.el) {
      this.el.remove();
      this.backdrop.remove();
      this.el = undefined;
      this.backdrop = undefined;
    }
  }
}
