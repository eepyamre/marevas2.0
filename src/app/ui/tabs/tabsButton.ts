import { Core } from "../../core";

export class TabsButton {
  el: HTMLDivElement;
  text: string;
  constructor(text: string) {
    this.text = text;
    this.el = document.createElement("div");
    this.el.classList.add("tabs__buttons__item");
    this.el.textContent = text;
    this.el.addEventListener("click", this.onClick);
  }
  onClick = () => {
    const lists = document.querySelectorAll(".tabs__content_list");
    const btns = document.querySelectorAll(".tabs__buttons__item");
    lists.forEach((list, i) => {
      list.classList.remove("active");
      btns[i].classList.remove("active");
      if (btns[i].textContent === this.text) {
        btns[i].classList.add("active");
        list.classList.add("active");
        Core.uiController.setActiveTab(this.text);
      }
    });
  };
}
