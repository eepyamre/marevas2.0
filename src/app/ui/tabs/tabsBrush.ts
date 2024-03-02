export class TabsBrush {
  el: HTMLDivElement;
  constructor(text: string, imgSrc: string) {
    this.el = document.createElement("div");
    const title = document.createElement("span");
    const img = document.createElement("img");
    this.el.classList.add("tabs__content_list__item", "brush");
    title.textContent = text;
    img.src = imgSrc;
    this.el.append(img, title);
  }
}
