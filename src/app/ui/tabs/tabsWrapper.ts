import { TabsBrush } from "./tabsBrush";
import { TabsButton } from "./tabsButton";
import { TabsLayer } from "./tabsLayer";

type ITabsLayer = {
  title: string;
  image: string;
  user: string;
  onClick: () => void;
  type: "layer";
};
type ITabsBrush = {
  title: string;
  image: string;
  onClick: () => void;
  type: "brush";
};
export type TabsItem = ITabsBrush | ITabsLayer;
export class TabsWrapper {
  el: HTMLDivElement;
  constructor(
    root: HTMLDivElement,
    tabs: {
      title: string;
      items: TabsItem[];
    }[]
  ) {
    this.el = document.createElement("div");
    this.el.classList.add("tabs");
    const btns = document.createElement("div");
    btns.classList.add("tabs__buttons");
    const lists: HTMLDivElement[] = [];
    tabs.forEach((tab, i) => {
      const btn = new TabsButton(tab.title);
      btns.append(btn.el);
      const list = document.createElement("div");
      list.classList.add("tabs__content_list", tab.title);
      lists.push(list);
      if (i === 0) {
        list.classList.add("active");
        btn.el.classList.add("active");
      }
      tab.items.forEach((item, i) => {
        if (item.type === "brush") {
          list.append(new TabsBrush(item.title, item.image).el);
        } else if (item.type === "layer") {
          list.append(new TabsLayer(item.title, item.image, item.user).el);
        }
        if (i === 0) {
          list.firstElementChild?.classList.add("active");
        }
      });
    });

    this.el.append(btns, ...lists);
    root.append(this.el);
  }
}
