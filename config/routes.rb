Rails.application.routes.draw do
  devise_for :users

  authenticate :user, ->(u) { u.admin? } do
    require "sidekiq/web"
    mount Sidekiq::Web => "/sidekiq"
  end

  root "dashboard#index"

  resources :schedules, only: [:index, :show] do
    collection do
      get :by_team
      get :by_equipment
      get :gantt
    end
  end

  resources :work_orders, except: [:destroy] do
    resources :process_steps, only: [:show, :update] do
      member do
        post :start
        post :pause
        post :resume
        post :complete
        post :continue_processing
      end
      resources :quality_inspections, only: [:new, :create]
    end
  end

  namespace :admin do
    resources :equipment
    resources :teams
    resources :molds
    resources :users, only: [:index, :edit, :update, :destroy]
    resources :audit_logs, only: [:index]
    resources :failed_batches, only: [:index, :show, :update] do
      member do
        post :retry
        post :resolve
      end
    end
  end

  resources :exports, only: [:index] do
    collection do
      get :work_orders
      get :quality_inspections
      get :process_efficiencies
    end
  end
end
