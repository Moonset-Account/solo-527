class DonationFollowUpJob < ApplicationJob
  queue_as :default

  def perform
    Donation.where(status: 'pending').where('created_at < ?', 3.days.ago).find_each do |donation|
      TrackingReminder.create!(
        trackable: donation,
        reminder_type: 'donation_follow_up',
        reminder_date: Date.today,
        message: "捐赠 #{donation.donor_name} 的记录待处理"
      )
    end
  end
end
