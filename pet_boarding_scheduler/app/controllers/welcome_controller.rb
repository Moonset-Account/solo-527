class WelcomeController < ApplicationController
  def index
    @recent_pets = Pet.active.order(created_at: :desc).limit(5)
    @active_services = Service.active.limit(6)
  end
end
