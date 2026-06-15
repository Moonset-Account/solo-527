Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  root "welcome#index"

  resources :pets, only: [:index, :show, :new, :create] do
    resources :health_records, only: [:index, :new, :create]
    resources :training_records, only: [:index, :new, :create]
  end

  namespace :admin do
    root "dashboard#index"

    resources :dashboard, only: [:index]
    resources :services
    resources :caretakers
    resources :kennels
    resources :pets
    resources :boarding_reservations do
      member do
        post :check_in
        post :check_out
      end
      collection do
        get :export
      end
    end
    resources :health_records
    resources :training_records
    resources :safety_incidents
    resources :notifications, only: [:index, :show, :destroy] do
      member do
        post :mark_as_read
      end
      collection do
        post :mark_all_as_read
      end
    end

    namespace :analytics do
      get :index, to: "index#index", as: :root
      get :service_quality, to: "index#service_quality"
      get :safety_trends, to: "index#safety_trends"
      get :training_delays, to: "index#training_delays"
    end

    get "exports/boarding", to: "exports#boarding", as: :exports_boarding
    get "exports/training", to: "exports#training", as: :exports_training
    get "exports/health", to: "exports#health", as: :exports_health
    get "exports/download/:filename", to: "exports#download", as: :exports_download
  end

  mount Sidekiq::Web => "/sidekiq" if defined?(Sidekiq::Web)
end
