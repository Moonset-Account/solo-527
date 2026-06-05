module Api
  module V1
    class CredentialsController < ApplicationController
      def index
        scope = Credential.all
        scope = scope.where(person_id: params[:person_id]) if params[:person_id].present?
        scope = scope.where(verified: params[:verified]) if params[:verified].present?
        scope = scope.order(created_at: :desc)
        render_paginated(scope)
      end

      def show
        credential = Credential.find(params[:id])
        render json: credential
      end

      def create
        authorize_manage!
        credential = Credential.new(credential_params)
        if credential.save
          render json: credential, status: :created
        else
          render json: { error: credential.errors.full_messages.join(', ') }, status: :unprocessable_entity
        end
      end

      def verify
        authorize_manage!
        credential = Credential.find(params[:id])
        credential.verify!(current_user)
        render json: { message: '证件核验通过', credential: credential }
      end

      def update
        authorize_manage!
        credential = Credential.find(params[:id])
        if credential.update(credential_params)
          render json: credential
        else
          render json: { error: credential.errors.full_messages.join(', ') }, status: :unprocessable_entity
        end
      end

      private

      def credential_params
        params.permit(:person_id, :credential_type, :credential_number, :issuing_authority, :issue_date, :expiry_date, :credential_level)
      end
    end
  end
end
