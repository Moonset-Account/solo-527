FactoryBot.define do
  factory :tracking_reminder do
    trackable_type { "MyString" }
    trackable_id { 1 }
    reminder_type { "MyString" }
    reminder_date { "2026-06-20" }
    message { "MyText" }
    status { "MyString" }
  end
end
