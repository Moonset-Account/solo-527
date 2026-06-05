FactoryBot.define do
  factory :registration_student do
    registration { nil }
    student { nil }
    status { 1 }
    notes { "MyText" }
  end
end
