require 'sidekiq/web'

Rails.application.routes.draw do
  devise_for :users

  authenticate :user, ->(u) { u.executive? } do
    mount Sidekiq::Web => '/sidekiq'
  end

  root 'dashboard#index'

  resources :dashboard, only: [:index]
  resources :tickets do
    member do
      get :audit
      patch :update_status
    end
    resources :review_conclusions, shallow: true
  end
  resources :review_conclusions, only: [:index, :show]
  resources :audit_logs, only: [:index]
  resources :departments
  resources :users

  get 'up' => 'rails/health#show', as: :rails_health_check
end
