import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = {
    batchJobId: Number,
    refreshInterval: { type: Number, default: 3000 },
    status: String
  }

  connect() {
    if (this.isRunning()) {
      this.startRefreshing()
    }
  }

  disconnect() {
    this.stopRefreshing()
  }

  isRunning() {
    return this.statusValue === "pending" || this.statusValue === "running"
  }

  startRefreshing() {
    this.refreshTimer = setInterval(() => {
      this.refresh()
    }, this.refreshIntervalValue)
  }

  stopRefreshing() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
      this.refreshTimer = null
    }
  }

  async refresh() {
    try {
      const response = await fetch(`/admin/batch_jobs/${this.batchJobIdValue}.json`)
      if (response.ok) {
        const data = await response.json()
        this.updateUI(data)
        if (data.status !== "pending" && data.status !== "running") {
          this.stopRefreshing()
          this.reloadPage()
        }
      }
    } catch (error) {
      console.error("Failed to refresh batch job:", error)
    }
  }

  updateUI(data) {
    const progressBar = this.element.querySelector("[data-batch-job-id]")
    if (progressBar) {
      const percent = data.progress_percentage || 0
      progressBar.style.width = `${percent}%`
    }

    const statusBadge = this.element.querySelector("[data-role='status-badge']")
    if (statusBadge) {
      statusBadge.textContent = data.status_text || data.status
    }

    const progressText = this.element.querySelector("[data-role='progress-text']")
    if (progressText) {
      const processed = (data.success_count || 0) + (data.failure_count || 0)
      progressText.textContent = `已处理: ${processed} / ${data.total_count || 0} 项`
    }
  }

  reloadPage() {
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }
}
