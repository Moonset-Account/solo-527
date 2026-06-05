class ExpireCheckJob < ApplicationJob
  queue_as :default

  def perform
    check_expiring_passes
    check_expired_passes
  end

  private

  def check_expiring_passes
    expires_soon = Pass.active.where(valid_until: 24.hours.from_now..48.hours.from_now)

    expires_soon.each do |pass|
      next if pass.creator.nil?

      already_notified = Notification.exists?(
        recipient: pass.creator,
        notifiable: pass,
        notification_type: 'pass_expiring',
        created_at: 24.hours.ago..Time.current
      )

      unless already_notified
        NotificationJob.perform_later(pass, 'pass_expiring')
      end
    end
  end

  def check_expired_passes
    expired_passes = Pass.where(status: 'approved').where('valid_until <= ?', Time.current).where(is_frozen: false)

    expired_passes.find_each do |pass|
      pass.update(is_frozen: true, frozen_at: Time.current, freeze_reason: '通行证过期自动失效')
    end
  end
end
