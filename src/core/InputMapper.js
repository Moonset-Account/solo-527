export class InputMapper {
  constructor(canvas) {
    this.canvas = canvas
    this.listeners = {}
    this.mousePos = { x: 0, y: 0 }
    this.keys = {}
    this._setupListeners()
  }

  _setupListeners() {
    this.canvas.addEventListener('click', (e) => {
      const pos = this._getCanvasPos(e)
      this._emit('click', pos)
    })

    this.canvas.addEventListener('mousemove', (e) => {
      const pos = this._getCanvasPos(e)
      this.mousePos = pos
      this._emit('mousemove', pos)
    })

    this.canvas.addEventListener('mousedown', (e) => {
      const pos = this._getCanvasPos(e)
      this._emit('mousedown', pos)
    })

    this.canvas.addEventListener('mouseup', (e) => {
      const pos = this._getCanvasPos(e)
      this._emit('mouseup', pos)
    })

    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true
      this._emit('keydown', e.code)
      this._emit('key', e.key)
    })

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false
      this._emit('keyup', e.code)
    })

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault()
      const touch = e.touches[0]
      const pos = this._getCanvasPos(touch)
      this._emit('click', pos)
    })

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault()
      const touch = e.touches[0]
      const pos = this._getCanvasPos(touch)
      this.mousePos = pos
      this._emit('mousemove', pos)
    })
  }

  _getCanvasPos(e) {
    const rect = this.canvas.getBoundingClientRect()
    const scaleX = this.canvas.width / rect.width
    const scaleY = this.canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    }
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)
  }

  off(event, callback) {
    if (!this.listeners[event]) return
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback)
  }

  _emit(event, data) {
    if (!this.listeners[event]) return
    for (const cb of this.listeners[event]) {
      cb(data)
    }
  }

  isKeyPressed(code) {
    return !!this.keys[code]
  }
}
