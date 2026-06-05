FactoryBot.define do
  factory :student do
    school { nil }
    name { "MyString" }
    gender { 1 }
    age_group { 1 }
    status { 1 }
  end
end
