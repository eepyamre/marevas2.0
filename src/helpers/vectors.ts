export class Vector2 {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  calculateAngle = (vec2: Vector2) => {
    const dx = vec2.x - this.x;
    const dy = vec2.y - this.y;
    return Math.atan2(dx, dy);
  };
  divideVec = (that: Vector2) => {
    return new Vector2(this.x / that.x, this.y / that.y);
  };
  divideNum = (n: number) => {
    return new Vector2(this.x / n, this.y / n);
  };
  addNum = (n: number) => {
    return new Vector2(this.x + n, this.y + n);
  };
}
