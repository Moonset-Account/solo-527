FactoryBot.define do
  factory :registration do
    session { nil }
    user { nil }
    school { nil }
    registration_type { 1 }
    status { 1 }
    student_count { 1 }
    contact_name { "MyString" }
    contact_phone { "MyString" }
    contact_email { "MyString" }
    notes { "MyText" }
    submitted_at { "2026-06-06 05:57:08" }
    approved_at { "2026-06-06 05:57:08" }
    rejected_at { "2026-06-06 05:57:08" }
    rejection_reason { "MyText" }
    qr_token { "MyString" }
  end
end
