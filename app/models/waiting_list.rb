class WaitingList < ApplicationRecord
  include AASM

  belongs_to :customer
  belongs_to :doctor
  belongs_to :time_slot, optional: true
  belongs_to :service_item, optional: true
  belongs_to :waiting_list_rule, optional: true
  has_many :waiting_list_change_logs, dependent: :destroy
  has_many :waiting_list_notifications, dependent: :destroy
  has_one :appointment, dependent: :nullify

  validates :customer_id, presence: true
  validates :doctor_id, presence: true
  validates :position, presence: true, numericality: { greater_than: 0 }
  validates :tracking_code, presence: true, uniqueness: true
  validates :joined_at, presence: true

  before_validation :generate_tracking_code, on: :create
  before_validation :set_joined_at, on: :create
  before_validation :calculate_position, on: :create
  before_validation :set_vip_priority, on: :create
  after_create :log_creation
  after_update :log_status_change, if: :saved_change_to_status?
  after_update :log_position_change, if: :saved_change_to_position?
  after_create :update_time_slot_waiting_count
  after_destroy :update_time_slot_waiting_count

  scope :waiting, -> { where(status: "waiting") }
  scope :notified, -> { where(status: "notified") }
  scope :confirmed, -> { where(status: "confirmed") }
  scope :expired, -> { where(status: "expired") }
  scope :cancelled, -> { where(status: "cancelled") }
  scope :converted, -> { where(status: "converted") }
  scope :for_doctor, ->(doctor_id) { where(doctor_id: doctor_id) }
  scope :for_time_slot, ->(time_slot_id) { where(time_slot_id: time_slot_id) }
  scope :vip_first, -> { order(vip_priority: :desc, position: :asc, joined_at: :asc) }
  scope :by_position, -> { order(position: :asc) }
  scope :expired_before, ->(time) { where("expires_at IS NOT NULL AND expires_at < ? AND status = ?", time, "waiting") }

  aasm column: "status" do
    state :waiting, initial: true
    state :notified
    state :confirmed
    state :converted
    state :expired
    state :cancelled

    event :notify do
      transitions from: :waiting, to: :notified
    end

    event :confirm do
      transitions from: [:waiting, :notified], to: :confirmed
    end

    event :convert do
      transitions from: [:waiting, :notified, :confirmed], to: :converted
    end

    event :expire do
      transitions from: [:waiting, :notified], to: :expired
    end

    event :cancel_entry do
      transitions from: [:waiting, :notified, :confirmed], to: :cancelled
    end
  end

  def self.add_customer(customer, doctor, time_slot: nil, service_item: nil, rule: nil, operator: nil)
    return nil if customer.blank? || doctor.blank?

    rule ||= WaitingListRule.default_rule
    max_waiting = rule&.max_waiting_per_slot || 5

    current_count = where(doctor: doctor, time_slot: time_slot, status: ["waiting", "notified", "confirmed"]).count
    return nil if current_count >= max_waiting

    create!(
      customer: customer,
      doctor: doctor,
      time_slot: time_slot,
      service_item: service_item,
      waiting_list_rule: rule,
      contact_phone: customer&.phone
    )
  end

  def convert_to_appointment!(service_items: [], operator: nil)
    return false unless may_convert?
    return false if time_slot.blank?

    ActiveRecord::Base.transaction do
      appointment = Appointment.create_from_waiting_list!(self, service_items: service_items, operator: operator)
      convert!
      log_conversion(appointment, operator)
      update_time_slot_waiting_count
      appointment
    end
  end

  def cancel!(reason: nil, operator: nil)
    return false unless may_cancel_entry?
    ActiveRecord::Base.transaction do
      cancel_entry!
      log_cancellation(reason, operator)
      reorder_positions_after_cancellation
      update_time_slot_waiting_count
    end
    true
  end

  def expired?
    expires_at.present? && expires_at < Time.current && status == "waiting"
  end

  def check_and_expire!
    expire! if expired?
  end

  def change_logs
    waiting_list_change_logs.order(changed_at: :desc)
  end

  def before_after_snapshots
    change_logs.map do |log|
      {
        changed_at: log.changed_at,
        change_type: log.change_type,
        before: { position: log.old_position, status: log.old_status },
        after: { position: log.new_position, status: log.new_status },
        operator: log.operator,
        details: log.change_details
      }
    end
  end

  def send_release_notification!(rule = nil)
    return false unless status == "waiting"

    rule ||= waiting_list_rule || WaitingListRule.default_rule
    return false unless rule

    deadline = if time_slot
                 rule.confirmation_deadline_for(time_slot)
               else
                 rule.confirmation_timeout_minutes.minutes.from_now
               end

    notification = nil

    transaction do
      notification = waiting_list_notifications.create!(
        notification_type: "release",
        channel: rule.notify_channel || "sms",
        recipient: contact_phone || customer&.phone,
        content: build_notification_message(deadline),
        operator: "system_auto_release",
        notes: "规则: #{rule.name}"
      )

      notification.send!

      notify! if may_notify?
      update!(notified_at: Time.current, expires_at: deadline)

      log_notification_sent(notification, rule)
    end

    if deadline && deadline > Time.current
      WaitingListConfirmationTimeoutJob.set(wait_until: deadline).perform_later(id)
    end

    { notification: notification, deadline: deadline }
  end

  def notification_history
    waiting_list_notifications.recent.map do |n|
      {
        id: n.id,
        type: n.notification_type,
        channel: n.channel,
        recipient: n.recipient,
        status: n.status,
        sent_at: n.sent_at,
        content: n.content,
        error: n.error_message
      }
    end
  end

  private

  def build_notification_message(deadline)
    slot_info = time_slot ? "#{time_slot.start_time.strftime('%m月%d日 %H:%M')}" : ""
    deadline_info = deadline ? "请于#{deadline.strftime('%m月%d日 %H:%M')}前确认" : ""
    "[口腔诊所] 您好#{customer.name}，您候补的#{doctor.name}医生#{slot_info}洁牙时段已有空位。#{deadline_info}，退订回T"
  end

  def log_notification_sent(notification, rule)
    waiting_list_change_logs.create!(
      change_type: "notified",
      old_position: position,
      new_position: position,
      old_status: status_before_last_save || "waiting",
      new_status: status,
      changed_at: Time.current,
      operator: "system",
      change_details: "已发送#{notification.channel}通知（#{rule.name}），消息ID: #{notification.provider_reference}"
    )
  end

  def generate_tracking_code
    self.tracking_code ||= "WL#{Time.current.strftime('%Y%m%d%H%M%S')}#{SecureRandom.hex(4).upcase}"
  end

  def set_joined_at
    self.joined_at ||= Time.current
  end

  def calculate_position
    return if position.present? && position > 0

    scope = WaitingList.where(doctor: doctor, time_slot: time_slot)
                       .where(status: ["waiting", "notified", "confirmed"])

    if customer&.vip
      last_vip_pos = scope.where(vip_priority: true).maximum(:position) || 0
      self.position = last_vip_pos + 1
      reorder_positions_after_vip_insert(last_vip_pos)
    else
      max_pos = scope.maximum(:position) || 0
      self.position = max_pos + 1
    end
  end

  def reorder_positions_after_vip_insert(last_vip_pos)
    return unless time_slot
    WaitingList.where(doctor: doctor, time_slot: time_slot)
               .where(status: ["waiting", "notified", "confirmed"])
               .where(vip_priority: false)
               .where("position > ?", last_vip_pos)
               .order(:position)
               .each do |entry|
      entry.increment!(:position)
    end
  end

  def set_vip_priority
    self.vip_priority = customer&.vip || false
  end

  def log_creation
    waiting_list_change_logs.create!(
      change_type: "created",
      old_position: nil,
      new_position: position,
      old_status: nil,
      new_status: status,
      changed_at: Time.current,
      operator: source,
      change_details: "客户加入候补队列，位置：#{position}"
    )
  end

  def log_status_change
    waiting_list_change_logs.create!(
      change_type: "status_changed",
      old_position: position,
      new_position: position,
      old_status: saved_change_to_status[0],
      new_status: saved_change_to_status[1],
      changed_at: Time.current,
      change_details: "状态从 #{saved_change_to_status[0]} 变更为 #{saved_change_to_status[1]}"
    )
  end

  def log_position_change
    waiting_list_change_logs.create!(
      change_type: "position_changed",
      old_position: saved_change_to_position[0],
      new_position: saved_change_to_position[1],
      old_status: status,
      new_status: status,
      changed_at: Time.current,
      change_details: "位置从 #{saved_change_to_position[0]} 变更为 #{saved_change_to_position[1]}"
    )
  end

  def log_conversion(appointment, operator)
    waiting_list_change_logs.create!(
      change_type: "converted",
      old_position: position,
      new_position: position,
      old_status: "confirmed",
      new_status: "converted",
      appointment: appointment,
      changed_at: Time.current,
      operator: operator,
      change_details: "已转化为预约：#{appointment.appointment_no}"
    )
  end

  def log_cancellation(reason, operator)
    waiting_list_change_logs.create!(
      change_type: "cancelled",
      old_position: position,
      new_position: nil,
      old_status: status_before_last_save,
      new_status: "cancelled",
      changed_at: Time.current,
      operator: operator,
      change_details: "取消候补。原因：#{reason}"
    )
  end

  def reorder_positions_after_cancellation
    return if time_slot.blank?
    WaitingList.where(doctor: doctor, time_slot: time_slot, status: ["waiting", "notified", "confirmed"])
               .where("position > ?", position)
               .order(:position)
               .each do |entry|
      entry.decrement!(:position)
    end
  end

  def update_time_slot_waiting_count
    return if time_slot.blank?
    count = WaitingList.where(time_slot: time_slot, status: ["waiting", "notified", "confirmed"]).count
    time_slot.update_column(:waiting_count, count)
  end
end
