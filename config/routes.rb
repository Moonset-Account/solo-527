Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  require "sidekiq/web"
  mount Sidekiq::Web => "/sidekiq"

  root "dashboard#index"

  resources :doctors do
    resources :time_slots, only: [:index, :new, :create]
  end

  resources :time_slots, except: [:new, :create]

  resources :customers

  resources :service_items

  resources :waiting_list_rules

  resources :waiting_lists do
    member do
      post :convert_to_appointment
      post :cancel
    end
    collection do
      get :auto_release
    end
  end

  resources :appointments do
    member do
      post :confirm
      post :complete
      post :no_show
      post :cancel
      post :refund
    end
    resources :refund_records, only: [:new, :create]
  end

  resources :refund_records, only: [:index, :show]

  resources :waiting_list_change_logs, only: [:index]

  namespace :admin do
    get "dashboard", to: "dashboard#index"
    resources :waiting_list_rules
    resources :batch_operations do
      collection do
        post :preview
        post :execute
      end
    end
    get "reports/daily_load", to: "reports#daily_load"
    get "reports/no_shows", to: "reports#no_shows"
    get "reports/export_details", to: "reports#export_details"
  end
end
