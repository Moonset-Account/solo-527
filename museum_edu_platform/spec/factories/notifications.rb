FactoryBot.define do
  factory :notification do
    user { nil }
    title { "MyString" }
    content { "MyText" }
    notification_type { "MyString" }
    read_at { "2026-06-06 05:57:44" }
    related_object_type { "MyString" }
    related_object_id { 1 }
  end
end
