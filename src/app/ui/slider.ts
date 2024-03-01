type SliderOptions = {
  min: number;
  max: number;
  postfix: string;
  default: string | number;
  title: string;
};
export class Slider {
  private el: HTMLDivElement;
  private valueEl: HTMLSpanElement;
  private value: string;
  private bg: HTMLDivElement;
  private postfix = "";
  private min = 0;
  private max = 100;
  private handlePointer = false;
  private onChange: (value: string) => unknown;
  constructor(
    parent: HTMLElement,
    onChange: (value: string) => unknown,
    options: Partial<SliderOptions> = {
      min: 0,
      max: 100,
      postfix: "",
      default: 10,
      title: "[title]",
    }
  ) {
    this.postfix = options.postfix || "";
    this.min = options.min || 0;
    this.max = options.max || 100;
    this.value = (options.default || 0).toString();
    this.onChange = onChange;

    const wrapper = document.createElement("label");
    wrapper.classList.add("input_wrapper", "input_wrapper_range");
    const title = document.createElement("span");
    title.textContent = options.title || "";
    this.el = document.createElement("div");
    this.el.classList.add("slider");
    this.bg = document.createElement("div");
    this.bg.classList.add("bg");
    this.bg.style.width = (+this.value / +this.max) * 100 + "%";
    this.valueEl = document.createElement("span");
    this.valueEl.classList.add("value");
    this.valueEl.textContent = this.value + this.postfix;
    this.el.append(this.bg, this.valueEl);
    wrapper.append(title, this.el);
    parent.append(wrapper);
    this.el.addEventListener("pointerdown", this.onPointerDown);
    this.el.addEventListener("pointermove", this.onPointerMove);
    this.el.addEventListener("pointerup", this.onPointerUp);
    this.el.addEventListener("pointerleave", this.onPointerUp);
    this.el.addEventListener("wheel", this.onWheel);
  }

  private onPointerDown = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    this.handlePointer = true;
  };

  private onPointerMove = (e: PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!this.handlePointer) {
      return;
    }
    const x = e.screenX - this.el.getBoundingClientRect().left;
    const maxX = this.el.getBoundingClientRect().width;
    this.value = Math.ceil((x / maxX) * this.max).toString();
    if (+this.value < this.min) {
      this.value = this.min.toString();
    }
    if (+this.value > this.max) {
      this.value = this.max.toString();
    }
    this.valueEl.textContent = this.value + this.postfix;
    this.bg.style.width = (+this.value / +this.max) * 100 + "%";
  };

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    let step = this.max / 100;
    if (e.deltaY > 0) {
      step = -step;
    }
    this.value = Math.ceil(+this.value + step).toString();
    if (+this.value < this.min) {
      this.value = this.min.toString();
    }
    if (+this.value > this.max) {
      this.value = this.max.toString();
    }
    this.valueEl.textContent = this.value + this.postfix;
    this.bg.style.width = (+this.value / +this.max) * 100 + "%";
    this.onChange && this.onChange(this.value);
  };

  private onPointerUp = (e: PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!this.handlePointer) return;
    const x = e.screenX - this.el.getBoundingClientRect().left;
    const maxX = this.el.getBoundingClientRect().width;
    this.value = Math.ceil((x / maxX) * this.max).toString();
    if (+this.value < this.min) {
      this.value = this.min.toString();
    }
    if (+this.value > this.max) {
      this.value = this.max.toString();
    }
    this.valueEl.textContent = this.value + this.postfix;
    this.handlePointer = false;
    this.onChange && this.onChange(this.value);
  };
}
