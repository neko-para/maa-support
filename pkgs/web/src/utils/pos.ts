export class Pos {
  x = 0
  y = 0

  set(x: number, y: number) {
    this.x = x
    this.y = y
    return this
  }

  static fromEvent(e: MouseEvent) {
    return new Pos().set(e.offsetX, e.offsetY)
  }

  copy() {
    return new Pos().set(this.x, this.y)
  }

  inv() {
    return new Pos().set(-this.x, -this.y)
  }

  add(p: Pos) {
    return new Pos().set(this.x + p.x, this.y + p.y)
  }

  sub(p: Pos) {
    return new Pos().set(this.x - p.x, this.y - p.y)
  }

  mul(d: number) {
    return new Pos().set(this.x * d, this.y * d)
  }

  flat(): [number, number] {
    return [this.x, this.y]
  }

  min(p: Pos) {
    return new Pos().set(Math.min(this.x, p.x), Math.min(this.y, p.y))
  }

  max(p: Pos) {
    return new Pos().set(Math.max(this.x, p.x), Math.max(this.y, p.y))
  }

  floor() {
    return new Pos().set(Math.floor(this.x), Math.floor(this.y))
  }

  ceil() {
    return new Pos().set(Math.ceil(this.x), Math.ceil(this.y))
  }

  // make self as left top
  makeRect(another: Pos) {
    const lt = this.min(another)
    const rb = this.max(another)
    this.set(lt.x, lt.y)
    another.set(rb.x, rb.y)
  }

  toString() {
    return `(${this.x}, ${this.y})`
  }
}

type Rect = [x: number, y: number, w: number, h: number]

export class Viewport {
  origin: Pos = new Pos()
  scale: number = 1 // 1vpx = 1px * scale

  dragSave: Pos = new Pos()
  drag: Pos = new Pos()

  toView(p: Pos) {
    return p.mul(1 / this.scale).sub(this.origin)
  }

  fromView(vp: Pos) {
    return vp.add(this.origin).mul(this.scale)
  }

  toViewS(s: Pos) {
    return s.mul(1 / this.scale)
  }

  fromViewS(s: Pos) {
    return s.mul(this.scale)
  }

  reset() {
    this.origin = new Pos()
    this.scale = 1
  }

  startDrag(vp: Pos) {
    this.dragSave = this.origin.copy()
    this.drag = vp
  }

  moveDrag(vp: Pos) {
    this.origin = vp.sub(this.drag).inv().add(this.dragSave)
  }

  zoom(direct: boolean) {
    if (direct) {
      this.scale *= 1 / 1.1
    } else {
      this.scale *= 1.1
    }
  }

  zoomAt(direct: boolean, fix: Pos) {
    const oldPos = this.fromView(fix)
    this.zoom(direct)
    const newFix = this.toView(oldPos)
    this.origin = this.origin.sub(fix.sub(newFix))
  }

  imagePos(width: number, height: number): Rect {
    return [...this.toView(new Pos()).flat(), ...this.toViewS(new Pos().set(width, height)).flat()]
  }

  toString() {
    return `origin: ${this.origin}\nscale: ${this.scale}\ndragSave: ${this.dragSave}\ndrag: ${this.drag}`
  }
}

export class CropContext {
  viewport: Viewport = new Viewport()

  clipStart: Pos = new Pos()
  clipStop: Pos = new Pos()

  startClip(vp: Pos) {
    this.clipStart = this.clipStop = this.viewport.fromView(vp)
  }

  moveClip(vp: Pos) {
    this.clipStop = this.viewport.fromView(vp)
  }

  clipPos(): Rect {
    return [
      ...this.viewport.toView(this.clipStart).flat(),
      ...this.viewport.toViewS(this.clipStop.sub(this.clipStart)).flat()
    ]
  }

  cropPos(): Rect {
    return [...this.clipStart.flat(), ...this.clipStop.sub(this.clipStart).flat()]
  }

  ceilClip() {
    this.clipStart.makeRect(this.clipStop)
    this.clipStart = this.clipStart.floor()
    this.clipStop = this.clipStop.ceil()
  }

  boundClip(width: number, height: number) {
    this.clipStart.makeRect(this.clipStop)
    this.clipStart = this.clipStart.max(new Pos())
    this.clipStop = this.clipStop.min(new Pos().set(width, height))
  }

  toString() {
    return `${this.viewport}\nclipStart: ${this.clipStart}\nclipStop: ${this.clipStop}`
  }
}
