FactoryBot.define do
  factory :session_equipment do
    session { nil }
    equipment { nil }
    quantity_allocated { 1 }
    status { 1 }
    notes { "MyText" }
  end
end
