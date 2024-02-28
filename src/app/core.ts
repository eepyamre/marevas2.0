export class Core {
  ctx: CanvasRenderingContext2D;
  constructor(canvas: HTMLCanvasElement) {
    let ctx = canvas.getContext('2d')
    if(!ctx){
      throw new Error('No canvas context available!')
    }
    this.initCanvas(canvas)
    this.ctx = ctx;
  }

  private initCanvas = (canvas: HTMLCanvasElement) => {
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
  }


}