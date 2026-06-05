FactoryBot.define do
  factory :session do
    course { nil }
    start_at { "2026-06-06 05:56:42" }
    end_at { "2026-06-06 05:56:42" }
    location { "MyString" }
    capacity { 1 }
    registered_count { 1 }
    status { 1 }
    notes { "MyText" }
    qr_code_token { "MyString" }
  end
end
