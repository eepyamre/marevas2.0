import eyeIcon from "../../../assets/icons/eye.png";
export class TabsLayer {
  el: HTMLDivElement;
  constructor(text: string, imgSrc: string, user: string) {
    this.el = document.createElement("div");
    const title = document.createElement("span");
    title.classList.add("title");
    const userEl = document.createElement("span");
    userEl.classList.add("user");
    const img = document.createElement("img");
    this.el.classList.add("tabs__content_list__item", "layer");
    const textEl = document.createElement("div");
    textEl.classList.add("text");
    title.textContent = text;
    userEl.textContent = user;
    img.src = imgSrc;
    textEl.append(title, userEl);
    const icon = document.createElement("img");
    icon.src = eyeIcon;
    this.el.append(icon, img, textEl);
  }
}
