export class TabsBrush {
  el: HTMLDivElement;
  constructor(
    text: string,
    imgSrc: string,
    isActive: boolean,
    onClick: () => void
  ) {
    this.el = document.createElement("div");
    const title = document.createElement("span");
    const img = document.createElement("img");
    this.el.classList.add("tabs__content_list__item", "brush");
    title.textContent = text;
    img.src = imgSrc;
    if (isActive) {
      this.el.classList.add("active");
    }
    this.el.addEventListener("click", onClick);
    this.el.append(img, title);
  }
}
