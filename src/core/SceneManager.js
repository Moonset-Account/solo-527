export class SceneManager {
  constructor(ctx, canvas, services) {
    this.ctx = ctx
    this.canvas = canvas
    this.services = services
    this.scenes = {}
    this.currentScene = null
    this.currentSceneName = null
    this.transitionAlpha = 0
    this.isTransitioning = false
    this.nextSceneName = null
    this.particles = []
  }

  registerScene(name, sceneClass) {
    this.scenes[name] = sceneClass
  }

  changeScene(name) {
    if (this.isTransitioning) return
    if (this.currentSceneName === name) return

    this.isTransitioning = true
    this._phase = 'fadeIn'
    this.nextSceneName = name
    this.transitionAlpha = 0
    if (this.services.audioManager) {
      this.services.audioManager.playSfx('scene_change')
    }
  }

  _doChangeScene() {
    if (this.currentScene && this.currentScene.onExit) {
      this.currentScene.onExit()
    }

    const SceneClass = this.scenes[this.nextSceneName]
    if (SceneClass) {
      this.services.sceneManager = this
      this.currentScene = new SceneClass(this.ctx, this.canvas, this.services)
      this.currentSceneName = this.nextSceneName
      if (this.currentScene.onEnter) {
        this.currentScene.onEnter()
      }
    }

    this.nextSceneName = null
    this._phase = 'fadeOut'
  }

  update(deltaTime) {
    if (this.isTransitioning) {
      if (this._phase === 'fadeIn') {
        if (this.transitionAlpha < 1) {
          this.transitionAlpha = Math.min(1, this.transitionAlpha + deltaTime * 2.5)
          if (this.transitionAlpha >= 1) {
            this._doChangeScene()
          }
        }
      } else if (this._phase === 'fadeOut') {
        this.transitionAlpha = Math.max(0, this.transitionAlpha - deltaTime * 2.5)
        if (this.transitionAlpha <= 0) {
          this.transitionAlpha = 0
          this.isTransitioning = false
          this._phase = null
        }
      }
    }

    if (this.currentScene && this.currentScene.update) {
      this.currentScene.update(deltaTime)
    }

    this._updateParticles(deltaTime)
  }

  render() {
    const { width, height } = this.canvas

    this.ctx.clearRect(0, 0, width, height)

    if (this.currentScene && this.currentScene.render) {
      this.currentScene.render()
    }

    this._renderParticles()

    if (this.isTransitioning || this.transitionAlpha > 0) {
      this.ctx.fillStyle = `rgba(0, 0, 0, ${this.transitionAlpha})`
      this.ctx.fillRect(0, 0, width, height)
    }
  }

  handleClick(pos) {
    if (this.currentScene && this.currentScene.handleClick) {
      this.currentScene.handleClick(pos)
    }
  }

  handleMouseMove(pos) {
    if (this.currentScene && this.currentScene.handleMouseMove) {
      this.currentScene.handleMouseMove(pos)
    }
  }

  handleKeyDown(key) {
    if (this.currentScene && this.currentScene.handleKeyDown) {
      this.currentScene.handleKeyDown(key)
    }
  }

  addParticle(particle) {
    this.particles.push(particle)
  }

  spawnBurst(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5
      const speed = 2 + Math.random() * 4
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.02 + Math.random() * 0.02,
        color,
        size: 3 + Math.random() * 4
      })
    }
  }

  _updateParticles(deltaTime) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.1
      p.life -= p.decay
      if (p.life <= 0) {
        this.particles.splice(i, 1)
      }
    }
  }

  _renderParticles() {
    for (const p of this.particles) {
      this.ctx.globalAlpha = p.life
      this.ctx.fillStyle = p.color
      this.ctx.beginPath()
      this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
      this.ctx.fill()
    }
    this.ctx.globalAlpha = 1
  }
}
