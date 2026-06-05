FactoryBot.define do
  factory :feedback do
    session { nil }
    registration { nil }
    user { nil }
    rating { 1 }
    content { "MyText" }
    photos { nil }
    status { 1 }
    submitted_at { "2026-06-06 05:57:27" }
  end
end
