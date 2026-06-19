class AddVolunteerServiceToOverdueReviews < ActiveRecord::Migration[8.1]
  def change
    add_reference :overdue_reviews, :volunteer_service, foreign_key: true
  end
end
