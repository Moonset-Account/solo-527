FactoryBot.define do
  factory :visit_record do
    volunteer { nil }
    visit_date { "2026-06-20" }
    target_name { "MyString" }
    target_address { "MyString" }
    target_contact { "MyString" }
    purpose { "MyText" }
    result { "MyText" }
    status { "MyString" }
    next_action { "MyText" }
  end
end
