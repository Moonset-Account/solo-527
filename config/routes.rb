Rails.application.routes.draw do
  root "dashboard#index"

  get "/login", to: "sessions#new", as: :login
  post "/login", to: "sessions#create"
  delete "/logout", to: "sessions#destroy", as: :logout

  resources :events, only: %i[index show]
  resources :orders, only: %i[index show create] do
    member do
      patch :pay
    end
  end
  resources :refunds, only: %i[index show new create]

  namespace :admin do
    resources :ticket_types
    resources :inventories, only: %i[index update]
    resources :registrations, only: %i[index update] do
      member do
        patch :approve
        patch :reject
      end
      collection do
        post :batch_approve
      end
    end
    resources :schedules
    resources :revenue, only: %i[index]
    resources :attendance, only: %i[index update] do
      collection do
        post :check_in
      end
    end
    resources :attendance_alerts, only: %i[index update] do
      member do
        patch :close
      end
    end
    resources :batch_operations, only: %i[index create show]
    resources :saved_filters, only: %i[index create destroy]
    resources :audit_logs, only: %i[index show]
    resources :revenue_anomalies, only: %i[index update] do
      member do
        patch :resolve
      end
    end
  end

  get "up" => "rails/health#show", as: :rails_health_check
end
