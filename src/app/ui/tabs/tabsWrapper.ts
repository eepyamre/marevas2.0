import { TabsBrush } from "./tabsBrush";
import { TabsButton } from "./tabsButton";
import { TabsLayer } from "./tabsLayer";

type ITabsLayer = {
  isActive: boolean;
  title: string;
  image: string;
  user: string;
  onClick: () => void;
  type: "layer";
};
type ITabsBrush = {
  isActive: boolean;
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
    }[],
    activeTab: string
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
      if (tab.title === activeTab) {
        list.classList.add("active");
        btn.el.classList.add("active");
      }
      tab.items.forEach((item, i) => {
        if (item.type === "brush") {
          const el = new TabsBrush(
            item.title,
            item.image,
            item.isActive,
            item.onClick
          ).el;
          list.append(el);
        } else if (item.type === "layer") {
          const el = new TabsLayer(
            item.title,
            item.image,
            item.user,
            item.isActive,
            item.onClick
          ).el;
          list.append(el);
        }
      });
    });

    this.el.append(btns, ...lists);
    root.append(this.el);
  }
}
