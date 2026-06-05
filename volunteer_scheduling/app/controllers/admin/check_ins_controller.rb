class Admin::CheckInsController < ApplicationController
  before_action :authorize_admin!

  def review
    @check_ins = CheckIn.where(status: [:needs_review, :checked_out])
                         .includes(assignment: [:volunteer_profile, :activity])
                         .order(created_at: :desc)
                         .page(params[:page]).per(20)
  end

  private

  def authorize_admin!
    authorize :admin, :access?
  end
end
