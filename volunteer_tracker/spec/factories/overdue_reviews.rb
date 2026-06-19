FactoryBot.define do
  factory :overdue_review do
    visit_record { nil }
    impact_scope { "MyText" }
    responsible_person { "MyString" }
    conclusion { "MyText" }
    review_date { "2026-06-20" }
    reviewer { nil }
  end
end
