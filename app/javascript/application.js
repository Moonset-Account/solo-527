import "@hotwired/turbo-rails"
import "./controllers"

document.addEventListener("turbo:load", () => {
  setupDropdownMenus()
  setupFlashMessages()
  setupConfirmDialogs()
})

function setupDropdownMenus() {
  const triggers = document.querySelectorAll(".dropdown-trigger")

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", (e) => {
      e.preventDefault()
      e.stopPropagation()

      const dropdown = trigger.closest(".nav-dropdown")
      const menu = dropdown?.querySelector(".dropdown-menu")

      document.querySelectorAll(".dropdown-menu.show").forEach((openMenu) => {
        if (openMenu !== menu) {
          openMenu.classList.remove("show")
        }
      })

      menu?.classList.toggle("show")
    })
  })

  document.addEventListener("click", () => {
    document.querySelectorAll(".dropdown-menu.show").forEach((menu) => {
      menu.classList.remove("show")
    })
  })
}

function setupFlashMessages() {
  const flashes = document.querySelectorAll(".flash")

  flashes.forEach((flash) => {
    if (!flash.querySelector(".flash-close")) {
      const closeBtn = document.createElement("button")
      closeBtn.className = "flash-close"
      closeBtn.innerHTML = "&times;"
      closeBtn.setAttribute("aria-label", "关闭")
      closeBtn.addEventListener("click", () => {
        flash.style.opacity = "0"
        flash.style.transform = "translateY(-10px)"
        flash.style.transition = "all 0.3s ease"
        setTimeout(() => flash.remove(), 300)
      })
      flash.appendChild(closeBtn)
    }

    setTimeout(() => {
      flash.style.opacity = "0"
      flash.style.transform = "translateY(-10px)"
      flash.style.transition = "all 0.3s ease"
      setTimeout(() => flash.remove(), 300)
    }, 5000)
  })
}

function setupConfirmDialogs() {
  document.querySelectorAll("[data-confirm]").forEach((element) => {
    if (element.dataset.confirmBound) return
    element.dataset.confirmBound = "true"

    element.addEventListener("click", (e) => {
      const message = element.dataset.confirm
      if (!confirm(message)) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
    })
  })
}
