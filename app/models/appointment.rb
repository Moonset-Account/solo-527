class Appointment < ApplicationRecord
  include AASM

  belongs_to :customer
  belongs_to :doctor
  belongs_to :time_slot
  belongs_to :waiting_list, optional: true
  has_many :appointment_service_items, dependent: :destroy
  has_many :service_items, through: :appointment_service_items
  has_many :refund_records, dependent: :destroy

  validates :appointment_no, presence: true, uniqueness: true
  validates :customer_id, presence: true
  validates :doctor_id, presence: true
  validates :time_slot_id, presence: true

  before_validation :generate_appointment_no, on: :create
  before_validation :set_appointment_date, on: :create
  after_create :update_time_slot_booked_count
  after_destroy :update_time_slot_booked_count

  scope :pending, -> { where(status: "pending") }
  scope :confirmed, -> { where(status: "confirmed") }
  scope :completed, -> { where(status: "completed") }
  scope :cancelled, -> { where(status: "cancelled") }
  scope :no_show, -> { where(status: "no_show") }
  scope :from_waiting_list, -> { where(from_waiting_list: true) }
  scope :on_date, ->(date) { where("DATE(appointment_date) = ?", date) }
  scope :for_doctor, ->(doctor_id) { where(doctor_id: doctor_id) }
  scope :with_refunds, -> { where("refunded_amount > 0") }

  aasm column: "status" do
    state :pending, initial: true
    state :confirmed
    state :completed
    state :cancelled
    state :no_show
    state :refunded

    event :confirm_appointment do
      transitions from: :pending, to: :confirmed
    end

    event :complete do
      transitions from: [:pending, :confirmed], to: :completed
    end

    event :mark_no_show do
      transitions from: [:pending, :confirmed], to: :no_show, after: :handle_no_show
    end

    event :cancel_appointment do
      transitions from: [:pending, :confirmed], to: :cancelled
    end

    event :mark_refunded do
      transitions from: [:completed, :cancelled, :no_show], to: :refunded
    end
  end

  def self.create_from_waiting_list!(waiting_list, service_items: [], operator: nil)
    appointment = nil
    ActiveRecord::Base.transaction do
      appointment = create!(
        customer: waiting_list.customer,
        doctor: waiting_list.doctor,
        time_slot: waiting_list.time_slot,
        waiting_list: waiting_list,
        from_waiting_list: true,
        source: "waiting_list",
        operator: operator
      )

      service_items = [waiting_list.service_item].compact if service_items.blank? && waiting_list.service_item
      service_items.each do |si|
        appointment.add_service_item!(si)
      end

      appointment.recalculate_totals!
    end
    appointment
  end

  def self.create_direct!(customer, doctor, time_slot, service_items: [], operator: nil)
    appointment = nil
    ActiveRecord::Base.transaction do
      appointment = create!(
        customer: customer,
        doctor: doctor,
        time_slot: time_slot,
        from_waiting_list: false,
        source: "direct",
        operator: operator
      )

      service_items.each do |si|
        appointment.add_service_item!(si)
      end

      appointment.recalculate_totals!
    end
    appointment
  end

  def add_service_item!(service_item, quantity: 1, discount: 0)
    item = appointment_service_items.create!(
      service_item: service_item,
      quantity: quantity,
      unit_price: service_item.price,
      subtotal: service_item.price * quantity - discount,
      discount: discount
    )
    recalculate_totals!
    item
  end

  def remove_service_item!(appointment_service_item)
    appointment_service_item.destroy!
    recalculate_totals!
  end

  def recalculate_totals!
    total = appointment_service_items.sum(:subtotal)
    update_column(:total_amount, total)
  end

  def process_refund!(amount, reason, method: "original", service_item: nil, operator: nil)
    return false if amount <= 0
    return false if amount > (paid_amount - refunded_amount)

    refund = nil
    ActiveRecord::Base.transaction do
      refund = refund_records.create!(
        refund_no: generate_refund_no,
        refund_amount: amount,
        refund_reason: reason,
        refund_method: method,
        appointment_service_item: service_item,
        operator: operator,
        status: "processed",
        processed_at: Time.current
      )

      increment!(:refunded_amount, amount)

      mark_refunded! if refunded_amount >= paid_amount && paid_amount > 0
    end
    refund
  end

  def remaining_refundable
    paid_amount - refunded_amount
  end

  def detailed_record
    {
      appointment_no: appointment_no,
      customer: { id: customer.id, name: customer.name, phone: customer.phone },
      doctor: { id: doctor.id, name: doctor.name },
      time_slot: { id: time_slot.id, start: time_slot.start_time, end: time_slot.end_time },
      status: status,
      from_waiting_list: from_waiting_list,
      waiting_list_tracking: waiting_list&.tracking_code,
      total_amount: total_amount,
      paid_amount: paid_amount,
      refunded_amount: refunded_amount,
      service_items: appointment_service_items.map do |item|
        {
          id: item.id,
          code: item.service_item.code,
          name: item.service_item.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount,
          subtotal: item.subtotal,
          status: item.status
        }
      end,
      refund_records: refund_records.map do |refund|
        {
          id: refund.id,
          refund_no: refund.refund_no,
          amount: refund.refund_amount,
          reason: refund.refund_reason,
          method: refund.refund_method,
          processed_at: refund.processed_at,
          operator: refund.operator,
          service_item: refund.appointment_service_item&.service_item&.name
        }
      end,
      waiting_list_history: waiting_list&.before_after_snapshots || [],
      waiting_list_notifications: waiting_list&.notification_history || [],
      created_at: created_at,
      operator: operator
    }
  end

  def reconciliation_data
    {
      appointment_no: appointment_no,
      date: appointment_date,
      customer_name: customer.name,
      doctor_name: doctor.name,
      status: status,
      total_amount: total_amount,
      paid_amount: paid_amount,
      refunded_amount: refunded_amount,
      net_amount: paid_amount - refunded_amount,
      refund_count: refund_records.count,
      from_waiting_list: from_waiting_list,
      service_count: appointment_service_items.count
    }
  end

  private

  def generate_appointment_no
    self.appointment_no ||= "APT#{Time.current.strftime('%Y%m%d%H%M%S')}#{SecureRandom.hex(3).upcase}"
  end

  def generate_refund_no
    "REF#{Time.current.strftime('%Y%m%d%H%M%S')}#{SecureRandom.hex(3).upcase}"
  end

  def set_appointment_date
    self.appointment_date ||= time_slot&.start_time
  end

  def handle_no_show
    customer&.increment_no_show!
  end

  def update_time_slot_booked_count
    return if time_slot.blank?
    count = Appointment.where(time_slot: time_slot)
                       .where.not(status: ["cancelled", "no_show"])
                       .count
    time_slot.update_column(:booked_count, count)
    if count >= time_slot.capacity && time_slot.may_mark_full?
      time_slot.mark_full!
    elsif count < time_slot.capacity && time_slot.may_reopen?
      time_slot.reopen!
    end
  end
end
