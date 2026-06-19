FactoryBot.define do
  factory :shift do
    title { "MyString" }
    description { "MyText" }
    start_time { "2026-06-20 02:13:42" }
    end_time { "2026-06-20 02:13:42" }
    capacity { 1 }
    status { "MyString" }
  end
end
