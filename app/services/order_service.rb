class OrderService
  def initialize(user)
    @user = user
  end

  def create_order(ticket_type_id:, quantity:, holder_name:)
    ticket_type = TicketType.active.find(ticket_type_id)
    raise "票种不可用" unless ticket_type
    raise "库存不足" unless ticket_type.inventory.available >= quantity
    raise "超出限购数量" if quantity > ticket_type.purchase_limit

    order = nil
    ActiveRecord::Base.transaction do
      order = @user.orders.create!(
        order_no: generate_order_no,
        total_amount: ticket_type.price * quantity,
        status: :pending
      )
      quantity.times do
        order.tickets.create!(
          ticket_type: ticket_type,
          ticket_no: generate_ticket_no,
          holder_name: holder_name,
          status: :active
        )
      end
      InventoryService.new.deduct(ticket_type, quantity)
    end
    order
  end

  def pay_order(order)
    raise "订单状态不允许支付" unless order.pending?
    ActiveRecord::Base.transaction do
      order.update!(status: :paid, paid_at: Time.current)
      order.tickets.each { |t| t.update!(status: :valid) }
    end
    AuditLogService.new.log(action: "order_paid", auditable: order, user: @user)
    order
  end

  private

  def generate_order_no
    "ORD#{Time.current.strftime('%Y%m%d%H%M%S')}#{SecureRandom.hex(4).upcase}"
  end

  def generate_ticket_no
    "TKT#{Time.current.strftime('%Y%m%d')}#{SecureRandom.hex(6).upcase}"
  end
end
