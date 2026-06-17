Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  require "sidekiq/web"
  mount Sidekiq::Web => "/sidekiq"

  namespace :external do
    resources :lookup, only: [:index] do
      collection do
        get :search
      end
    end
    resources :treatments, only: [:index, :show]
    resources :customers do
      resources :treatment_cards, only: [:index, :show]
    end
  end

  namespace :admin do
    root "dashboard#index"
    resources :dashboard, only: [:index]
    resources :customers do
      get :card_items, on: :member
    end
    resources :treatments
    resources :treatment_cards
    resources :technicians
    resources :schedules
    resources :appointments
    resources :check_ins do
      member do
        patch :update
      end
    end
    resources :audit_logs, only: [:index, :show]
    resources :notifications, only: [:index, :show] do
      collection do
        post :mark_all_read
      end
      member do
        get :download_export
      end
    end
    resources :todo_items, only: [:index, :show, :update] do
      member do
        patch :dismiss
      end
    end
    resources :consumable_rules
    resources :api_failure_logs, only: [:index, :show] do
      member do
        post :retry
        post :add_note
      end
    end
    resources :exports, only: [:create]
  end

  root "external/lookup#index"
end
