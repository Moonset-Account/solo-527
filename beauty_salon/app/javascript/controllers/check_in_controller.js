import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["customer"]

  onCustomerChange(event) {
    const customerId = event.target.value
    const cardItemSelect = document.getElementById("check_in_treatment_card_item_id")

    if (!customerId) {
      cardItemSelect.innerHTML = '<option value="">不使用疗程卡</option>'
      return
    }

    fetch(`/admin/customers/${customerId}/card_items.json`)
      .then(response => response.json())
      .then(data => {
        let options = '<option value="">不使用疗程卡</option>'
        data.forEach(item => {
          options += `<option value="${item.id}">${item.card_number} - ${item.treatment_name} (余${item.remaining_sessions}次)</option>`
        })
        cardItemSelect.innerHTML = options
      })
      .catch(() => {
        cardItemSelect.innerHTML = '<option value="">不使用疗程卡</option>'
      })
  }

  onAppointmentChange(event) {
    const appointmentId = event.target.value
    if (!appointmentId) return

    const select = event.target
    const option = select.options[select.selectedIndex]
    const text = option.text

    const customerSelect = document.getElementById("check_in_customer_id")
    if (customerSelect && text) {
      const customerName = text.split(" - ")[0]
      for (let i = 0; i < customerSelect.options.length; i++) {
        if (customerSelect.options[i].text === customerName) {
          customerSelect.selectedIndex = i
          customerSelect.dispatchEvent(new Event("change"))
          break
        }
      }
    }
  }
}
