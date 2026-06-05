FactoryBot.define do
  factory :equipment do
    name { "MyString" }
    category { "MyString" }
    quantity { 1 }
    status { 1 }
    description { "MyText" }
    photo { nil }
  end
end
