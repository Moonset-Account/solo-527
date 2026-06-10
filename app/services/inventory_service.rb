class InventoryService
  def deduct(ticket_type, quantity)
    inventory = ticket_type.inventory
    raise "库存不足" unless inventory.available >= quantity
    inventory.update!(
      sold: inventory.sold + quantity,
      available: inventory.available - quantity
    )
  end

  def restore(ticket_type, quantity)
    inventory = ticket_type.inventory
    inventory.update!(
      sold: inventory.sold - quantity,
      available: inventory.available + quantity
    )
  end

  def recalculate(ticket_type)
    inventory = ticket_type.inventory
    inventory.update!(available: inventory.total - inventory.sold - inventory.reserved)
  end

  def set_total(ticket_type, total)
    inventory = ticket_type.inventory || ticket_type.create_inventory!
    inventory.update!(total: total, available: total - inventory.sold - inventory.reserved)
  end
end
