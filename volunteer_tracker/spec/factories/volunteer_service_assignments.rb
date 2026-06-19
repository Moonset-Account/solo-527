FactoryBot.define do
  factory :volunteer_service_assignment do
    volunteer_service { nil }
    user { nil }
    role { "MyString" }
  end
end
