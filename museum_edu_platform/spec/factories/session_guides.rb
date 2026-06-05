FactoryBot.define do
  factory :session_guide do
    session { nil }
    user { nil }
    role { "MyString" }
    status { 1 }
    notes { "MyText" }
  end
end
