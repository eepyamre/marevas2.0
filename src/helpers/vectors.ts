export class Vector2 {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  calculateAngle = (vec2: Vector2) => {
    var dx = vec2.x - this.x;
    var dy = vec2.y - this.y;
    return Math.atan2(dx, dy);
  };
}
