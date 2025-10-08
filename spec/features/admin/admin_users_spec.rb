require 'rails_helper'

RSpec.feature 'Admin/AdminUsers', :type => :feature do
  include_context "authenticated admin with subdomain"

  let(:text) { 'Admin Users' }

  describe 'an authenticated admin' do
    scenario 'can view admin admins page' do
      visit admin_admin_users_path
      expect(page).to have_text(text)
    end
  end
end
