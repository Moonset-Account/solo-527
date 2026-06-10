class InventorySyncJob < ApplicationJob
  queue_as :default

  def perform(ticket_type_id)
    ticket_type = TicketType.find(ticket_type_id)
    InventoryService.new.recalculate(ticket_type)
  end
end
