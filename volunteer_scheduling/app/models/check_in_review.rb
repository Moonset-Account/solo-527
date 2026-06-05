class CheckInReview < ApplicationRecord
  belongs_to :check_in
  belongs_to :reviewer, class_name: "User"

  enum :decision, { approved: 0, rejected: 1, sent_back: 2 }

  validates :decision, presence: true
  validates :reviewed_at, presence: true
end
