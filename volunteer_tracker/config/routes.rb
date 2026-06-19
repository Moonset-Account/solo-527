require 'sidekiq/web'

Rails.application.routes.draw do
  devise_for :users

  authenticate :user, ->(u) { u.admin? } do
    mount Sidekiq::Web => '/sidekiq'
  end

  root "dashboard#index"

  get "up" => "rails/health#show", as: :rails_health_check

  resources :shifts do
    member do
      post :enroll
      post :check_in
    end
  end

  resources :shift_enrollments, only: [:index, :update, :destroy]

  resources :materials

  resources :material_transactions, only: [:index, :create]

  resources :donations do
    member do
      post :receive
      post :confirm
      post :reject
    end
  end

  resources :visit_records do
    member do
      post :start_visit
      post :complete
      post :mark_overdue
    end
    resources :overdue_reviews, only: [:new, :create, :show, :update]
  end

  resources :volunteer_services do
    member do
      post :activate
      post :pause
      post :resume
      post :complete
    end
  end

  resources :tracking_reminders, only: [:index] do
    member do
      post :mark_sent
      post :dismiss
    end
  end

  namespace :admin do
    resources :materials
    resources :material_transactions, only: [:index, :new, :create]
    get "dashboard", to: "dashboard#index", as: :dashboard
  end
end
