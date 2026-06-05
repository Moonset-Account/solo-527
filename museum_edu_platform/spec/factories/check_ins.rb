FactoryBot.define do
  factory :check_in do
    registration { nil }
    student { nil }
    session { nil }
    checked_in_at { "2026-06-06 05:57:19" }
    checked_in_by { nil }
    status { 1 }
    check_in_method { "MyString" }
    photo { nil }
    notes { "MyText" }
    offline_uuid { "MyString" }
    synced_at { "2026-06-06 05:57:19" }
  end
end
