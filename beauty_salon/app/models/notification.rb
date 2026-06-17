class Notification < ApplicationRecord
  belongs_to :recipient, polymorphic: true
  has_one_attached :export_file

  validates :title, presence: true

  scope :unread, -> { where(read: false) }
  scope :recent, -> { order(created_at: :desc) }
  scope :by_category, ->(cat) { where(category: cat) if cat.present? }

  def mark_as_read!
    update!(read: true)
  end

  def self.create_renewal_notice!(treatment_card)
    admin = AdminUser.first
    create!(
      recipient: admin,
      title: "疗程续费提醒",
      body: "客户 #{treatment_card.customer.name} 的疗程卡 #{treatment_card.card_number} 即将到期，请提醒续费",
      category: "renewal",
      urgent: false
    )
  end

  def self.create_consumable_alert!(treatment_card_item, rule)
    admin = AdminUser.first
    create!(
      recipient: admin,
      title: "耗材异常告警",
      body: "客户 #{treatment_card_item.treatment_card.customer.name} 的疗程 #{treatment_card_item.treatment.name} 剩余次数异常（剩余 #{treatment_card_item.remaining_sessions} 次）",
      category: "consumable_alert",
      urgent: true
    )
  end
end
