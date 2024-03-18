import eyeIcon from "../../../assets/icons/eye.png";
import deleteIcon from "../../../assets/icons/delete.png";

export class TabsLayer {
  el: HTMLDivElement;
  constructor(
    text: string,
    imgSrc: string,
    user: string,
    isActive: boolean,
    onClick: () => void,
    onDelete: () => void
  ) {
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
    const delicon = document.createElement("img");
    if (onDelete) {
      delicon.classList.add("delete");
      delicon.src = deleteIcon;
      const fn = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        onDelete();
      };
      delicon.addEventListener("click", fn);
    }
    if (isActive) {
      this.el.classList.add("active");
    }
    this.el.addEventListener("click", onClick);
    this.el.append(icon, img, textEl);
    if (onDelete) {
      this.el.append(delicon);
    }
  }
}
