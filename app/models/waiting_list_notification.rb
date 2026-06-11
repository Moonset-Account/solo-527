class WaitingListNotification < ApplicationRecord
  belongs_to :waiting_list

  validates :notification_type, presence: true

  scope :sms, -> { where(channel: "sms") }
  scope :wechat, -> { where(channel: "wechat") }
  scope :sent, -> { where(status: "sent") }
  scope :failed, -> { where(status: "failed") }
  scope :recent, -> { order(sent_at: :desc) }

  def send!
    return false if status == "sent"

    result = case channel
             when "wechat" then send_wechat
             else send_sms
             end

    if result[:success]
      update!(status: "sent", sent_at: Time.current, provider_reference: result[:reference])
      true
    else
      update!(status: "failed", error_message: result[:error])
      false
    end
  end

  private

  def send_sms
    Rails.logger.info "[SMS Mock] To: #{recipient}, Message: #{content}"
    { success: true, reference: "SMS_MOCK_#{SecureRandom.hex(8).upcase}" }
  end

  def send_wechat
    Rails.logger.info "[WeChat Mock] To: #{recipient}, Message: #{content}"
    { success: true, reference: "WECHAT_MOCK_#{SecureRandom.hex(8).upcase}" }
  end
end
